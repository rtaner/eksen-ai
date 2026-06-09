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
      const prompt = `Extract data from this store dashboard PDF and return a JSON object with two keys: "storeMetrics" and "rows".
1. "storeMetrics": Extract the overall store metrics from the top sections (Sales Amount, Sales Amount LY %, Sales Quantity, Sales Quantity LY %, Cover, Conversion, IPT, ATV, FOOTFALL, Unit Price). Map them to this exact schema: { "SalesAmount": number, "SalesAmountLYPct": number, "SalesQuantity": number, "SalesQuantityLYPct": number, "Cover": number, "ConversionPct": number, "IPT": number, "ATV": number, "Footfall": number, "UnitPrice": number }. For example, if you see %51,5, return 51.5. If you see 1.578.696, return 1578696. If missing, return 0.
2. "rows": Extract the tabular data containing 'Departments' (e.g. WOMAN, MAN totals), 'Groups' (or Lifestyles) like Casual, Young, 'Classes' like Trousers, Shirts, and 'Buyers' (or Sub-Categories like Woven Top, Knitted). Extract ALL of these rows as separate objects in an array. Schema: { "Department": "string (e.g. WOMAN, MAN)", "RowType": "string ('Department', 'Lifestyle', 'Class' or 'Buyer')", "Name": "string", "StoreSalesPct": number, "RegionSalesPct": number, "SalesAmountLFLPct": number, "Cover": number, "OnWay": number, "NetFinalOccupancyPct": number, "SalesAmount": number }.
Return ONLY the raw JSON object, without any markdown blocks or explanation.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        return NextResponse.json({ error: 'Failed to extract data from PDF using AI' }, { status: 500 });
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (text.startsWith('```json')) text = text.replace(/^```json\\s*/, '').replace(/```\\s*$/, '');
      else if (text.startsWith('```')) text = text.replace(/^```\\s*/, '').replace(/```\\s*$/, '');

      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          rawRows = parsed;
        } else {
          rawRows = parsed.rows || [];
          storeMetrics = parsed.storeMetrics || null;
        }
      } catch (e) {
        console.error('Failed to parse Gemini JSON:', text);
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
    // Batch Deep Insight Processing via Gemini
    // -------------------------------------------------------------
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const deltaPackages: any[] = [];
        
        // Collect all nodes for deep analysis
        dashboardData.departments.forEach(dept => {
          dept.lifestyles.forEach(ls => {
            deltaPackages.push(getPreProcessedDeltas(ls, 'Lifestyle'));
          });
          dept.classes.forEach(cls => {
            deltaPackages.push(getPreProcessedDeltas(cls, 'Class'));
          });
          dept.buyers?.forEach(buyer => {
            deltaPackages.push(getPreProcessedDeltas(buyer, 'Buyer'));
          });
        });

        if (deltaPackages.length > 0) {
          const deepInsightPrompt = `Sen uzman bir perakende veri analisti ve mağaza yöneticisi asistanısın. Görevin, sana JSON formatında verilen metrik sapmalarını (deltaları) incelemek ve bu metrikler arasındaki KORELASYONU bularak sahadaki asıl sorunu teşhis etmektir.

PERAKENDE DİNAMİKLERİ YASALARI:
1. Pazar vs Büyüme Yasası: Ürün geçen seneye göre büyüyor olabilir (Pozitif LFL), ancak Pazar Payı bölgenin gerisindeyse ortada kaçırılan bir potansiyel vardır.
2. Görsel Sunum (VM) Yasası: Stok hızı iyi (Cover düşük) ve reyon doluluğu idealse ama bölgenin gerisinde kalınıyorsa, sorun reyondaki görsel görünürlük veya konumlandırmadır.
3. Hantal Stok (Dead Stock) Yasası: Büyüme negatif, Pazar payı düşük, Cover yüksek ve Reyon Şişkinse (Occupancy > %110), bu ürün reyonu kilitliyordur.
4. Dağınık Reyon Yasası: Stok hızı çok iyi (Cover düşük) ama Reyon hala aşırı Şişkin (Occupancy > %120) görünüyorsa, kalan az sayıdaki ürün reyona kötü yayılmıştır.

KATI KURALLAR:
- Sana JSON içinde verilmeyen hiçbir rakamı uydurma.
- Teşhisini doğrudan metrikler arasındaki korelasyona dayandır.
- Çıktıyı SADECE aşağıdaki formattaki gibi bir JSON objesi olarak ver. Başka hiçbir metin veya markdown bloğu kullanma. JSON anahtarları sana verdiğim 'id' alanıyla aynı olmalıdır.
{
  "id1": { "diagnosis": "...", "action": "..." },
  "id2": { "diagnosis": "...", "action": "..." }
}

Gelen Veri Paketi:
${JSON.stringify(deltaPackages)}
`;

          const deepResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: deepInsightPrompt }] }],
                generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
              }),
            }
          );

          if (deepResponse.ok) {
            const deepData = await deepResponse.json();
            let deepText = deepData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            
            if (deepText.startsWith('```json')) deepText = deepText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
            else if (deepText.startsWith('```')) deepText = deepText.replace(/^```\s*/, '').replace(/```\s*$/, '');

            const parsedInsights = JSON.parse(deepText);

            // Inject insights back into dashboardData
            dashboardData.departments.forEach(dept => {
              dept.lifestyles.forEach(ls => {
                const id = `${dept.name}-Lifestyle-${ls.name}`;
                if (parsedInsights[id]) {
                  ls.deepInsight = parsedInsights[id];
                }
              });
              dept.classes.forEach(cls => {
                const id = `${dept.name}-Class-${cls.name}`;
                if (parsedInsights[id]) {
                  cls.deepInsight = parsedInsights[id];
                }
              });
              dept.buyers?.forEach(buyer => {
                const id = `${dept.name}-Buyer-${buyer.name}`;
                if (parsedInsights[id]) {
                  buyer.deepInsight = parsedInsights[id];
                }
              });
            });
          }
        }
      } catch (err) {
        console.error("Deep insight generation failed:", err);
        // Continue even if deep insights fail, fallback to simple insights
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

    return NextResponse.json({ success: true, data: savedAnalysis });
  } catch (error: any) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during processing' }, { status: 500 });
  }
}
