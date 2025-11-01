-- Enable real-time for notes table
ALTER PUBLICATION supabase_realtime ADD TABLE notes;

-- Enable real-time for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
