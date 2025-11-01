-- Trigger function to send push notifications when a new notification is created
CREATE OR REPLACE FUNCTION trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Supabase Edge Function URL'ini oluştur
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification';
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Edge Function'ı asenkron olarak çağır (pg_net extension gerekli)
  -- NOT: Bu basitleştirilmiş versiyon, production'da pg_net kullanılmalı
  
  -- Şimdilik sadece log at
  RAISE NOTICE 'New notification created: %, triggering push notification', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_notification_created ON notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_notification();

COMMENT ON FUNCTION trigger_push_notification() IS 'Triggers push notification sending when a new notification is created';

-- NOT: Gerçek push göndermek için pg_net extension gerekli
-- Şimdilik manuel olarak Edge Function çağırabilirsiniz:
-- 
-- curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-push-notification \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"notificationId": "NOTIFICATION_ID"}'
