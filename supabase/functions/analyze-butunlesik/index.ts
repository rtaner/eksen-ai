import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateUser, checkOwnerPermission } from '../_shared/supabase-client.ts';
import { callGemini, parseGeminiJSON } from '../_shared/gemini.ts';
import { buildComprehensiveAnalysisPrompt } from '../_shared/prompts.ts';
import { formatDataForPrompt } from '../_shared/data-formatter.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const { user, supabase } = await validateUser(authHeader);

    const { isOwner } = await checkOwnerPermission(supabase, user.id);
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: 'Sadece Owner analiz oluşturabilir' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { personnelId, dateRangeStart, dateRangeEnd } = await req.json();

    if (!personnelId || !dateRangeStart || !dateRangeEnd) {
      return new Response(
        JSON.stringify({ error: 'personnelId, dateRangeStart ve dateRangeEnd gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch personnel info
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

    // Fetch groups for this personnel
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('personnel_id', personnelId);

    const groupIds = (memberRows || []).map((m: any) => m.group_id).filter(Boolean);

    // Fetch notes in date range (personnel or group)
    let notesQuery = supabase
      .from('notes')
      .select('id, content, sentiment, is_voice_note, created_at, author_id, group_id, groups(name)');

    if (groupIds.length > 0) {
      notesQuery = notesQuery.or(`personnel_id.eq.${personnelId},group_id.in.(${groupIds.join(',')})`);
    } else {
      notesQuery = notesQuery.eq('personnel_id', personnelId);
    }

    const { data: notes, error: notesError } = await notesQuery
      .gte('created_at', dateRangeStart)
      .lte('created_at', dateRangeEnd)
      .order('created_at', { ascending: true });

    if (notesError) throw notesError;

    // Fetch closed tasks in date range (personnel or group)
    let tasksQuery = supabase
      .from('tasks')
      .select('id, description, star_rating, completed_at, deadline, status, created_at, group_id, groups(name)')
      .eq('status', 'closed');

    if (groupIds.length > 0) {
      tasksQuery = tasksQuery.or(`personnel_id.eq.${personnelId},group_id.in.(${groupIds.join(',')})`);
    } else {
      tasksQuery = tasksQuery.eq('personnel_id', personnelId);
    }

    const { data: tasks, error: tasksError } = await tasksQuery
      .gte('completed_at', dateRangeStart)
      .lte('completed_at', dateRangeEnd)
      .order('completed_at', { ascending: true });

    if (tasksError) throw tasksError;

    // Fetch checklists in date range
    const { data: checklistAssignments, error: checklistError } = await supabase
      .from('checklist_assignments')
      .select(`
        checklist_result:checklist_results (
          id,
          checklist_snapshot,
          completed_items,
          score,
          closing_note,
          completed_at,
          completed_by
        )
      `)
      .eq('personnel_id', personnelId);

    if (checklistError) throw checklistError;

    // Filter checklists by date and extract them
    const checklists = (checklistAssignments || [])
      .map((a: any) => {
        const res = Array.isArray(a.checklist_result) ? a.checklist_result[0] : a.checklist_result;
        return res;
      })
      .filter((c: any) => c && c.completed_at >= dateRangeStart && c.completed_at <= dateRangeEnd)
      .sort((a: any, b: any) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    // Fetch author names (for notes and checklists)
    const authorIds = new Set([
      ...(notes || []).map((n: any) => n.author_id),
      ...checklists.map((c: any) => c.completed_by)
    ].filter(Boolean));

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, surname')
      .in('id', Array.from(authorIds));

    const authorNames: Record<string, string> = {};
    (profiles || []).forEach((p: any) => {
      authorNames[p.id] = `${p.name} ${p.surname}`;
    });

    if ((!notes || notes.length === 0) && (!tasks || tasks.length === 0) && checklists.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Analiz için yeterli veri yok (Not, görev veya checklist bulunamadı)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format data
    const { notesJSON } = formatDataForPrompt(notes || [], tasks || [], checklists, authorNames);
    const dateRangeFormatted = `${new Date(dateRangeStart).toLocaleDateString('tr-TR')} - ${new Date(dateRangeEnd).toLocaleDateString('tr-TR')}`;

    // GEMINI CALL
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = buildComprehensiveAnalysisPrompt(
      personnel.name,
      dateRangeFormatted,
      notesJSON
    );

    const geminiResponse = await callGemini(prompt, {
      apiKey: geminiApiKey,
      model: 'gemini-3.5-flash',
      temperature: 0.7,
      maxOutputTokens: 16384,
    });

    if (!geminiResponse.success) {
      throw new Error(`Kapsamlı analiz hatası: ${geminiResponse.error}`);
    }

    const analysisResult = parseGeminiJSON(geminiResponse.text) as any;

    // Attach data stats
    analysisResult.data_stats = {
      notes: notes?.length || 0,
      tasks: tasks?.length || 0,
      checklists: checklists?.length || 0
    };

    // Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        personnel_id: personnelId,
        analysis_type: 'butunlesik',
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd,
        result: analysisResult,
        raw_response: geminiResponse.text,
        created_by: user.id,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Kapsamlı analiz hatası:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: error.stack || 'Bilinmeyen hata detayı'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
