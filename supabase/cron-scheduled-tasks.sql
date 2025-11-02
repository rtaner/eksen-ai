-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing jobs if they exist
SELECT cron.unschedule('create-scheduled-task-instances-daily');

-- Create daily job to create scheduled task instances
-- Runs every day at 00:01 UTC (03:01 Turkey time)
SELECT cron.schedule(
  'create-scheduled-task-instances-daily',
  '1 0 * * *', -- Every day at 00:01 UTC
  $$
  SELECT
    net.http_post(
      url:='https://fnkaythbzngszjfymtgm.supabase.co/functions/v1/create-scheduled-task-instances',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua2F5dGhiem5nc3pqZnltdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDkzMzUsImV4cCI6MjA3NzIyNTMzNX0.DFDIuWmZhj5miXCmMQP1EEOAAoMQ3XKTjaT7MPrDsFA"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the job was created
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'create-scheduled-task-instances-daily';
