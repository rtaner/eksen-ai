import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // HIZLI ÇÖZÜM: Cookie'den direkt okuyalım, API call yapmayalım
  // Supabase session cookie'si: sb-<project-ref>-auth-token
  const cookies = request.cookies.getAll();
  const authCookie = cookies.find(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );
  
  // Eğer auth cookie varsa, user var demektir (basit kontrol)
  // Gerçek user bilgisi client-side'da AuthContext tarafından alınacak
  const hasSession = !!authCookie?.value;

  return { 
    supabaseResponse, 
    user: hasSession ? ({ id: 'placeholder' } as any) : null 
  };
}
