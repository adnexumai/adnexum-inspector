-- Migration to add V3 Tracker columns to daily_logs
ALTER TABLE daily_logs 
ADD COLUMN IF NOT EXISTS prospectos_hoy JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS seguimientos_hoy JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pomodoros INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS kpi_targets JSONB DEFAULT '{}'::jsonb;
