-- ============================================
-- Supabase Cron Job Kurulumu
-- Görev Son Tarih Kontrolü
-- ============================================
-- 
-- Bu SQL dosyası görev son tarih kontrolü için
-- günde 2 kez çalışan cron job'ları oluşturur:
-- - 11:00 (Sabah vardiyası)
-- - 16:00 (Öğleden sonra vardiyası)
--
-- ✅ HAZIR! Supabase Dashboard → SQL Editor'de çalıştırın
-- ============================================

-- 1. pg_cron extension'ını aktifleştir (eğer aktif değilse)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Sabah 11:00 için cron job (08:00 UTC = 11:00 TR)
SELECT cron.schedule(
  'check-task-deadlines-morning',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-task-deadlines',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- 3. Öğleden sonra 16:00 için cron job (13:00 UTC = 16:00 TR)
SELECT cron.schedule(
  'check-task-deadlines-afternoon',
  '0 13 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-task-deadlines',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- 4. Akşam 22:00 için not hatırlatmaları - Günlük (19:00 UTC = 22:00 TR)
SELECT cron.schedule(
  'check-note-reminders-daily',
  '0 19 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-note-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- 5. Akşam 22:15 için not hatırlatmaları - Personel bazlı (19:15 UTC = 22:15 TR)
SELECT cron.schedule(
  'check-note-reminders-personnel',
  '15 19 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/check-note-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- 6. Gece 03:00 için eski bildirimleri temizle (00:00 UTC = 03:00 TR)
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/cleanup-old-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- ============================================
-- KONTROL SORULARI
-- ============================================

-- Cron job'ları listele
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE 'check-%'
ORDER BY jobname;

-- Son çalışmaları göster
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'check-%'
ORDER BY jrd.start_time DESC
LIMIT 20;

-- ============================================
-- YÖNETİM SORULARI (İhtiyaç halinde)
-- ============================================

-- Cron job'ları durdur
-- SELECT cron.unschedule('check-task-deadlines-morning');
-- SELECT cron.unschedule('check-task-deadlines-afternoon');
-- SELECT cron.unschedule('check-note-reminders-daily');
-- SELECT cron.unschedule('check-note-reminders-personnel');
-- SELECT cron.unschedule('cleanup-old-notifications');

-- Cron job'ları yeniden başlat (önce durdur, sonra yukarıdaki schedule komutlarını tekrar çalıştır)


-- 7. Gece 00:00 için zamanlanmış görev oluşturma (21:00 UTC = 00:00 TR)
SELECT cron.schedule(
  'create-scheduled-task-instances',
  '0 21 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/create-scheduled-task-instances',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
