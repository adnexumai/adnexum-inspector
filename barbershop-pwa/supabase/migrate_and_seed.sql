-- ============================================
-- ALPHA OMEGA ESTUDIO — Migration + Seed
-- Run this in Supabase SQL Editor
-- This script adds missing columns and updates data
-- ============================================

-- Add missing columns if they don't exist
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS notas_estilo TEXT;
ALTER TABLE cortes_historico ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Add check constraint for status (ignore error if already exists)
DO $$ BEGIN
  ALTER TABLE cortes_historico ADD CONSTRAINT cortes_historico_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add update policy for cortes_historico (for approve/reject workflow)
DO $$ BEGIN
  CREATE POLICY "Public Update Cortes" ON cortes_historico FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add update policy for sucursales
DO $$ BEGIN
  CREATE POLICY "Public Update Sucursales" ON sucursales FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_cortes_status ON cortes_historico(status);

-- ============================================
-- UPDATE: Rename sucursal to Alpha Omega Estudio
-- ============================================
UPDATE sucursales
SET nombre = 'Alpha Omega Estudio', precio_corte = 8000
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- If no sucursal exists, create it
INSERT INTO sucursales (id, nombre, config_cortes_premio, porcentaje_descuento, precio_corte)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Alpha Omega Estudio', 5, 60, 8000)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED: Realistic client data
-- ============================================

-- Upsert clients with realistic style notes
INSERT INTO clientes (telefono, nombre, cortes_acumulados, sucursal_id, notas_estilo) VALUES
  ('1122334455', 'Martín López', 4, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Degradado bajo, pomada mate. Le gusta el volumen arriba.'),
  ('1133445566', 'Carlos García', 5, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Corte clásico con raya al costado. Barba perfilada.'),
  ('1144556677', 'Diego Fernández', 2, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fade medio, texturizado arriba. Sin producto.'),
  ('1155667788', 'Lucas Rodríguez', 3, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Buzz cut #2 costados, tijera arriba. Viene cada 3 semanas.'),
  ('1166778899', 'Matías Torres', 4, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mullet moderno. Siempre pide decoloración en las puntas.'),
  ('1177889900', 'Nicolás Pérez', 1, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Skin fade alto, línea dura. Barba candado.'),
  ('1188990011', 'Tomás Sánchez', 3, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'French crop con flequillo texturizado. Cera mate.'),
  ('1199001122', 'Joaquín Álvarez', 2, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Taper clásico. Probar pomada con brillo la próxima.'),
  ('1100112233', 'Franco Morales', 4, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mid fade + diseño en la nuca. Siempre trae referencia de IG.'),
  ('1111223344', 'Agustín Romero', 1, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL)
ON CONFLICT (telefono) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  cortes_acumulados = EXCLUDED.cortes_acumulados,
  notas_estilo = EXCLUDED.notas_estilo;

-- ============================================
-- SEED: Realistic cut history
-- ============================================

-- Clean up old demo history without status
DELETE FROM cortes_historico WHERE status IS NULL;

-- Insert realistic cut history
INSERT INTO cortes_historico (cliente_telefono, fecha, precio_final, sucursal_id, status) VALUES
  -- Martín López (4 cortes)
  ('1122334455', NOW() - INTERVAL '45 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1122334455', NOW() - INTERVAL '30 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1122334455', NOW() - INTERVAL '16 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1122334455', NOW() - INTERVAL '3 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Carlos García (5 cortes — premio!)
  ('1133445566', NOW() - INTERVAL '60 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1133445566', NOW() - INTERVAL '45 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1133445566', NOW() - INTERVAL '30 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1133445566', NOW() - INTERVAL '15 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1133445566', NOW() - INTERVAL '2 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Diego Fernández (2 cortes)
  ('1144556677', NOW() - INTERVAL '20 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1144556677', NOW() - INTERVAL '5 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Lucas Rodríguez (3 cortes)
  ('1155667788', NOW() - INTERVAL '42 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1155667788', NOW() - INTERVAL '21 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1155667788', NOW() - INTERVAL '1 day', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Matías Torres (4 cortes)
  ('1166778899', NOW() - INTERVAL '50 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1166778899', NOW() - INTERVAL '35 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1166778899', NOW() - INTERVAL '18 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1166778899', NOW() - INTERVAL '4 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Nicolás Pérez (1 corte)
  ('1177889900', NOW() - INTERVAL '7 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Tomás Sánchez (3 cortes)
  ('1188990011', NOW() - INTERVAL '38 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1188990011', NOW() - INTERVAL '22 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1188990011', NOW() - INTERVAL '6 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Joaquín Álvarez (2 cortes)
  ('1199001122', NOW() - INTERVAL '25 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1199001122', NOW() - INTERVAL '8 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Franco Morales (4 cortes)
  ('1100112233', NOW() - INTERVAL '48 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1100112233', NOW() - INTERVAL '33 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1100112233', NOW() - INTERVAL '17 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  ('1100112233', NOW() - INTERVAL '2 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved'),
  -- Agustín Romero (1 corte)
  ('1111223344', NOW() - INTERVAL '10 days', 8000, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'approved');

-- Verify
SELECT 'Sucursal: ' || nombre || ' | Precio: $' || precio_corte FROM sucursales LIMIT 1;
SELECT 'Clientes totales: ' || COUNT(*) FROM clientes;
SELECT 'Cortes totales: ' || COUNT(*) FROM cortes_historico WHERE status = 'approved';
