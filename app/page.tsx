import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, redirect to personnel page
  if (user) {
    redirect('/personnel');
  }

  // If not authenticated, show landing page
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">Vector</h1>
        <p className="text-xl text-gray-600 mb-8">
          AI Destekli Personel Geri Bildirim ve Görev Yönetimi
        </p>
        
        <div className="flex gap-4 justify-center pt-8">
          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors min-h-[44px] flex items-center"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors min-h-[44px] flex items-center"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </main>
  );
}
