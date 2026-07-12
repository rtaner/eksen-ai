'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { createClient } from '@/lib/supabase/client';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initOneSignal = async () => {
      const rawAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      const appId = rawAppId ? rawAppId.trim() : null;

      // OneSignal App ID kontrolü
      if (!appId) {
        console.log('OneSignal: App ID bulunamadı, push bildirimleri devre dışı');
        return;
      }

      const isDev = process.env.NODE_ENV === 'development';
      console.log(`OneSignal: Initializing in ${process.env.NODE_ENV} mode...`);

      try {
        // Check if OneSignal is already initialized to avoid duplicate setups
        if (typeof window !== 'undefined' && (window as any).OneSignal?.isInitialized?.()) {
          console.log('OneSignal: Already initialized, skipping');
          return;
        }

        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: isDev,
        });

        console.log('OneSignal initialized successfully');

        // Listen for subscription changes
        OneSignal.User.PushSubscription.addEventListener('change', async (event) => {
          console.log('OneSignal subscription changed:', event);
          
          // Save Player ID to Supabase when user subscribes
          if (event.current.id) {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              const { error } = await supabase
                .from('profiles')
                .update({ onesignal_player_id: event.current.id })
                .eq('id', user.id);
              
              if (error) {
                console.error('Error saving OneSignal Player ID:', error);
              } else {
                console.log('OneSignal Player ID saved:', event.current.id);
              }
            }
          }
        });

        // Also save Player ID on init if already subscribed
        const playerId = await OneSignal.User.PushSubscription.id;
        if (playerId) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { error } = await supabase
              .from('profiles')
              .update({ onesignal_player_id: playerId })
              .eq('id', user.id);
            
            if (!error) {
              console.log('OneSignal Player ID synced:', playerId);
            }
          }
        }
      } catch (error) {
        console.error('OneSignal initialization error:', error);
        // Don't throw - allow app to continue even if OneSignal fails
        console.log('OneSignal: Continuing without push notifications');
      }
    };

    // Run initialization but don't block app rendering
    initOneSignal().catch((err) => {
      console.error('OneSignal: Failed to initialize', err);
    });
  }, []);

  return <>{children}</>;
}
