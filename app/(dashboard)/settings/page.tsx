import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import DashboardModals from '../../../components/dashboard/DashboardModals';
import SettingsModals from '../../../components/settings/SettingsModals';
import InviteCodeCard from '../../../components/settings/InviteCodeCard';

export default async function SettingsPage() {
  const supabase = await createClient();
  
  // Admin client for statistics (bypasses RLS)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  // Owner and Manager can access this page
  if (profile?.role !== 'owner' && profile?.role !== 'manager') {
    redirect('/personnel');
  }

  const isOwner = profile?.role === 'owner';
  const isManager = profile?.role === 'manager';

  // Fetch organization info (for invite code)
  const { data: organization } = await supabase
    .from('organizations')
    .select('invite_code')
    .eq('id', profile.organization_id)
    .single();

  // Fetch dashboard data
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // 1. Fetch uncompleted tasks for this organization
  // First get all personnel in organization
  const { data: orgPersonnel } = await supabase
    .from('personnel')
    .select('id, name')
    .eq('organization_id', profile.organization_id);

  const personnelMap = new Map(orgPersonnel?.map(p => [p.id, p]) || []);
  const personnelIds = Array.from(personnelMap.keys());

  // Then fetch tasks for these personnel (without join to avoid RLS issues)
  const { data: allTasksData } = await supabase
    .from('tasks')
    .select('id, description, deadline, star_rating, status, personnel_id')
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .neq('status', 'closed')
    .order('deadline', { ascending: true });

  // Map personnel info to tasks
  const tasksData = (allTasksData || []).map((task: any) => ({
    id: task.id,
    description: task.description,
    deadline: task.deadline,
    star_rating: task.star_rating,
    personnel: personnelMap.get(task.personnel_id) || { id: task.personnel_id, name: 'Bilinmeyen' },
  }));

  // Transform tasks to match expected format
  const tasks = (tasksData || []).map((task: any) => ({
    id: task.id,
    description: task.description,
    deadline: task.deadline,
    star_rating: task.star_rating,
    personnel: Array.isArray(task.personnel) ? task.personnel[0] : task.personnel,
  }));

  // 2. Fetch performance stats for this organization (using admin client for statistics)
  const { count: notesCount } = await supabaseAdmin
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .gte('created_at', sevenDaysAgo.toISOString());

  const { count: completedTasksCount } = await supabaseAdmin
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'closed')
    .gte('completed_at', sevenDaysAgo.toISOString());

  const { data: notes } = await supabaseAdmin
    .from('notes')
    .select('sentiment')
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .gte('created_at', sevenDaysAgo.toISOString());

  const positiveCount = notes?.filter((n) => n.sentiment === 'positive').length || 0;
  const totalNotes = notes?.length || 0;
  const positiveRatio = totalNotes > 0 ? (positiveCount / totalNotes) * 100 : 0;

  const { data: completedTasks } = await supabaseAdmin
    .from('tasks')
    .select('star_rating')
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'closed')
    .gte('completed_at', sevenDaysAgo.toISOString())
    .not('star_rating', 'is', null);

  const avgRating =
    completedTasks && completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + (t.star_rating || 0), 0) / completedTasks.length
      : 0;

  // 3. Fetch recent activities for this organization (using admin client)
  const { data: recentNotes } = await supabaseAdmin
    .from('notes')
    .select('id, created_at, personnel_id')
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentTasksData } = await supabaseAdmin
    .from('tasks')
    .select('id, completed_at, personnel_id')
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'closed')
    .order('completed_at', { ascending: false })
    .limit(10);

  const { data: recentAnalyses } = await supabaseAdmin
    .from('ai_analyses')
    .select('id, analysis_type, created_at, personnel_id')
    .in('personnel_id', personnelIds.length > 0 ? personnelIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(10);

  // Merge and sort activities
  const activities = [
    ...(recentNotes || []).map((n: any) => ({
      id: n.id,
      type: 'note' as const,
      personnelId: n.personnel_id || '',
      personnelName: personnelMap.get(n.personnel_id)?.name || 'Bilinmeyen',
      date: n.created_at,
    })),
    ...(recentTasksData || []).map((t: any) => ({
      id: t.id,
      type: 'task' as const,
      personnelId: t.personnel_id || '',
      personnelName: personnelMap.get(t.personnel_id)?.name || 'Bilinmeyen',
      date: t.completed_at,
    })),
    ...(recentAnalyses || []).map((a: any) => ({
      id: a.id,
      type: 'analysis' as const,
      personnelId: a.personnel_id || '',
      personnelName: personnelMap.get(a.personnel_id)?.name || 'Bilinmeyen',
      date: a.created_at,
      metadata: {
        analysisType: a.analysis_type,
      },
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const stats = {
    notesCount: notesCount || 0,
    completedTasksCount: completedTasksCount || 0,
    positiveRatio,
    averageRating: avgRating,
  };

  const organizationItem = {
    id: 'organization',
    title: 'Organizasyon Ayarları',
    description: 'Organizasyon adı ve davet kodunu düzenleyin',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  };

  // Dashboard items (modal buttons)
  const dashboardItems = [
    {
      id: 'performance',
      title: 'Performans Özeti',
      description: 'Son 7 günlük performans istatistiklerini görüntüleyin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'tasks',
      title: 'Tamamlanmamış Görevler',
      description: 'Bugün biten ve gecikmiş görevleri görüntüleyin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      count: tasks.length,
    },
    {
      id: 'timeline',
      title: 'Son Hareketler',
      description: 'Son aktiviteleri ve değişiklikleri görüntüleyin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: activities.length,
    },
  ];

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ayarlar</h1>
        <p className="text-sm sm:text-base text-gray-600">
          {isOwner ? 'Sistem ayarlarını ve yetkilerini yönetin' : 'Dashboard ve davet kodu yönetimi'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Performans Özeti */}
        <DashboardModals
          item={dashboardItems[0]}
          tasks={tasks}
          stats={stats}
          activities={activities}
        />

        {/* 2. Zamanlanmış Görevler (Owner only) */}
        {isOwner && (
        <Link href="/settings/scheduled-tasks">
          <div className="bg-blue-50 rounded-lg shadow-md p-4 hover:shadow-lg hover:bg-blue-100 transition-all cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-3xl">
                🔄
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Zamanlanmış Görevler
                </h3>
                <p className="text-sm text-gray-600">
                  Tekrarlayan görevleri oluşturun ve yönetin
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
        )}

        {/* 3. AI Analizleri - Featured (Owner only) */}
        {isOwner && (
        <Link href="/settings/analyses">
          <div className="bg-purple-100 rounded-lg shadow-md p-4 hover:shadow-lg hover:bg-purple-200 transition-all cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-3xl animate-pulse">
                ✨
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  AI Analizleri
                </h3>
                <p className="text-sm text-gray-600">
                  Personel performans analizlerini görüntüleyin ve yönetin
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
        )}

        {/* 3. Tamamlanmamış Görevler */}
        <DashboardModals
          item={dashboardItems[1]}
          tasks={tasks}
          stats={stats}
          activities={activities}
        />

        {/* 4. Son Hareketler */}
        <DashboardModals
          item={dashboardItems[2]}
          tasks={tasks}
          stats={stats}
          activities={activities}
        />

        {/* 5. Organizasyon Ayarları (Owner only) */}
        {isOwner && <SettingsModals item={organizationItem} />}

        {/* 6. Kullanıcı Yönetimi (Owner only) */}
        {isOwner && (
        <Link href="/settings/users">
          <Card hover className="h-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Kullanıcı Yönetimi
                </h3>
                <p className="text-sm text-gray-600">
                  Kullanıcı rollerini yönetin (Yönetici/Personel)
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </Link>
        )}

        {/* 6.5 Duplicate Personel (Owner only) */}
        {isOwner && (
        <Link href="/settings/duplicates">
          <Card hover className="h-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Tekrar Eden Personeller
                </h3>
                <p className="text-sm text-gray-600">
                  Tekrar eden personel kayıtlarını tespit edin ve birleştirin
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </Link>
        )}

        {/* 7. Yetki Yönetimi (Owner only) */}
        {isOwner && (
        <Link href="/settings/permissions">
          <Card hover className="h-full">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Yetki Yönetimi
                </h3>
                <p className="text-sm text-gray-600">
                  Yönetici ve personel rollerinin yetkilerini düzenleyin
                </p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </Link>
        )}

        {/* 8. Davet Kodu (Manager için - en altta) */}
        {isManager && organization?.invite_code && (
          <InviteCodeCard inviteCode={organization.invite_code} />
        )}
      </div>
    </div>
  );
}
