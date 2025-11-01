import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateUser, checkOwnerPermission } from '../_shared/supabase-client.ts';
import { callGemini, parseGeminiJSON } from '../_shared/gemini.ts';
import { buildEgilimPrompt } from '../_shared/prompts.ts';
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

    // 6. Fetch ALL tasks (open and closed) in date range for trend analysis
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, description, star_rating, completed_at, deadline, status, created_at')
      .eq('personnel_id', personnelId)
      .gte('created_at', dateRangeStart)
      .lte('created_at', dateRangeEnd)
      .order('created_at', { ascending: true });

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

    // 9. Format data for prompt (includes time series data)
    const { notesJSON } = formatDataForPrompt(notes || [], tasks || [], authorNames);
    const dateRangeFormatted = formatDateRange(dateRangeStart, dateRangeEnd);

    // 10. Build prompt
    const prompt = buildEgilimPrompt(personnel.name, dateRangeFormatted, notesJSON);

    // 11. Call Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const geminiResponse = await callGemini(prompt, {
      apiKey: geminiApiKey,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxOutputTokens: 16384,
    });

    if (!geminiResponse.success) {
      throw new Error(`Gemini API error: ${geminiResponse.error}`);
    }

    // 12. Parse JSON response
    const analysisResult = parseGeminiJSON(geminiResponse.text);

    // 13. Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        personnel_id: personnelId,
        analysis_type: 'egilim',
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
        result: analysisResult,
        raw_response: geminiResponse.text,
        created_by: user.id,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // 14. Return success
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
    console.error('Eğilim analizi hatası:', error);
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
