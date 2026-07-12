import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateUser } from '../_shared/supabase-client.ts';
import { callGemini } from '../_shared/gemini.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const { user, supabase } = await validateUser(authHeader);

    const { checklistId, dateRangeStart, dateRangeEnd } = await req.json();

    if (!checklistId || !dateRangeStart || !dateRangeEnd) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: checklistId, dateRangeStart, dateRangeEnd' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch checklist details
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .select('id, title, description, items')
      .eq('id', checklistId)
      .single();

    if (checklistError || !checklist) {
      return new Response(
        JSON.stringify({ error: 'Checklist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const items = checklist.items || [];

    // 2. Fetch checklist results inside date range
    const { data: results, error: resultsError } = await supabase
      .from('checklist_results')
      .select(`
        id,
        score,
        completed_items,
        total_items,
        closing_note,
        item_comments,
        completed_at,
        completed_by,
        profiles:completed_by (
          name,
          surname
        )
      `)
      .eq('checklist_id', checklistId)
      .gte('completed_at', dateRangeStart)
      .lte('completed_at', dateRangeEnd)
      .order('completed_at', { ascending: true });

    if (resultsError) {
      console.error('Error fetching checklist results:', resultsError);
      throw resultsError;
    }

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Seçilen tarih aralığında doldurulmuş checklist sonucu bulunamadı.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch checklist assignments to map checklist result to personnel
    const { data: assignments, error: assignmentsError } = await supabase
      .from('checklist_assignments')
      .select(`
        checklist_result_id,
        personnel:personnel_id (
          id,
          name
        )
      `)
      .in('checklist_result_id', results.map((r: any) => r.id));

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    }

    // Map result ID to personnel name
    const resultToPersonnelMap = new Map();
    (assignments || []).forEach((asg: any) => {
      if (asg.checklist_result_id && asg.personnel) {
        resultToPersonnelMap.set(asg.checklist_result_id, asg.personnel.name);
      }
    });

    // 4. Calculate stats programmatically
    const totalCount = results.length;
    let scoreSum = 0;
    
    // Track fail rates for each checklist item
    const itemFailCounts: Record<string, number> = {};
    items.forEach((item: any) => {
      itemFailCounts[item.id] = 0;
    });

    // Track personnel statistics
    const personnelStatsMap: Record<string, { sum: number; count: number; completedItemsCount: number; totalItemsCount: number }> = {};

    results.forEach((res: any) => {
      const score = Number(res.score) || 0;
      scoreSum += score;

      const completedItemIds = Array.isArray(res.completed_items) ? res.completed_items : [];
      
      // Count uncompleted items
      items.forEach((item: any) => {
        if (!completedItemIds.includes(item.id)) {
          itemFailCounts[item.id] = (itemFailCounts[item.id] || 0) + 1;
        }
      });

      // Track by personnel
      const personnelName = resultToPersonnelMap.get(res.id) || 'Atanmamış';
      if (!personnelStatsMap[personnelName]) {
        personnelStatsMap[personnelName] = { sum: 0, count: 0, completedItemsCount: 0, totalItemsCount: 0 };
      }
      personnelStatsMap[personnelName].sum += score;
      personnelStatsMap[personnelName].count += 1;
      personnelStatsMap[personnelName].completedItemsCount += completedItemIds.length;
      personnelStatsMap[personnelName].totalItemsCount += (res.total_items || items.length);
    });

    const averageScore = scoreSum / totalCount;

    // Format item failure rates
    const itemStats = items.map((item: any) => {
      const failCount = itemFailCounts[item.id] || 0;
      const failRate = totalCount > 0 ? (failCount / totalCount) * 100 : 0;
      return {
        id: item.id,
        text: item.text,
        order: item.order,
        failCount,
        failRate: Number(failRate.toFixed(1)),
        successRate: Number((100 - failRate).toFixed(1)),
      };
    }).sort((a: any, b: any) => b.failRate - a.failRate);

    // Format personnel stats
    const personnelStats = Object.entries(personnelStatsMap).map(([name, stat]) => {
      return {
        name,
        averageScore: Number((stat.sum / stat.count).toFixed(2)),
        runsCount: stat.count,
        completionRate: Number(((stat.completedItemsCount / stat.totalItemsCount) * 100).toFixed(1)),
      };
    }).sort((a: any, b: any) => b.averageScore - a.averageScore);

    // 5. Structure prompt for Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured on Supabase');
    }

    // Format details of each run for the prompt
    const runsDetails = results.map((res: any, idx: number) => {
      const pName = resultToPersonnelMap.get(res.id) || 'Atanmamış';
      const evaluator = res.profiles ? `${res.profiles.name} ${res.profiles.surname}` : 'Sistem';
      const completedList = (res.completed_items || []);
      const itemComments = res.item_comments || {};
      
      const uncompletedList = items
        .filter((it: any) => !completedList.includes(it.id))
        .map((it: any) => {
          const comment = itemComments[it.id] ? ` (Yorum: "${itemComments[it.id]}")` : '';
          return `${it.order}. ${it.text}${comment}`;
        });
        
      const completedWithComments = items
        .filter((it: any) => completedList.includes(it.id) && itemComments[it.id])
        .map((it: any) => `${it.order}. ${it.text} (Yorum: "${itemComments[it.id]}")`);
      
      return `Değerlendirme #${idx + 1}
Tarih: ${new Date(res.completed_at).toLocaleDateString('tr-TR')}
Reyon Sorumlusu (Personel): ${pName}
Değerlendiren Yönetici: ${evaluator}
Genel Skor: ${res.score}/5.00
Yapılmayan Maddeler:
${uncompletedList.length > 0 ? uncompletedList.join('\n') : 'Hepsi yapıldı.'}
${completedWithComments.length > 0 ? `Yapılan Maddelerdeki Önemli Notlar:\n${completedWithComments.join('\n')}\n` : ''}Yönetici Kapanış Notu: ${res.closing_note || 'Yok'}`;
    }).join('\n\n');

    const prompt = `Sen kıdemli bir mağazacılık ve perakende danışmanısın. Bir departmanın (reyonun) belirli bir tarihteki checklist sonuçlarını ve maddelerini analiz edeceksin.
Bu reyonun ismi: "${checklist.title}"
Açıklaması: "${checklist.description || 'Açıklama yok'}"

Tarih Aralığı: ${new Date(dateRangeStart).toLocaleDateString('tr-TR')} - ${new Date(dateRangeEnd).toLocaleDateString('tr-TR')}
Toplam doldurulan checklist sayısı: ${totalCount}
Reyonun genel başarı puan ortalaması: ${averageScore.toFixed(2)}/5.00

Sana aşağıda bu checklist'e ait maddelerin genel hata/yapılmama oranları ve her bir checklist doldurma işleminin detayları verilmiştir. 
Bu verileri derinlemesine inceleyerek reyon performansı, sürekli hata veren maddeler (kronikleşmiş arızalar), personel verimliliği ve yapılması gerekenler hakkında kapsamlı bir perakende yönetim raporu hazırla.

### Reyon Maddeleri Hata Oranları (En çok hata verenden en aza):
${itemStats.map((it: any) => `- ${it.text} (Hata Oranı: %${it.failRate}, ${totalCount} kontrolde ${it.failCount} kez yapılmadı)`).join('\n')}

### Personel Performansları (Reyon Sorumluları):
${personnelStats.map((p: any) => `- ${p.name} (Ortalama Puanı: ${p.averageScore}/5.00, Doldurulan checklist: ${p.runsCount}, Ortalama Görev Tamamlama: %${p.completionRate})`).join('\n')}

### Detaylı Değerlendirme Kayıtları:
${runsDetails}

### RAPOR FORMATI VE İÇERİK REHBERİ:
Lütfen analiz raporunu profesyonel ve yöneticiye sunulacak kalitede, Türkçe dilinde ve aşağıdaki başlıklarla markdown formatında yaz:

1. **📊 Reyon Genel Durum Teşhisi**
   - Reyonun genel performansı nasıl? Ortalama skoru perakende standartlarına göre nasıl yorumlarsın? İyi giden ve kötüye giden eğilimler neler?

2. **⚠️ Kronik Hatalar ve Kök Neden Analizi (Arıza Noktaları)**
   - Hangi maddeler sürekli yapılmıyor/hata veriyor?
   - Bu maddelerin yapılmamasının arkasındaki olası perakende/operasyonel sebepler neler olabilir? (Örn: Lojistik, personel eğitimi eksikliği, reyon yoğunluğu, ekipman eksikliği vb.)

3. **👥 Personel Verimlilik Karşılaştırması**
   - Hangi personel bu reyonda daha başarılı, hangisi daha az verimli?
   - Personellerin puanları ve görev tamamlama oranları arasındaki farkları nasıl yorumlarsın? Reyondaki günlük atamalarda verimliliği artırmak için ne önerirsin?

4. **🚀 Aksiyon Planı ve Somut Öneriler**
   - Kronikleşen hataları çözmek için mağaza müdürünün acilen atması gereken adımlar neler olmalıdır?
   - Personel eğitimleri, vardiya/atama planlaması veya reyon düzeni hakkında nokta atışı operasyonel öneriler sun.

Markdown çıktısında profesyonel bir dil kullan, gereksiz cümlelerden kaçın ve verileri analiz ederek doğrudan aksiyona yönelik çıktılar üret.`;

    const geminiResponse = await callGemini(prompt, {
      apiKey: geminiApiKey,
      model: 'gemini-3.5-flash',
      temperature: 0.2,
      responseMimeType: 'text/plain',
    });

    if (!geminiResponse.success) {
      throw new Error(`Gemini reyon analiz hatası: ${geminiResponse.error}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalCount,
          averageScore: Number(averageScore.toFixed(2)),
          itemStats,
          personnelStats,
        },
        analysis: geminiResponse.text,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Reyon analiz edge function hatası:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Bilinmeyen hata',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
