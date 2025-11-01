import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateUser, checkOwnerPermission } from '../_shared/supabase-client.ts';
import { callGemini, parseGeminiJSON } from '../_shared/gemini.ts';
import { buildButunlesikPrompt, buildYetkinlikPrompt } from '../_shared/prompts.ts';
import { formatDataForPrompt, formatDateRange } from '../_shared/data-formatter.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validate user
    const authHeader = req.headers.get('Authorization');
    const { user, supabase } = await validateUser(authHeader);

    // 2. Check if user is Owner
    const { isOwner } = await checkOwnerPermission(supabase, user.id);
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: 'Sadece Owner analiz oluşturabilir' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request body
    const { personnelId, dateRangeStart, dateRangeEnd } = await req.json();

    if (!personnelId || !dateRangeStart || !dateRangeEnd) {
      return new Response(
        JSON.stringify({ error: 'personnelId, dateRangeStart ve dateRangeEnd gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Fetch personnel info
    const { data: personnel, error: personnelError } = await supabase
      .from('personnel')
      .select('id, name, organization_id')
      .eq('id', personnelId)
      .single();

    if (personnelError || !personnel) {
      return new Response(
        JSON.stringify({ error: 'Personel bulunamadı' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Fetch notes in date range
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, content, sentiment, is_voice_note, created_at, author_id')
      .eq('personnel_id', personnelId)
      .gte('created_at', dateRangeStart)
      .lte('created_at', dateRangeEnd)
      .order('created_at', { ascending: true });

    if (notesError) throw notesError;

    // 6. Fetch closed tasks in date range
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, description, star_rating, completed_at, deadline, status, created_at')
      .eq('personnel_id', personnelId)
      .eq('status', 'closed')
      .gte('completed_at', dateRangeStart)
      .lte('completed_at', dateRangeEnd)
      .order('completed_at', { ascending: true });

    if (tasksError) throw tasksError;

    // 7. Fetch author names
    const authorIds = [...new Set((notes || []).map((n: any) => n.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, surname')
      .in('id', authorIds);

    const authorNames: Record<string, string> = {};
    (profiles || []).forEach((p: any) => {
      authorNames[p.id] = `${p.name} ${p.surname}`;
    });

    // 8. Check if there's enough data
    if ((!notes || notes.length === 0) && (!tasks || tasks.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Analiz için yeterli veri yok' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Format data
    const { notesJSON } = formatDataForPrompt(notes || [], tasks || [], authorNames);
    const dateRangeFormatted = formatDateRange(dateRangeStart, dateRangeEnd);

    // 10. STEP 1: Get competency scores (Yetkinlik analizi)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const yetkinlikPrompt = buildYetkinlikPrompt(
      personnel.name,
      dateRangeFormatted,
      notesJSON
    );

    const yetkinlikResponse = await callGemini(yetkinlikPrompt, {
      apiKey: geminiApiKey,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxOutputTokens: 16384,
    });

    if (!yetkinlikResponse.success) {
      throw new Error(`Yetkinlik analizi hatası: ${yetkinlikResponse.error}`);
    }

    const yetkinlikResult = parseGeminiJSON(yetkinlikResponse.text);

    // 11. Calculate numerical scores from yetkinlik analysis
    const hesaplanmisPuanlar: Record<string, number> = {};
    
    if (yetkinlikResult.kategori_analizleri) {
      yetkinlikResult.kategori_analizleri.forEach((kategori: any, index: number) => {
        // Calculate score based on sentiment distribution and task ratings
        const { olumlu, olumsuz, notr, puan_ortalamasi } = kategori.veri_ozeti;
        const total = olumlu + olumsuz + notr;
        
        let score = 3.0; // Default neutral score
        
        if (total > 0) {
          // Sentiment-based score (0-5 scale)
          const sentimentScore = ((olumlu * 5 + notr * 3 + olumsuz * 1) / total);
          
          // If we have task ratings, average them with sentiment
          if (puan_ortalamasi !== null) {
            score = (sentimentScore + puan_ortalamasi) / 2;
          } else {
            score = sentimentScore;
          }
        } else if (puan_ortalamasi !== null) {
          score = puan_ortalamasi;
        }
        
        // Round to 1 decimal
        score = Math.round(score * 10) / 10;
        
        // Map category name to key
        const categoryKey = `${index + 1}_${kategori.kategori_adi.split('.')[1]?.trim().replace(/\s+/g, '_') || 'Kategori'}`;
        hesaplanmisPuanlar[categoryKey] = score;
      });
    }

    // 12. Format notes list for butunlesik analysis
    const hamNotListesi = (notes || []).map((note: any, index: number) => ({
      id: index + 1,
      tip: note.sentiment === 'positive' ? 'olumlu' : note.sentiment === 'negative' ? 'olumsuz' : 'notr',
      not: note.content,
    }));

    // 13. STEP 2: Run integrated analysis
    const butunlesikPrompt = buildButunlesikPrompt(
      personnel.name,
      dateRangeFormatted,
      hesaplanmisPuanlar,
      JSON.stringify(hamNotListesi, null, 2)
    );

    const butunlesikResponse = await callGemini(butunlesikPrompt, {
      apiKey: geminiApiKey,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxOutputTokens: 16384,
    });

    if (!butunlesikResponse.success) {
      throw new Error(`Bütünleşik analiz hatası: ${butunlesikResponse.error}`);
    }

    // 14. Parse JSON response
    const analysisResult = parseGeminiJSON(butunlesikResponse.text);

    // 15. Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        personnel_id: personnelId,
        analysis_type: 'butunlesik',
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
        result: analysisResult,
        raw_response: butunlesikResponse.text,
        created_by: user.id,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // 16. Return success
    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Bütünleşik analiz hatası:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
