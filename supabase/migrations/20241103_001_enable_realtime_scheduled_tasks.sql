-- Enable real-time for scheduled_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_tasks;

-- Verify real-time is enabled
COMMENT ON TABLE scheduled_tasks IS 'Real-time enabled for instant UI updates';
