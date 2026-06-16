import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Sadece PDF dosyaları desteklenmektedir.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const dbValue = `base64:${base64Data}`;

    // Veritabanına Arka Plan İşini (Background Job) ekle
    const { data: job, error } = await supabase
      .from('ai_analysis_jobs')
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        raw_text: dbValue,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error || !job) {
      console.error('Job insert error:', error);
      return NextResponse.json({ error: 'Kuyruğa eklenirken hata oluştu' }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    console.error('Start job error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
