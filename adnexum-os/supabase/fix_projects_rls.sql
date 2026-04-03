-- FIX PROJECT CREATION ISSUES
-- Run this script in Supabase SQL Editor to fix "user_id" errors and RLS permission denied errors.

-- 1. Auto-fill user_id on insert
-- This ensures that when you create a project without providing a user_id, 
-- it automatically uses the ID of the currently logged-in user.
ALTER TABLE public.projects ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- We drop existing policies first to ensure a clean state and avoid conflicts.

-- VIEW: Allow all authenticated users to view projects
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
CREATE POLICY "Enable read access for authenticated users" ON public.projects
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Allow authenticated users to create projects
-- The WITH CHECK ensures that the user_id of the new row matches the user's ID
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
CREATE POLICY "Enable insert for authenticated users" ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Allow authenticated users to update any project
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.projects;
CREATE POLICY "Enable update for authenticated users" ON public.projects
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: Allow authenticated users to delete projects
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.projects;
CREATE POLICY "Enable delete for authenticated users" ON public.projects
    FOR DELETE
    TO authenticated
    USING (true);
