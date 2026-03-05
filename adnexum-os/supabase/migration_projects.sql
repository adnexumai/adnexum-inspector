-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create table if it doesn't exist (Full definition with all columns)
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  lead_id uuid references public.leads,
  title text not null,
  description text default '',
  status text check (status in ('not_started', 'in_progress', 'completed', 'on_hold')) default 'not_started',
  client_name text default '',
  service_type text default '',
  start_date date,
  end_date date,
  budget numeric default 0,
  monthly_revenue numeric default 0,
  progress integer default 0,
  contact_email text default '',
  contact_phone text default '',
  notas text default '',
  tags jsonb default '[]'::jsonb,
  documents jsonb default '[]'::jsonb,
  deliverables jsonb default '[]'::jsonb,
  checklist_data jsonb default '{}'::jsonb,
  kpis jsonb default '{}'::jsonb,
  drive_folder_url text default '',
  repo_url text default '',
  figma_url text default '',
  notion_url text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add columns if table exists but is missing them (Upgrade path)
-- Note: 'ADD COLUMN IF NOT EXISTS' is supported in Postgres 9.6+
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_name text default '',
ADD COLUMN IF NOT EXISTS service_type text default '',
ADD COLUMN IF NOT EXISTS monthly_revenue numeric default 0,
ADD COLUMN IF NOT EXISTS progress integer default 0,
ADD COLUMN IF NOT EXISTS contact_email text default '',
ADD COLUMN IF NOT EXISTS contact_phone text default '',
ADD COLUMN IF NOT EXISTS notas text default '',
ADD COLUMN IF NOT EXISTS tags jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documents jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS deliverables jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS checklist_data jsonb default '{}'::jsonb,
ADD COLUMN IF NOT EXISTS kpis jsonb default '{}'::jsonb,
ADD COLUMN IF NOT EXISTS drive_folder_url text default '',
ADD COLUMN IF NOT EXISTS repo_url text default '',
ADD COLUMN IF NOT EXISTS figma_url text default '',
ADD COLUMN IF NOT EXISTS notion_url text default '';

-- 3. Enable RLS
alter table public.projects enable row level security;
