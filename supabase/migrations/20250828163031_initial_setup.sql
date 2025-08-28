-- Migration: Initial Setup for ScapeAir
-- Description: Create all tables, RLS policies, and storage configuration

-- Create custom types
CREATE TYPE project_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');

-- Create profiles table (for user data)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    client_name TEXT,
    client_email TEXT,
    status project_status DEFAULT 'draft',
    reference_photo_url TEXT,
    reference_photo_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create design_images table
CREATE TABLE IF NOT EXISTS design_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    generation_params JSONB,
    is_favorite BOOLEAN DEFAULT FALSE,
    based_on_photo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS design_images_project_id_idx ON design_images(project_id);
CREATE INDEX IF NOT EXISTS design_images_user_id_idx ON design_images(user_id);
CREATE INDEX IF NOT EXISTS design_images_created_at_idx ON design_images(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- RLS Policies for design_images
CREATE POLICY "Users can view own design images" ON design_images
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own design images" ON design_images
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own design images" ON design_images
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own design images" ON design_images
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Additional security: Ensure design_images belong to user's projects
CREATE POLICY "Design images must belong to user's projects" ON design_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = design_images.project_id 
            AND projects.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS is already enabled on storage tables by Supabase

-- Storage policies for project-images bucket
CREATE POLICY "Users can upload own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-images' AND 
        auth.jwt() ->> 'sub' = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-images' AND 
        auth.jwt() ->> 'sub' = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-images' AND 
        auth.jwt() ->> 'sub' = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can see project-images bucket" ON storage.buckets
    FOR SELECT USING (id = 'project-images');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
