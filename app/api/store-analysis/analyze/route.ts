import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPreProcessedDeltas } from '@/lib/services/store-analysis-engine';
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

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only owners and managers can run analysis' }, { status: 403 });
    }

    const body = await request.json();
    const { analysisId } = body;

    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
    }

    // 1. Get the current store analysis record
    const { data: analysis, error: fetchError } = await supabase
      .from('store_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (fetchError || !analysis) {
      return NextResponse.json({ error: 'Analysis record not found' }, { status: 404 });
    }

    const dashboardData = analysis.dashboard_data;
    if (!dashboardData || !dashboardData.departments) {
      return NextResponse.json({ error: 'Invalid dashboard data' }, { status: 400 });
    }

    // 2. Fetch the previous completed analysis for Chronic Issue checking
    const { data: previousAnalyses } = await supabase
      .from('store_analyses')
      .select('dashboard_data, created_at')
      .eq('organization_id', profile.organization_id)
      .lt('created_at', analysis.created_at) // older than current analysis
      .eq('status', 'completed')
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

    // 3. Collect all nodes showing anomalies for Deep Analysis
    const deltaPackages: any[] = [];
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

    dashboardData.departments.forEach((dept: any) => {
      (dept.lifestyles || []).forEach((ls: any) => processCurrNode(ls, 'Lifestyle', dept.name));
      (dept.classes || []).forEach((cls: any) => processCurrNode(cls, 'Class', dept.name));
      (dept.buyers || []).forEach((buyer: any) => processCurrNode(buyer, 'Buyer', dept.name));
    });

    const topDeltaPackages = deltaPackages
      .sort((a, b) => a.trigger.priority - b.trigger.priority)
      .slice(0, 15);

    if (topDeltaPackages.length > 0) {
      console.log(`Analyzing ${topDeltaPackages.length} items for analysis ID: ${analysisId}`);
      const masterPrompt = `Sen uzman bir perakende stratejisti ve ticari analiz danışmanısın. Görevin, sana verilen reyon/kategori performans verilerini ve hesaplanmış metrik sapmalarını (deltaları) inceleyerek, bu kategorideki asıl ticari durumu veya problemi kendi perakende mantığınla serbestçe teşhis etmektir.

Sana her ürün grubu için şu veri paketi sağlanacaktır:
- Temel Metrikler: Ciro (SalesAmount), Cover, Eldeki Stok (OnHandQty), Yoldaki Stok (OnWay).
- Hesaplanan 7 Kritik Sapma/Büyüme Verisi (Deltalar):
  1. Stok Verimliliği (Stock Score)
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

      if (!geminiResult.success) {
        console.error('Gemini API Error:', geminiResult.error);
        return NextResponse.json({ error: 'Gemini API call failed' }, { status: 500 });
      }

      const parsedInsights = parseGeminiJSON(geminiResult.text);

      // Inject insights back into dashboardData
      dashboardData.departments.forEach((dept: any) => {
        (dept.lifestyles || []).forEach((ls: any) => {
          const id = `${dept.name}-Lifestyle-${ls.name}`;
          if (parsedInsights[id]) ls.deepInsight = parsedInsights[id];
        });
        (dept.classes || []).forEach((cls: any) => {
          const id = `${dept.name}-Class-${cls.name}`;
          if (parsedInsights[id]) cls.deepInsight = parsedInsights[id];
        });
        (dept.buyers || []).forEach((buyer: any) => {
          const id = `${dept.name}-Buyer-${buyer.name}`;
          if (parsedInsights[id]) buyer.deepInsight = parsedInsights[id];
        });
      });
    }

    // 3.5. Generate Store Executive Report
    if (apiKey) {
      try {
        const analysisDate = new Date(analysis.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
        const storeMetrics = dashboardData.storeMetrics || {
          SalesAmount: 0,
          SalesAmountLYPct: 0,
          SalesQuantity: 0,
          SalesQuantityLYPct: 0,
          Cover: 0,
          ConversionPct: 0,
          IPT: 0,
          ATV: 0,
          Footfall: 0
        };

        const deptSummary = dashboardData.departments.map((dept: any) => ({
          name: dept.name,
          StoreSalesPct: dept.StoreSalesPct,
          SalesAmountLFLPct: dept.SalesAmountLFLPct,
          Cover: dept.Cover,
          NetFinalOccupancyPct: dept.NetFinalOccupancyPct,
          anomalies: [
            ...(dept.lifestyles || []).map((ls: any) => {
              const delta = getPreProcessedDeltas(ls, 'Lifestyle', dashboardData.storeAverageCover || 0);
              return delta.trigger.priority < 99 ? { name: ls.name, tag: delta.trigger.tag, desc: delta.trigger.description } : null;
            }),
            ...(dept.classes || []).map((cls: any) => {
              const delta = getPreProcessedDeltas(cls, 'Class', dashboardData.storeAverageCover || 0);
              return delta.trigger.priority < 99 ? { name: cls.name, tag: delta.trigger.tag, desc: delta.trigger.description } : null;
            }),
            ...(dept.buyers || []).map((buyer: any) => {
              const delta = getPreProcessedDeltas(buyer, 'Buyer', dashboardData.storeAverageCover || 0);
              return delta.trigger.priority < 99 ? { name: buyer.name, tag: delta.trigger.tag, desc: delta.trigger.description } : null;
            })
          ].filter(Boolean)
        }));

        // Fetch Store Glossary (Special Jargon)
        const { data: glossaryData } = await supabase
          .from('store_glossary')
          .select('term, definition')
          .order('term', { ascending: true });

        const glossaryText = (glossaryData || [])
          .map((g: any) => `- "${g.term}": ${g.definition}`)
          .join('\n');

        // Fetch Store-Level Notes & Tasks + Recent Personnel Performance Notes
        const { data: storeNotesData } = await supabase
          .from('notes')
          .select('content, sentiment, created_at, is_store_level')
          .order('created_at', { ascending: false })
          .limit(15);

        const { data: storeTasksData } = await supabase
          .from('tasks')
          .select('description, status, deadline, is_store_level')
          .order('created_at', { ascending: false })
          .limit(15);

        const storeNotesText = (storeNotesData || [])
          .map((n: any) => `- [${n.is_store_level ? 'MAĞAZA GENEL NOTU' : 'PERSONEL/EKİP NOTU'}] (${new Date(n.created_at).toLocaleDateString('tr-TR')}): ${n.content}`)
          .join('\n');

        const storeTasksText = (storeTasksData || [])
          .map((t: any) => `- [${t.is_store_level ? 'MAĞAZA GENEL GÖREVİ' : 'PERSONEL GÖREVİ'}] Durum: ${t.status === 'closed' ? 'Tamamlandı' : 'Açık'} - ${t.description}`)
          .join('\n');

        const execPrompt = `Sen Bozüyük AVM mağazası için çalışan uzman bir perakende stratejistisin.
Görevin, mağazanın haftalık performans verilerini, sahada tutulan mağaza/personel notlarını ve dışsal faktörleri (lokasyon karakteri, takvim olayları, mevsimsellik) harmanlayarak mağaza müdürüne yönelik stratejik bir "Yönetici Teşhis ve Aksiyon Raporu" hazırlamaktır.

MAĞAZA ÖZEL TERİMLER SÖZLÜĞÜ (JARGON & TANIMLAR):
Aşağıdaki terimler bu mağaza bünyesinde özel anlamlara sahiptir. Sahada tutulan notları ve verileri değerlendirirken bu özel tanımları ESAS AL:
${glossaryText || 'Özel terim tanımlanmamış.'}

LOKASYON BİLGİSİ:
Bozüyük AVM, Türkiye'nin en kritik transit karayolu geçiş güzergahlarından biri üzerinde yer alır. Şehirler arası seyahat eden tatilciler, aileler ve yolcular için önemli bir duraklama, dinlenme ve alışveriş noktasıdır. Mağazanın başarısı, bu transit yolcu trafiğini yakalamasına ve doğru ürün gruplarını (yolculuk, seyahat, hızlı tüketim, pratik giyim, hediye vb.) öne çıkarmasına doğrudan bağlıdır.

ANALİZ TARİHİ: ${analysisDate} (Bu tarihe dayanarak yaklaşan resmi tatilleri, okulların kapanma dönemini, bayramları veya Babalar Günü gibi özel perakende günlerini otomatik tespit et ve yorumla. Örneğin Haziran ortası ise yaz tatili yolcu trafiğinin başlaması ve Babalar Günü gündemdedir. Tarihsel ve mevsimsel koşulları en gerçekçi şekilde bağdaştır.)

MAĞAZA GENEL METRİKLERİ:
- Ciro: ${storeMetrics.SalesAmount.toLocaleString('tr-TR')} TL (Geçen yıla göre büyüme: %${storeMetrics.SalesAmountLYPct})
- Satış Adedi: ${storeMetrics.SalesQuantity.toLocaleString('tr-TR')} adet (Geçen yıla göre büyüme: %${storeMetrics.SalesQuantityLYPct})
- Mağaza Cover (Stok Devir Süresi): ${storeMetrics.Cover} hafta
- Mağaza Ortalama Dönüşüm Oranı (Conversion): %${storeMetrics.ConversionPct}
- Mağaza Ortalama Sepet Adedi (IPT): ${storeMetrics.IPT}
- Mağaza Ortalama Sepet Tutarı (ATV): ${storeMetrics.ATV} TL
- Toplam Ziyaretçi Sayısı (Footfall): ${storeMetrics.Footfall}

MAĞAZA SAHA NOTLARI VE UYARILAR:
${storeNotesText || 'Henüz saha notu girilmemiş.'}

MAĞAZA VE EKİP GÖREVLERİ (YAPILACAKLAR LISTESI):
${storeTasksText || 'Henüz görev kaydı bulunmuyor.'}

DEPARTMAN VE REYON BAZLI ÖZET VERİLER VE ANOMALİLER:
${JSON.stringify(deptSummary, null, 2)}

PERAKENDE ANALİZ KURALLARI:
1. Sayısal verilerle dışsal etkenleri (Bozüyük yol güzergahı, hava sıcaklığı, tatilci trafiği, özel günler) doğrudan ilişkilendir. Örneğin:
   - Eğer okullar yeni kapanıyorsa ve tatilci trafiği artacaksa, seyahat, plaj, casual ürün grupları ve çocuk/bebek reyonlarındaki stok durumu ne olmalı?
   - Babalar Günü yaklaşıyorsa erkek reyonundaki hediyeleşme trafiği, satış payı kayıpları veya stok yükleri nasıl yönetilmeli?
   - Sıcak havalarda reyonlarda hangi ürünler öne çıkarılmalı?
2. Mağaza müdürünün sahada hemen uygulayabileceği çok somut, aksiyon odaklı adımlar öner.
3. Rapor dilini profesyonel, yapıcı, yönlendirici ve teşvik edici tut.

Lütfen çıktıyı SADECE aşağıdaki geçerli JSON formatında üret. JSON dışında hiçbir markdown biçimlendirmesi veya açıklama ekleme:
{
  "executive_summary": "Genel mağaza durumu, gidişat ve dış etkenlerin etkisini özetleyen 2-3 cümlelik yönetici özeti.",
  "diagnoses": [
    {
      "title": "Teşhis Başlığı (Örn: Seyahat Sezonu Başlangıcı ve Plaj Grubu Fırsatı)",
      "description": "Veri ve dış etken ilişkisine dayalı detaylı durum tespiti."
    }
  ],
  "action_plans": [
    {
      "area": "Aksiyon Alınacak Reyon/Alan",
      "actions": [
        "Somut eylem adımı 1",
        "Somut eylem adımı 2"
      ]
    }
  ]
}
`;

        console.log(`Generating store executive report for analysis ID: ${analysisId}`);
        const geminiExecutiveResult = await callGeminiNext({
          apiKey,
          prompt: execPrompt,
          temperature: 0.2,
          model: 'gemini-3.5-flash',
        });

        if (geminiExecutiveResult.success) {
          const parsedExecReport = parseGeminiJSON(geminiExecutiveResult.text);
          dashboardData.executiveReport = parsedExecReport;
          console.log("Successfully generated and parsed store executive report");
        } else {
          console.error("Gemini Executive Report API error:", geminiExecutiveResult.error);
        }
      } catch (execErr: any) {
        console.error("Store executive report generation failed:", execErr);
      }
    }

    // 4. Update the database record
    const { error: updateError } = await supabase
      .from('store_analyses')
      .update({
        dashboard_data: dashboardData,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error('DB Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to update analysis record in database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: dashboardData });

  } catch (error: any) {
    console.error('Analyze route error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during analysis' }, { status: 500 });
  }
}
