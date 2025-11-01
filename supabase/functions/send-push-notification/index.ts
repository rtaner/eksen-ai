import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push için gerekli fonksiyonlar
async function sendPushNotification(
  subscription: any,
  payload: any,
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  const endpoint = subscription.endpoint;
  const p256dh = subscription.p256dh;
  const auth = subscription.auth;

  // VAPID authentication header oluştur
  const vapidHeaders = await generateVAPIDHeaders(
    endpoint,
    vapidPublicKey,
    vapidPrivateKey
  );

  // Payload'ı encrypt et
  const encryptedPayload = await encryptPayload(
    JSON.stringify(payload),
    p256dh,
    auth
  );

  // Push notification gönder
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400', // 24 saat
      ...vapidHeaders,
    },
    body: encryptedPayload,
  });

  return response;
}

// VAPID headers oluştur (basitleştirilmiş versiyon)
async function generateVAPIDHeaders(
  endpoint: string,
  publicKey: string,
  privateKey: string
) {
  // Bu basitleştirilmiş bir versiyon
  // Production'da web-push kütüphanesi kullanılmalı
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  return {
    'Authorization': `vapid t=${publicKey}, k=${privateKey}`,
  };
}

// Payload encryption (basitleştirilmiş)
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<Uint8Array> {
  // Bu basitleştirilmiş bir versiyon
  // Production'da gerçek encryption kullanılmalı
  const encoder = new TextEncoder();
  return encoder.encode(payload);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    // Request body'den notification bilgilerini al
    const { notificationId } = await req.json();

    if (!notificationId) {
      throw new Error('Notification ID required');
    }

    // Notification'ı veritabanından al
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (notifError || !notification) {
      throw new Error('Notification not found');
    }

    // Kullanıcının push subscription'larını al
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', notification.user_id);

    if (subError) {
      throw new Error('Error fetching subscriptions');
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', notification.user_id);
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Her subscription'a push gönder
    const results = [];
    for (const sub of subscriptions) {
      try {
        const payload = {
          title: notification.title,
          message: notification.message,
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: notification.type,
          link: notification.link,
          notificationId: notification.id,
        };

        const response = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (response.ok) {
          // Subscription'ı güncelle (last_used_at)
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);

          results.push({ subscription: sub.id, success: true });
        } else {
          // Eğer subscription geçersizse (410 Gone), sil
          if (response.status === 410) {
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
            
            results.push({ subscription: sub.id, success: false, reason: 'expired' });
          } else {
            results.push({ subscription: sub.id, success: false, status: response.status });
          }
        }
      } catch (error) {
        console.error('Error sending push to subscription:', sub.id, error);
        results.push({ subscription: sub.id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent push notifications to ${results.filter(r => r.success).length}/${results.length} subscriptions`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
