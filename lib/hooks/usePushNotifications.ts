import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// VAPID public key - Bu değeri environment variable'dan almalısınız
// Şimdilik placeholder, gerçek key'i .env.local'e ekleyeceğiz
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    checkSupport();
    checkSubscription();
  }, []);

  const checkSupport = () => {
    const supported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);
    return supported;
  };

  const checkSubscription = async () => {
    try {
      if (!checkSupport()) {
        setLoading(false);
        return;
      }

      // Service Worker kaydını kontrol et (timeout ile)
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service Worker timeout')), 3000)
        )
      ]) as ServiceWorkerRegistration;

      const sub = await registration.pushManager.getSubscription();
      
      setSubscription(sub);
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Hata olsa bile loading'i kapat
      setSubscription(null);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Bu tarayıcı bildirimleri desteklemiyor');
    }

    const permission = await Notification.requestPermission();
    return permission;
  };

  const subscribe = async (): Promise<boolean> => {
    try {
      setLoading(true);

      // Check support
      if (!checkSupport()) {
        throw new Error('Push notifications desteklenmiyor');
      }

      // Check VAPID key
      if (!VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key bulunamadı');
      }

      // Request permission
      const permission = await requestPermission();
      if (permission !== 'granted') {
        throw new Error('Bildirim izni reddedildi');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Save subscription to database
      await saveSubscription(sub);

      setSubscription(sub);
      setIsSubscribed(true);

      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      alert(`Bildirim aboneliği başarısız: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      setLoading(true);

      if (!subscription) {
        return true;
      }

      // Unsubscribe from push
      await subscription.unsubscribe();

      // Remove from database
      await removeSubscription(subscription);

      setSubscription(null);
      setIsSubscribed(false);

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveSubscription = async (sub: PushSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const subData = sub.toJSON();

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subData.endpoint!,
          p256dh: subData.keys!.p256dh,
          auth: subData.keys!.auth,
          user_agent: navigator.userAgent,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'endpoint'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  };

  const removeSubscription = async (sub: PushSubscription) => {
    try {
      const subData = sub.toJSON();

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subData.endpoint!);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  };

  const testNotification = async () => {
    if (!isSubscribed) {
      alert('Önce bildirimlere abone olun');
      return;
    }

    try {
      // Test için basit bir browser notification göster
      if (Notification.permission === 'granted') {
        new Notification('Test Bildirimi', {
          body: 'Push notifications çalışıyor! 🎉',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        });
      }
    } catch (error) {
      console.error('Error showing test notification:', error);
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    loading,
    permission: typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'default',
    subscribe,
    unsubscribe,
    testNotification,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
