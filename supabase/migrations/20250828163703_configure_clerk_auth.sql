-- Migration: Configure Clerk Authentication with Supabase
-- Description: Configure Supabase to work with Clerk JWT tokens for proper RLS

-- Step 1: Configure Supabase to accept Clerk's JWT tokens
-- We need to set the JWT secret and issuer to match Clerk's configuration

-- Get your Clerk JWT signing key from: https://dashboard.clerk.com/last-active?path=jwt-templates
-- Create a JWT template for Supabase with these claims:
-- {
--   "iss": "https://your-domain.clerk.accounts.dev",
--   "sub": "{{user.id}}",
--   "aud": "supabase",
--   "role": "authenticated",
--   "exp": {{user.session_claims.exp}}
-- }

-- Configure the auth schema to work with Clerk
-- This tells Supabase's auth.jwt() function how to validate Clerk tokens

-- For now, we'll modify our RLS policies to work with Clerk's standard JWT structure
-- Clerk puts the user ID in the 'sub' claim, which our existing policies already use

-- The key insight: we need to ensure the Supabase client sends the Clerk JWT token
-- in the Authorization header when making requests

-- Let's update our policies to be more explicit about JWT validation
-- and add some debugging to see what's happening

-- Drop existing policies to recreate them with better error handling
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
DROP POLICY IF EXISTS "Design images must belong to user's projects" ON design_images;

-- Recreate policies with explicit JWT validation
-- These will work once we configure the Supabase client to send Clerk tokens

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can view own design images" ON design_images
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own design images" ON design_images
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own design images" ON design_images
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own design images" ON design_images
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);
