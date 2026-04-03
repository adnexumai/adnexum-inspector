-- Agregar contenido completo al log de mensajes
ALTER TABLE prospectos_mensajes
  ADD COLUMN IF NOT EXISTS contenido   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS nombre_contacto TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payload_raw JSONB DEFAULT '{}';

-- Agregar campos de análisis AI a prospectos
ALTER TABLE prospectos
  ADD COLUMN IF NOT EXISTS resumen_ia      TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS oportunidad_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_analisis  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nombre_contacto  TEXT DEFAULT '';

-- Índice para consultas de análisis
CREATE INDEX IF NOT EXISTS idx_prospectos_analisis ON prospectos (ultimo_analisis);