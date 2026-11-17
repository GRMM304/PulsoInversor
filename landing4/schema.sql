-- Interesados de la landing "Operaciones reales" (4.pulsoinversor.cl)
CREATE TABLE IF NOT EXISTS interesados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creado TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  operacion TEXT,
  monto TEXT,
  experiencia TEXT,
  perfil TEXT,
  horario TEXT,
  consentimiento TEXT NOT NULL,
  acepta_publicidad TEXT NOT NULL,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT,
  pagina TEXT,
  ip_pais TEXT,
  aviso_equipo TEXT,
  correo_confirmacion TEXT
);
CREATE INDEX IF NOT EXISTS idx_interesados_creado ON interesados(creado);
