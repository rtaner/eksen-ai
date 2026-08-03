'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useToast } from '@/lib/contexts/ToastContext';
import { useAuth } from '@/lib/contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[]; // If undefined, visible to all roles
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showError } = useToast();
  const { profile, organization, loading, error, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      showError('Çıkış yapılırken bir hata oluştu');
    }
  };

  const navItems: NavItem[] = [
    {
      label: 'Canlı Akış',
      href: '/personnel',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      label: 'Personel Listesi',
      href: '/personnel-list',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Checklistler',
      href: '/checklists',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      roles: ['owner', 'manager'],
    },
    {
      label: 'Ayarlar',
      href: '/settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      roles: ['owner', 'manager'],
    },
    {
      label: 'Mağaza Analizi',
      href: '/store-analysis',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['owner', 'manager'],
    },
    {
      label: 'İşlerim',
      href: '/my-tasks',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      roles: ['personnel', 'manager'],
    },
  ];

  // Derive user data from profile
  const userRole = profile?.role || null;
  const userName = profile ? `${profile.name} ${profile.surname}` : '';
  const organizationName = organization?.name || '';

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state if auth failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/personnel" className="flex items-center gap-2">
                <Image
                  src="/icon-192x192.png"
                  alt="Eksen AI"
                  width={32}
                  height={32}
                  className="rounded-md"
                />
                <span className="hidden sm:block text-xl font-bold" style={{ color: '#0B2A4C' }}>
                  Eksen AI
                </span>
              </Link>
              {organizationName && (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-gray-300">|</span>
                  <span className="text-sm font-medium text-gray-700">
                    {organizationName}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <div className="flex flex-col items-end">
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {userName}
                </span>
                {organizationName && (
                  <span className="text-xs text-gray-500 md:hidden">
                    {organizationName}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 min-h-[44px] px-2 sm:px-4"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0 fixed left-0 top-16 bottom-0 w-64 bg-white shadow-sm">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  min-h-[44px]
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64 pt-16 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`
                  flex flex-col items-center justify-center py-2 px-3 min-h-[60px] flex-1
                  ${isActive ? 'text-blue-600' : 'text-gray-600'}
                `}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
