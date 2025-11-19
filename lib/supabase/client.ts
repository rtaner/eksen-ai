import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern - tüm uygulama boyunca tek bir client instance kullan
let browserClient: SupabaseClient | undefined;

export function createClient() {
  // Eğer client zaten oluşturulmuşsa, aynı instance'ı döndür
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    console.log('[Supabase Client] New browser client created');
  }
  
  return browserClient;
}
