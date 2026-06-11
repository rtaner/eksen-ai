import { NextRequest, NextResponse } from 'next/server';
import { getPreProcessedDeltas } from '@/lib/services/store-analysis-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dashboardData, prevTriggers, target } = body;

    if (!dashboardData || !target) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const prevTriggersMap = new Map<string, string>();
    if (prevTriggers && Array.isArray(prevTriggers)) {
      prevTriggers.forEach((pt: any) => prevTriggersMap.set(pt.id, pt.tag));
    }

    const deltaPackages: any[] = [];
    
    // Filter departments based on target
    let targetDepartments = [];
    if (target === 'woman') {
      targetDepartments = dashboardData.departments.filter((d: any) => d.name.toUpperCase() === 'WOMAN');
    } else if (target === 'man') {
      targetDepartments = dashboardData.departments.filter((d: any) => d.name.toUpperCase() === 'MAN');
    } else if (target === 'other') {
      targetDepartments = dashboardData.departments.filter((d: any) => d.name.toUpperCase() !== 'WOMAN' && d.name.toUpperCase() !== 'MAN');
    } else {
      // Default fallback
      targetDepartments = dashboardData.departments;
    }

    // Collect all nodes for deep analysis for TARGET DEPARTMENTS ONLY
    const processCurrNode = (n: any, type: string, deptName: string) => {
      n.Department = deptName;
      const delta = getPreProcessedDeltas(n, type, dashboardData.storeAverageCover || 0);
      if (delta.trigger.priority < 99) {
        if (prevTriggersMap.get(delta.id) === delta.trigger.tag) {
          delta.trigger.tag = `[KRONİK] ${delta.trigger.tag}`;
        }
        deltaPackages.push(delta);
      }
    };

    targetDepartments.forEach((dept: any) => {
      (dept.lifestyles || []).forEach((ls: any) => processCurrNode(ls, 'Lifestyle', dept.name));
      (dept.classes || []).forEach((cls: any) => processCurrNode(cls, 'Class', dept.name));
      (dept.buyers || []).forEach((buyer: any) => processCurrNode(buyer, 'Buyer', dept.name));
    });

    let parsedInsights = {};

    if (deltaPackages.length > 0) {
      // Sort by priority (1 is highest) and take top 15 to avoid massive payloads
      const topDeltaPackages = deltaPackages
        .sort((a, b) => a.trigger.priority - b.trigger.priority)
        .slice(0, 15);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
      }

      console.log(`[Step 2] Sending ${topDeltaPackages.length} items to Gemini for target: ${target}`);
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
      const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minute timeout for this step

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

      if (!deepResponse.ok) {
        console.error('Gemini API Error (Deep Insight):', await deepResponse.text());
        return NextResponse.json({ error: 'Failed to generate deep insights' }, { status: 500 });
      }

      const deepData = await deepResponse.json();
      let deepText = deepData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      if (deepText.startsWith('\`\`\`json')) deepText = deepText.replace(/^\`\`\`json\s*/, '').replace(/\`\`\`\s*$/, '');
      else if (deepText.startsWith('\`\`\`')) deepText = deepText.replace(/^\`\`\`\s*/, '').replace(/\`\`\`\s*$/, '');

      try {
        parsedInsights = JSON.parse(deepText);
      } catch (e) {
        console.error('Failed to parse Deep Insight JSON:', e);
      }
    }

    return NextResponse.json({ success: true, target, parsedInsights });
  } catch (error: any) {
    console.error(`Step 2 processing error for target:`, error);
    return NextResponse.json({ error: error.message || 'An error occurred during step 2' }, { status: 500 });
  }
}
