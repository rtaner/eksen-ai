import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!oneSignalAppId || !oneSignalApiKey) {
      throw new Error('OneSignal credentials not configured');
    }

    // Request body'den notification bilgilerini al
    const { player_id, player_ids, title, message, url, data } = await req.json();

    if (!player_id && (!player_ids || player_ids.length === 0)) {
      throw new Error('player_id or player_ids required');
    }

    // OneSignal API'ye istek gönder
    const oneSignalPayload = {
      app_id: oneSignalAppId,
      include_player_ids: player_id ? [player_id] : player_ids,
      headings: { en: title },
      contents: { en: message },
      url: url || undefined,
      data: data || {},
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', result);
      throw new Error(`OneSignal API error: ${result.errors?.join(', ') || 'Unknown error'}`);
    }

    console.log('OneSignal notification sent:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        oneSignalResponse: result,
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
