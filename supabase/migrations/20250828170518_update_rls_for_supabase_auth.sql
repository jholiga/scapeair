-- Migration: Update RLS for Supabase Auth
-- Description: Replace JWT-based RLS policies with Supabase Auth's auth.uid()

-- Drop existing policies that use JWT claims
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view own design images" ON design_images;
DROP POLICY IF EXISTS "Users can insert own design images" ON design_images;
DROP POLICY IF EXISTS "Users can update own design images" ON design_images;
DROP POLICY IF EXISTS "Users can delete own design images" ON design_images;

-- Create new policies using Supabase Auth's auth.uid()
-- This works automatically with Supabase Auth sessions

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (user_id = auth.uid()::text);

-- Design images policies
CREATE POLICY "Users can view own design images" ON design_images
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own design images" ON design_images
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own design images" ON design_images
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own design images" ON design_images
    FOR DELETE USING (user_id = auth.uid()::text);

-- Storage policies for Supabase Auth
-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can see project-images bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Anyone can see project-images bucket" ON storage.buckets;

-- Create new storage policies using auth.uid()
CREATE POLICY "Users can upload own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can see project-images bucket" ON storage.buckets
    FOR SELECT USING (id = 'project-images');
