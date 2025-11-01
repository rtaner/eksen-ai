-- Enable real-time for scheduled_tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_tasks;

-- Enable real-time for scheduled_task_leave_dates table
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_task_leave_dates;

-- Enable real-time for scheduled_task_skip_dates table
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_task_skip_dates;
