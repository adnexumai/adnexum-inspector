-- Create crm_stages table
CREATE TABLE IF NOT EXISTS crm_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view/edit stages (simplified for team usage)
CREATE POLICY "Enable all access for authenticated users" ON crm_stages
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Insert default stages (Agency Pipeline)
INSERT INTO crm_stages (name, color, position) VALUES
('Inbox', 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', 0),
('Cualificación', 'bg-blue-500/10 text-blue-400 border-blue-500/20', 1),
('Reunión Agendada', 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 2),
('Propuesta Enviada', 'bg-purple-500/10 text-purple-400 border-purple-500/20', 3),
('Negociación', 'bg-orange-500/10 text-orange-400 border-orange-500/20', 4),
('Ganado', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 5),
('Perdido', 'bg-red-500/10 text-red-400 border-red-500/20', 6)
ON CONFLICT (name) DO NOTHING;

-- Modify leads table to use TEXT instead of ENUM
-- We alter the column type. Data formatted as text will be preserved.
ALTER TABLE leads ALTER COLUMN estado TYPE TEXT;

-- Drop the old enum if desired, or keep it. Safest to drop dependency.
DROP TYPE IF EXISTS lead_status CASCADE; -- Cascade might remove default value constraint
-- Re-add default
ALTER TABLE leads ALTER COLUMN estado SET DEFAULT 'Inbox';

-- Update existing leads to match new stages if necessary (simple mapping)
-- 'Nuevo' -> 'Inbox'
UPDATE leads SET estado = 'Inbox' WHERE estado = 'Nuevo';
-- 'Interesado' -> 'Cualificación'
UPDATE leads SET estado = 'Cualificación' WHERE estado = 'Interesado';
-- 'Llamada Agendada' -> 'Reunión Agendada' (matches)
-- 'Propuesta' -> 'Propuesta Enviada'
UPDATE leads SET estado = 'Propuesta Enviada' WHERE estado = 'Propuesta';
