-- Enable real-time for checklist tables
ALTER PUBLICATION supabase_realtime ADD TABLE checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_results;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_assignments;

-- Add comments
COMMENT ON TABLE checklists IS 'Real-time enabled for checklist template changes';
COMMENT ON TABLE checklist_results IS 'Real-time enabled for new checklist completions';
COMMENT ON TABLE checklist_assignments IS 'Real-time enabled for personnel assignments';
