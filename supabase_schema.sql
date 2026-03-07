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


-- ── Shared Maps Table ────────────────────────────────────────────────────────
-- Stores publicly shared map snapshots so anyone with the link can view them.

CREATE TABLE IF NOT EXISTS maps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Map',
    content JSONB NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maps_user_id ON maps(user_id);
CREATE INDEX IF NOT EXISTS idx_maps_is_public ON maps(is_public);

ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Only signed-in users can read public maps
CREATE POLICY "Authenticated users can view public maps"
    ON maps FOR SELECT
    USING (is_public = true AND auth.uid() IS NOT NULL);

-- Authenticated users can insert their own maps; allow null user_id for anonymous shares
CREATE POLICY "Users can insert maps"
    ON maps FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own maps
CREATE POLICY "Users can delete their own maps"
    ON maps FOR DELETE
    USING (auth.uid() = user_id);
