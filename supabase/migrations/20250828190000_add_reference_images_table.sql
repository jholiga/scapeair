-- Migration: Add Reference Images Table
-- Description: Allow multiple reference images per project

-- Create reference_images table
CREATE TABLE IF NOT EXISTS reference_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS reference_images_project_id_idx ON reference_images(project_id);
CREATE INDEX IF NOT EXISTS reference_images_user_id_idx ON reference_images(user_id);
CREATE INDEX IF NOT EXISTS reference_images_created_at_idx ON reference_images(created_at DESC);
CREATE INDEX IF NOT EXISTS reference_images_is_primary_idx ON reference_images(is_primary);

-- Enable Row Level Security
ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reference_images
CREATE POLICY "Users can view own reference images" ON reference_images
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own reference images" ON reference_images
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own reference images" ON reference_images
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own reference images" ON reference_images
    FOR DELETE USING (user_id = auth.uid()::text);

-- Ensure reference images belong to user's projects
CREATE POLICY "Reference images must belong to user's projects" ON reference_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = reference_images.project_id 
            AND projects.user_id = auth.uid()::text
        )
    ); 