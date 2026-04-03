-- Prospecting Tracker: tablas para tracking automático de cold outreach via YCloud

CREATE TABLE IF NOT EXISTS prospectos (
  id               BIGSERIAL PRIMARY KEY,
  telefono         TEXT UNIQUE NOT NULL,
  negocio          TEXT DEFAULT '',
  primer_contacto  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_contacto  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado           TEXT DEFAULT 'enviado',
  mensajes_enviados INTEGER DEFAULT 1,
  respondio        BOOLEAN DEFAULT FALSE,
  notas            TEXT DEFAULT '',
  CONSTRAINT estado_valido CHECK (estado IN (
    'enviado', 'respondio', 'seguimiento', 'cerrado_positivo', 'cerrado_negativo'
  ))
);

CREATE TABLE IF NOT EXISTS prospectos_mensajes (
  id        BIGSERIAL PRIMARY KEY,
  telefono  TEXT NOT NULL,
  direccion TEXT NOT NULL CHECK (direccion IN ('saliente', 'entrante')),
  tipo      TEXT DEFAULT 'text',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  wamid     TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_prospectos_fecha       ON prospectos (primer_contacto DESC);
CREATE INDEX IF NOT EXISTS idx_prospectos_estado      ON prospectos (estado);
CREATE INDEX IF NOT EXISTS idx_mensajes_telefono      ON prospectos_mensajes (telefono);

-- Función para incrementar mensajes_enviados de forma atómica
CREATE OR REPLACE FUNCTION incrementar_mensajes(p_telefono TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE prospectos
  SET mensajes_enviados = mensajes_enviados + 1,
      ultimo_contacto = NOW()
  WHERE telefono = p_telefono;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función RPC para KPIs por día (últimos 30 días)
CREATE OR REPLACE FUNCTION kpis_por_dia()
RETURNS TABLE (dia DATE, contactos BIGINT, respuestas BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(primer_contacto) AS dia,
    COUNT(*)              AS contactos,
    COUNT(*) FILTER (WHERE respondio = TRUE) AS respuestas
  FROM prospectos
  GROUP BY DATE(primer_contacto)
  ORDER BY dia DESC
  LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sin RLS (tool interno de Tomas, usa service_role en el webhook)
ALTER TABLE prospectos          DISABLE ROW LEVEL SECURITY;
ALTER TABLE prospectos_mensajes DISABLE ROW LEVEL SECURITY;
