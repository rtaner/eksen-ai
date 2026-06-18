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
      
      const metricsPrompt = `Extract the overall store metrics from the top sections of this dashboard PDF (Sales Amount, Sales Amount LY %, Sales Quantity, Sales Quantity LY %, Cover, Conversion, IPT, ATV, FOOTFALL, Unit Price). Map them to this exact schema: { "SalesAmount": number, "SalesAmountLYPct": number, "SalesQuantity": number, "SalesQuantityLYPct": number, "Cover": number, "ConversionPct": number, "IPT": number, "ATV": number, "Footfall": number, "UnitPrice": number }. For example, if you see %51,5, return 51.5. If you see 1.578.696, return 1578696. If missing, return 0. Return ONLY the raw JSON object, without any markdown blocks or explanation.`;

      const rowsPrompt = `Extract the tabular data from this store dashboard PDF into a JSON array of objects. The PDF contains rows representing 'Departments' (e.g. WOMAN, MAN totals), 'Groups' (or Lifestyles) like Casual, Young, 'Classes' like Trousers, Shirts, and 'Buyers' (or Sub-Categories like Woven Top, Knitted). Extract ALL of these rows as separate objects in the array. Do not summarize or truncate the list. Map the values to this exact schema: { "Department": "string", "RowType": "string", "Name": "string", "StoreSalesPct": number, "RegionSalesPct": number, "SalesAmountLFLPct": number, "StockQtyLFLPct": number, "SalesQuantityLFLPct": number, "Cover": number, "OnWay": number, "NetFinalOccupancyPct": number, "SalesAmount": number }. For percentage values, extract them as numbers (e.g., %25.5 -> 25.5). If missing or "Boş", use 0. Return ONLY the raw JSON array, without any markdown blocks or explanation.`;

      const [metricsResult, rowsResult] = await Promise.all([
        callGeminiNext({
          apiKey,
          prompt: metricsPrompt,
          pdfBase64: base64Data,
          temperature: 0.1,
          model: 'gemini-3.5-flash',
        }),
        callGeminiNext({
          apiKey,
          prompt: rowsPrompt,
          pdfBase64: base64Data,
          temperature: 0.1,
          model: 'gemini-3.5-flash',
        })
      ]);

      if (!metricsResult.success || !rowsResult.success) {
        console.error('Gemini API Error - Metrics:', metricsResult.error, 'Rows:', rowsResult.error);
        return NextResponse.json({ error: 'Failed to extract data from PDF using AI' }, { status: 500 });
      }

      try {
        storeMetrics = parseGeminiJSON(metricsResult.text);
        rawRows = parseGeminiJSON(rowsResult.text);
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
    const prevTriggers = new Map<string, string>();

    if (prevDashboard) {
      const processPrevNode = (n: any, type: string, deptName: string) => {
        n.Department = deptName;
        const delta = getPreProcessedDeltas(n, type, prevDashboard.storeAverageCover || 0);
        if (delta.trigger.priority < 99) {
          prevTriggers.set(delta.id, delta.trigger.tag);
        }
      };
      prevDashboard.departments?.forEach((dept: any) => {
        (dept.lifestyles || []).forEach((n: any) => processPrevNode(n, 'Lifestyle', dept.name));
        (dept.classes || []).forEach((n: any) => processPrevNode(n, 'Class', dept.name));
        (dept.buyers || []).forEach((n: any) => processPrevNode(n, 'Buyer', dept.name));
      });
    }

    // -------------------------------------------------------------
    // Batch Deep Insight Processing via Gemini
    // -------------------------------------------------------------
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const deltaPackages: any[] = [];
        
        // Collect all nodes for deep analysis
        const processCurrNode = (n: any, type: string, deptName: string) => {
          n.Department = deptName;
          const delta = getPreProcessedDeltas(n, type, dashboardData.storeAverageCover || 0);
          if (delta.trigger.priority < 99) {
            if (prevTriggers.get(delta.id) === delta.trigger.tag) {
              delta.trigger.tag = `[KRONİK] ${delta.trigger.tag}`;
            }
            deltaPackages.push(delta);
          }
        };

        dashboardData.departments.forEach(dept => {
          dept.lifestyles.forEach(ls => processCurrNode(ls, 'Lifestyle', dept.name));
          dept.classes.forEach(cls => processCurrNode(cls, 'Class', dept.name));
          dept.buyers?.forEach(buyer => processCurrNode(buyer, 'Buyer', dept.name));
        });

        // Limit the number of deep insights to avoid LLM timeouts and token limits
        // Sort by priority (1 is highest) and take top 15
        const topDeltaPackages = deltaPackages
          .sort((a, b) => a.trigger.priority - b.trigger.priority)
          .slice(0, 15);

        if (topDeltaPackages.length > 0) {
          console.log(`Sending ${topDeltaPackages.length} items to Gemini for deep insight generation.`);
          const masterPrompt = `Sen uzman bir perakende stratejisti ve ticari analiz danışmanısın. Görevin, sana verilen reyon/kategori performans verilerini ve hesaplanmış metrik sapmalarını (deltaları) inceleyerek, bu kategorideki asıl ticari durumu veya problemi kendi perakende mantığınla serbestçe teşhis etmektir.

Sana her ürün grubu için şu veri paketi sağlanacaktır:
- Temel Metrikler: Ciro (SalesAmount), Cover, Eldeki Stok (OnHandQty), Yoldaki Stok (OnWay).
- Hesaplanan 7 Kritik Sapma/Büyüme Verisi (Deltalar):
  1. Alan Verimliliği Oranı (Space Score)
  2. Bölgesel Satış Payı Farkı (Market Power Gap)
  3. Stok Devir Hızı Sapması (Velocity Deviation)
  4. Ciro Büyüme Oranı LFL % (sales_lfl_pct)
  5. Adet Büyüme Oranı LFL % (sales_qty_lfl_pct)
  6. Stok Büyüme Oranı LFL % (stock_qty_lfl_pct)
  7. Stok - Satış Payı Farkı (SalesAmountPct)

ANALİZ VE TİCARİ YORUMLAMA KURALLARI:
1. Özgür Analiz: Sağlanan tüm metriklerin kombinasyonunu inceleyerek kendi çıkarımlarını ve yorumlarını oluştur. Sınırlayıcı şablonlara bağlı kalma. Teşhislerinde mağaza operasyonları, fiyatlama, lojistik, reyon düzeni veya beden kırıklıkları gibi ticari ihtimalleri özgürce değerlendir.
2. [KRONİK] Durumlar: Eğer kategoride '[KRONİK]' etiketi varsa, bu sorunun uzun süredir devam ettiğini gör ve mağaza müdürüne daha radikal/hızlı aksiyon önerileri sun.
3. Çıktı Formatı: Çıktıyı SADECE aşağıdaki geçerli JSON objesi formatında ver. Markdown kod blokları veya herhangi bir açıklama metni ekleme. JSON anahtarları sana verilen 'id' değeri ile birebir aynı olmalıdır.

BEKLENEN JSON FORMATI:
{
  "kategori_id_degeri": {
    "main_finding": "Yapay zekanın kendi ticari birikimiyle yaptığı kapsamlı ana durum teşhisi.",
    "scenarios": [
      { "title": "Olası Neden 1", "probability": 60, "description": "Metrik kombinasyonlarına dayanan detaylı operasyonel sebep senaryosu." },
      { "title": "Olası Neden 2", "probability": 40, "description": "Alternatif olası durum veya sebep açıklaması." }
    ],
    "validation_task": "Mağaza yöneticisinin sahada bu teşhisi doğrulamak için yapması gereken kontrol görevi."
  }
}

Gelen Veri Paketi:
${JSON.stringify(topDeltaPackages)}
`;

          const geminiResult = await callGeminiNext({
            apiKey,
            prompt: masterPrompt,
            temperature: 0.1,
            model: 'gemini-3.5-flash',
          });

          if (geminiResult.success) {
            const parsedInsights = parseGeminiJSON(geminiResult.text);

            // Inject insights back into dashboardData
            dashboardData.departments.forEach(dept => {
              dept.lifestyles.forEach(ls => {
                const id = `${dept.name}-Lifestyle-${ls.name}`;
                if (parsedInsights[id]) ls.deepInsight = parsedInsights[id];
              });
              dept.classes.forEach(cls => {
                const id = `${dept.name}-Class-${cls.name}`;
                if (parsedInsights[id]) cls.deepInsight = parsedInsights[id];
              });
              dept.buyers?.forEach(buyer => {
                const id = `${dept.name}-Buyer-${buyer.name}`;
                if (parsedInsights[id]) buyer.deepInsight = parsedInsights[id];
              });
            });
          }
        }
      } catch (err) {
        console.error("Deep insight generation failed:", err);
      }
    }

    // Save to database
    const { data: savedAnalysis, error: dbError } = await supabase
      .from('store_analyses')
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        status: 'completed',
        dashboard_data: dashboardData
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save analysis to database' }, { status: 500 });
    }

    // Cleanup old records to keep only the 3 latest store_analyses and ai_analysis_jobs
    try {
      const orgId = profile.organization_id;

      // Clean store_analyses
      const { data: analyses } = await supabase
        .from('store_analyses')
        .select('id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (analyses && analyses.length > 3) {
        const idsToDelete = analyses.slice(3).map((a: any) => a.id);
        await supabase
          .from('store_analyses')
          .delete()
          .in('id', idsToDelete);
      }

      // Clean ai_analysis_jobs
      const { data: jobs } = await supabase
        .from('ai_analysis_jobs')
        .select('id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (jobs && jobs.length > 3) {
        const idsToDelete = jobs.slice(3).map((j: any) => j.id);
        await supabase
          .from('ai_analysis_jobs')
          .delete()
          .in('id', idsToDelete);
      }
    } catch (cleanError) {
      console.error('Record cleanup failed:', cleanError);
    }

    return NextResponse.json({ success: true, data: savedAnalysis });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during processing' }, { status: 500 });
  }
}
