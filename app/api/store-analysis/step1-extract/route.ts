import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processStoreData, RawStoreDataRow, getPreProcessedDeltas } from '@/lib/services/store-analysis-engine';
import * as xlsx from 'xlsx';

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
      
      const metricsPrompt = `Extract the overall store metrics from the top sections of this dashboard PDF (Sales Amount, Sales Amount LY %, Sales Quantity, Sales Quantity LY %, Cover, Conversion, IPT, ATV, FOOTFALL, Unit Price). Map them to this exact schema: { "SalesAmount": number, "SalesAmountLYPct": number, "SalesQuantity": number, "SalesQuantityLYPct": number, "Cover": number, "ConversionPct": number, "IPT": number, "ATV": number, "Footfall": number, "UnitPrice": number }. For example, if you see %51,5, return 51.5. If you see 1.578.696, return 1578696. If missing, return 0. Return ONLY the raw JSON object, without any markdown blocks or explanation.`;

      const rowsPrompt = `Extract the tabular data from this store dashboard PDF into a JSON array of objects. The PDF contains rows representing 'Departments' (e.g. WOMAN, MAN totals), 'Groups' (or Lifestyles) like Casual, Young, 'Classes' like Trousers, Shirts, and 'Buyers' (or Sub-Categories like Woven Top, Knitted). Extract ALL of these rows as separate objects in the array. Do not summarize or truncate the list. Map the values to this exact schema: { "Department": "string", "RowType": "string", "Name": "string", "StoreSalesPct": number, "RegionSalesPct": number, "SalesAmountLFLPct": number, "StockQtyLFLPct": number, "SalesQuantityLFLPct": number, "Cover": number, "OnWay": number, "NetFinalOccupancyPct": number, "SalesAmount": number }. For percentage values, extract them as numbers (e.g., %25.5 -> 25.5). If missing or "Boş", use 0. Return ONLY the raw JSON array, without any markdown blocks or explanation.`;

      // We run them sequentially to avoid rate limits and too many concurrent requests to the same API
      console.log('Extracting metrics from PDF...');
      const metricsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: metricsPrompt }, { inlineData: { mimeType: 'application/pdf', data: base64Data } }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
          }),
        }
      );

      console.log('Extracting rows from PDF...');
      const rowsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: rowsPrompt }, { inlineData: { mimeType: 'application/pdf', data: base64Data } }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
          }),
        }
      );

      if (!metricsResponse.ok || !rowsResponse.ok) {
        console.error('Gemini API Error - Metrics:', await metricsResponse.text(), 'Rows:', await rowsResponse.text());
        return NextResponse.json({ error: 'Failed to extract data from PDF using AI' }, { status: 500 });
      }

      const metricsData = await metricsResponse.json();
      const rowsData = await rowsResponse.json();

      let metricsText = metricsData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let rowsText = rowsData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      
      if (metricsText.startsWith('\`\`\`json')) metricsText = metricsText.replace(/^\`\`\`json\s*/, '').replace(/\`\`\`\s*$/, '');
      else if (metricsText.startsWith('\`\`\`')) metricsText = metricsText.replace(/^\`\`\`\s*/, '').replace(/\`\`\`\s*$/, '');

      if (rowsText.startsWith('\`\`\`json')) rowsText = rowsText.replace(/^\`\`\`json\s*/, '').replace(/\`\`\`\s*$/, '');
      else if (rowsText.startsWith('\`\`\`')) rowsText = rowsText.replace(/^\`\`\`\s*/, '').replace(/\`\`\`\s*$/, '');

      try {
        storeMetrics = JSON.parse(metricsText);
        rawRows = JSON.parse(rowsText);
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
