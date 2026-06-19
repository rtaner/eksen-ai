import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processStoreData, RawStoreDataRow, getPreProcessedDeltas } from '@/lib/services/store-analysis-engine';
import * as xlsx from 'xlsx';
import { callGeminiNext, parseGeminiJSON } from '@/lib/utils/gemini';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user and role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can upload store analysis data' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let rawRows: RawStoreDataRow[] = [];
    let storeMetrics: any = null;

    // Parse based on file type
    if (file.name.endsWith('.json')) {
      const text = buffer.toString('utf-8');
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        rawRows = parsed;
      } else {
        rawRows = parsed.rows || [];
        storeMetrics = parsed.storeMetrics || null;
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = xlsx.utils.sheet_to_json(sheet);
    } else if (file.name.endsWith('.pdf')) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API Key is not configured for PDF extraction.' }, { status: 500 });
      }

      const base64Data = buffer.toString('base64');
      
      const prompt = `Extract both the overall store metrics and the tabular data from this store dashboard PDF.
1. Store Metrics: from the top sections (Sales Amount, Sales Amount LY %, Sales Quantity, Sales Quantity LY %, Cover, Conversion, IPT, ATV, FOOTFALL, Unit Price).
2. Rows: from the table. The PDF contains rows representing 'Departments', 'Groups' (or Lifestyles) like Casual, 'Classes', and 'Buyers'. Extract ALL of these rows.
For percentage values, extract them as plain numbers (e.g., %25.5 -> 25.5). If missing or "Boş", use 0. Make sure to extract 'Stock Cost %' and map it to 'StockCostPct'.

CRITICAL COLUMN ALIGNMENT RULE:
The columns in the PDF table must correspond exactly to their mapped JSON properties:
- 'Sales Quantity' (pieces sold) must map to 'SalesQuantity'.
- 'Stock Qty OnHand' must map to 'OnHandQty'.
- 'Stock Qty LFL %' must map to 'StockQtyLFLPct'.
- 'Cover' must map to 'Cover'.
- 'Stock Qty OnWay' must map to 'OnWay'.
- 'Net Final Occupancy' must map to 'NetFinalOccupancyPct'.
CRITICAL RULE FOR BLANK CELLS:
Some cells or columns in the table may be blank or empty (especially 'Stock Qty LFL %' or 'Stock Qty OnWay'). Because all fields are required in the schema, you MUST output a hyphen ("-"), zero ("0"), or "Boş" for any blank or empty cells.
NEVER shift values to the left to fill missing/blank columns. For example, if 'Stock Qty LFL %' is blank in a row, the 'Cover' value (e.g., "8.3") must NOT be placed into 'StockQtyLFLPct'. It must remain in 'Cover', and 'StockQtyLFLPct' must be set to "-" or "0" or "Boş".`;

      const responseSchema = {
        type: "OBJECT",
        properties: {
          metrics: {
            type: "OBJECT",
            properties: {
              SalesAmount: { type: "NUMBER" },
              SalesAmountLYPct: { type: "NUMBER" },
              SalesQuantity: { type: "NUMBER" },
              SalesQuantityLYPct: { type: "NUMBER" },
              Cover: { type: "NUMBER" },
              ConversionPct: { type: "NUMBER" },
              IPT: { type: "NUMBER" },
              ATV: { type: "NUMBER" },
              Footfall: { type: "NUMBER" },
              UnitPrice: { type: "NUMBER" }
            },
            required: ["SalesAmount", "SalesAmountLYPct", "SalesQuantity", "SalesQuantityLYPct", "Cover", "ConversionPct", "IPT", "ATV", "Footfall", "UnitPrice"]
          },
          rows: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                Department: { type: "STRING" },
                RowType: { type: "STRING" },
                Name: { type: "STRING" },
                SalesAmount: { type: "NUMBER" },
                SalesAmountLFLPct: { type: "NUMBER" },
                SalesQuantity: { type: "NUMBER" },
                SalesQuantityLFLPct: { type: "NUMBER" },
                RegionSalesPct: { type: "NUMBER" },
                StoreSalesPct: { type: "NUMBER" },
                StockCostPct: { type: "NUMBER" },
                OnHandQty: { type: "NUMBER" },
                StockQtyLFLPct: { type: "NUMBER" },
                Cover: { type: "NUMBER" },
                OnWay: { type: "NUMBER" },
                NetFinalOccupancyPct: { type: "NUMBER" }
              },
              required: ["Department", "RowType", "Name", "SalesAmount", "SalesAmountLFLPct", "SalesQuantity", "SalesQuantityLFLPct", "RegionSalesPct", "StoreSalesPct", "StockCostPct", "OnHandQty", "StockQtyLFLPct", "Cover", "OnWay", "NetFinalOccupancyPct"]
            }
          }
        },
        required: ["metrics", "rows"]
      };

      console.log('Extracting metrics and rows from PDF in a single call...');
      const geminiResult = await callGeminiNext({
        apiKey,
        prompt,
        pdfBase64: base64Data,
        responseSchema,
        temperature: 0.1,
        model: 'gemini-3.5-flash',
      });

      if (!geminiResult.success) {
        console.error('Gemini API Error:', geminiResult.error);
        return NextResponse.json({ error: 'Failed to extract data from PDF using AI' }, { status: 500 });
      }

      try {
        const parsedData = parseGeminiJSON(geminiResult.text);
        storeMetrics = parsedData.metrics || null;
        rawRows = parsedData.rows || [];
        if (!Array.isArray(rawRows)) {
          rawRows = [];
        }
      } catch (e) {
        console.error('Failed to parse Gemini JSON:', e);
        return NextResponse.json({ error: 'AI failed to extract valid JSON data from PDF' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use JSON, Excel, or PDF.' }, { status: 400 });
    }

    // Process data synchronously
    const dashboardData = processStoreData(rawRows);
    if (storeMetrics) {
      dashboardData.storeMetrics = storeMetrics;
    }

    // -------------------------------------------------------------
    // Fetch previous analysis for Chronic Issue Checking
    // -------------------------------------------------------------
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const twentyOneDaysAgo = new Date();
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

    const { data: previousAnalyses } = await supabase
      .from('store_analyses')
      .select('dashboard_data, created_at')
      .eq('organization_id', profile.organization_id)
      .lte('created_at', sixDaysAgo.toISOString())
      .gte('created_at', twentyOneDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    const prevDashboard = previousAnalyses?.[0]?.dashboard_data;
    const prevTriggersMap = new Map<string, string>();

    if (prevDashboard) {
      const processPrevNode = (n: any, type: string, deptName: string) => {
        n.Department = deptName;
        const delta = getPreProcessedDeltas(n, type, prevDashboard.storeAverageCover || 0);
        if (delta.trigger.priority < 99) {
          prevTriggersMap.set(delta.id, delta.trigger.tag);
        }
      };
      prevDashboard.departments?.forEach((dept: any) => {
        (dept.lifestyles || []).forEach((n: any) => processPrevNode(n, 'Lifestyle', dept.name));
        (dept.classes || []).forEach((n: any) => processPrevNode(n, 'Class', dept.name));
        (dept.buyers || []).forEach((n: any) => processPrevNode(n, 'Buyer', dept.name));
      });
    }

    // Convert Map to array of objects so it can be JSON serialized
    const prevTriggers = Array.from(prevTriggersMap.entries()).map(([id, tag]) => ({ id, tag }));

    // Return the dashboardData and prevTriggers to the frontend.
    // Deep insight generation will happen in Step 2.
    return NextResponse.json({ success: true, data: { dashboardData, prevTriggers, organization_id: profile.organization_id } });
  } catch (error: any) {
    console.error('Extract processing error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during extraction' }, { status: 500 });
  }
}
