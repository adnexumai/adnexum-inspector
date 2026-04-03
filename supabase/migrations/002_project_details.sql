-- Add description to projects for "Notion-like" summary
ALTER TABLE projects ADD COLUMN description text;

-- Create project_files table
CREATE TABLE project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  type text,
  size int,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- OPEN ACCESS POLICIES (Internal Team Mode)
-- Allow any authenticated user to VIEW all projects and files
-- This is necessary so the developer (Erwin) can see projects assigned to him
-- even if he didn't create them.

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;

-- Create new permissive VIEW policies (Team View)
CREATE POLICY "Team can view all projects" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Team can view all leads" ON leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Team can view all tasks" ON tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Team can view all files" ON project_files FOR SELECT USING (auth.role() = 'authenticated');

-- Keep WRITE policies restrictive (only creator can edit?) 
-- OR make it collaborative (anyone can edit).
-- For an agency OS, usually fast collaboration is preferred. Let's allow edit for all for now.

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Team can update all projects" ON projects FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert policies usually require setting user_id which is enforced by app, so we can keep as is OR allow any insert.
-- We'll keep insert restrictive for now or just allow it.
-- Let's keep "Users can insert own..." but maybe rename to generic.
-- Existing policies: "Users can insert own projects" WITH CHECK (auth.uid() = user_id).
-- This is fine.

-- File policies
CREATE POLICY "Team can insert files" ON project_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Team can delete files" ON project_files FOR DELETE USING (auth.role() = 'authenticated');
