'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { createClient } from '@/lib/supabase/client';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initOneSignal = async () => {
      // Skip OneSignal in development
      if (process.env.NODE_ENV === 'development') {
        console.log('OneSignal: Skipped in development mode');
        return;
      }

      // OneSignal App ID kontrolü
      if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        console.log('OneSignal: App ID bulunamadı');
        return;
      }

      try {
        // Check if OneSignal is already initialized
        if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
          console.log('OneSignal: Already initialized, skipping');
          return;
        }

        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: false,
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
