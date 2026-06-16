import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPreProcessedDeltas } from '@/lib/services/store-analysis-engine';

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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
      }

      console.log(`Analyzing ${topDeltaPackages.length} items for analysis ID: ${analysisId}`);
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: masterPrompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API Error:', errText);
        return NextResponse.json({ error: 'Gemini API call failed' }, { status: 500 });
      }

      const responseData = await response.json();
      let responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedInsights = JSON.parse(responseText);

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
