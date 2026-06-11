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
      return NextResponse.json({ error: 'Only owners can save store analysis data' }, { status: 403 });
    }

    const body = await request.json();
    const { dashboardData } = body;

    if (!dashboardData) {
      return NextResponse.json({ error: 'No dashboard data provided' }, { status: 400 });
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
    console.error('Save processing error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during saving' }, { status: 500 });
  }
}
