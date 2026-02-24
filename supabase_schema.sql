-- Supabase Schema for Neuro Map Sync (Device-to-Device Only)
-- Maps are stored locally on each device; this table only broadcasts sync events
-- Run these SQL commands in your Supabase dashboard (SQL Editor)

-- Create sync_events table for real-time device notifications
CREATE TABLE IF NOT EXISTS sync_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,  -- 'map_updated', 'map_deleted'
    data JSONB NOT NULL,  -- Contains: {mapIds: [...], timestamp, mapId}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster filtering by user
CREATE INDEX IF NOT EXISTS idx_sync_events_user_id ON sync_events(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE sync_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see sync events for their own account
CREATE POLICY "Users can view their sync events"
    ON sync_events FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own sync events
CREATE POLICY "Users can insert their own sync events"
    ON sync_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Optional: Auto-cleanup old sync events (older than 24 hours)
-- This keeps the table lightweight since we only need recent events
ALTER TABLE sync_events ALTER COLUMN created_at SET DEFAULT NOW();

-- Enable realtime for sync_events table
ALTER PUBLICATION supabase_realtime ADD TABLE sync_events;

