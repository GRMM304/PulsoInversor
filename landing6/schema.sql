-- Diagnósticos de la landing 6.pulsoinversor.cl (QR del video FFW)
CREATE TABLE IF NOT EXISTS diagnosticos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,            -- es el folio que va en el mensaje de WhatsApp
  creado TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  nombre TEXT NOT NULL,
  edad INTEGER,
  -- Respuestas
  capital TEXT NOT NULL, objetivo TEXT, horizonte TEXT, experiencia TEXT, reaccion TEXT, proporcion TEXT, ingresos TEXT,
  -- Diagnóstico (recalculado en el servidor con public/assets/js/logica.js)
  perfil TEXT, puntaje INTEGER, resultado TEXT, solucion TEXT, alternativa TEXT, alertas TEXT, asesor_sugerido TEXT,
  -- WhatsApp
  whatsapp_clic TEXT, duda TEXT,
  -- Consentimientos
  consentimiento TEXT NOT NULL, consentimiento_texto TEXT NOT NULL, consentimiento_fecha TEXT NOT NULL, acepta_publicidad TEXT NOT NULL,
  -- Origen
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT, pagina TEXT, ip_pais TEXT,
  -- Gestión
  estado TEXT NOT NULL DEFAULT 'Nuevo', asignado TEXT, nota TEXT, actualizado TEXT
);
CREATE INDEX IF NOT EXISTS idx_diag_creado ON diagnosticos(creado);
CREATE INDEX IF NOT EXISTS idx_diag_estado ON diagnosticos(estado);
