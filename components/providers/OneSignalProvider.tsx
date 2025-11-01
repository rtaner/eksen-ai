'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // OneSignal'ı production'a alırken aktif edeceğiz
    // Şimdilik devre dışı (web push yapılandırması gerekiyor)
    const initOneSignal = async () => {
      // Production check ekleyelim
      if (process.env.NODE_ENV !== 'production') {
        console.log('OneSignal: Development modunda devre dışı');
        return;
      }

      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });

        console.log('OneSignal initialized successfully');
      } catch (error) {
        console.error('OneSignal initialization error:', error);
      }
    };

    initOneSignal();
  }, []);

  return <>{children}</>;
}
