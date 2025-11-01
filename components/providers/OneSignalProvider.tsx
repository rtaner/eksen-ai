'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initOneSignal = async () => {
      // OneSignal App ID kontrolü
      if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        console.log('OneSignal: App ID bulunamadı');
        return;
      }

      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        });

        console.log('OneSignal initialized successfully');

        // User ID'yi ayarla (login sonrası)
        OneSignal.User.PushSubscription.addEventListener('change', (event) => {
          console.log('OneSignal subscription changed:', event);
        });
      } catch (error) {
        console.error('OneSignal initialization error:', error);
      }
    };

    initOneSignal();
  }, []);

  return <>{children}</>;
}
