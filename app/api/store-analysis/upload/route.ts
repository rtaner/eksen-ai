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

      const [metricsResponse, rowsResponse] = await Promise.all([
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: metricsPrompt }, { inlineData: { mimeType: 'application/pdf', data: base64Data } }] }],
              generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
            }),
          }
        ),
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: rowsPrompt }, { inlineData: { mimeType: 'application/pdf', data: base64Data } }] }],
              generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
            }),
          }
        )
      ]);

      if (!metricsResponse.ok || !rowsResponse.ok) {
        console.error('Gemini API Error - Metrics:', await metricsResponse.text(), 'Rows:', await rowsResponse.text());
        return NextResponse.json({ error: 'Failed to extract data from PDF using AI' }, { status: 500 });
      }

      const metricsData = await metricsResponse.json();
      const rowsData = await rowsResponse.json();

      let metricsText = metricsData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let rowsText = rowsData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      
      if (metricsText.startsWith('```json')) metricsText = metricsText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      else if (metricsText.startsWith('```')) metricsText = metricsText.replace(/^```\s*/, '').replace(/```\s*$/, '');

      if (rowsText.startsWith('```json')) rowsText = rowsText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      else if (rowsText.startsWith('```')) rowsText = rowsText.replace(/^```\s*/, '').replace(/```\s*$/, '');

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
          const masterPrompt = `Sen uzman bir perakende stratejisti ve Diferansiyel Teşhis motorusun. Görevin, sana verilen metrik sapmalarını ve etiketleri inceleyerek sahadaki asıl sorunu ihtimalleriyle birlikte teşhis etmektir. 

Sana verilen veri paketinde Katman 1 (Tetikleyiciler) ve Katman 2 (Bağlam) verileri vardır.
Eğer bir kategorinin tetikleyicisinde '[KRONİK]' bayrağı varsa, bu sorunun haftalardır çözülmediğini anla ve aksiyon görevini çok daha radikal (örn: merkezle görüş, alanı tamamen değiştir, personeli uyar) hale getir.

KATI KURALLAR:
1. Sana JSON içinde verilmeyen hiçbir rakamı uydurma. Halüsinasyon yapma.
2. Çıktıyı SADECE aşağıdaki formattaki gibi bir JSON objesi olarak ver. Başka hiçbir metin veya markdown bloğu kullanma. JSON anahtarları sana verdiğim 'id' alanıyla aynı olmalıdır.

BEKLENEN JSON FORMATI:
{
  "id1": {
    "main_finding": "Ana tespit cümlesi (Katman 1'deki en yüksek öncelikli tetikleyiciye göre).",
    "scenarios": [
      { "title": "İhtimal 1 Başlığı", "probability": 60, "description": "Katman 2 bağlamına göre açıklama." },
      { "title": "İhtimal 2 Başlığı", "probability": 40, "description": "Katman 2 bağlamına göre alternatif açıklama." }
    ],
    "validation_task": "Mağaza müdürüne doğrudan 'şunu yap' demek yerine, sahada hangi ihtimalin doğru olduğunu bulması için saha doğrulama görevi."
  }
}

Gelen Veri Paketi:
${JSON.stringify(topDeltaPackages)}
`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

          const deepResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: masterPrompt }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
              }),
            }
          );
          clearTimeout(timeoutId);

          if (deepResponse.ok) {
            const deepData = await deepResponse.json();
            let deepText = deepData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            
            if (deepText.startsWith('\`\`\`json')) deepText = deepText.replace(/^\`\`\`json\s*/, '').replace(/\`\`\`\s*$/, '');
            else if (deepText.startsWith('\`\`\`')) deepText = deepText.replace(/^\`\`\`\s*/, '').replace(/\`\`\`\s*$/, '');

            const parsedInsights = JSON.parse(deepText);

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
