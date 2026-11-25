-- Registros de la landing de la campaña Red Capital (5.pulsoinversor.cl)
-- Reemplaza el Excel del equipo comercial: el estado, el asignado y la nota se editan en /panel.
CREATE TABLE IF NOT EXISTS registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creado TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ruta TEXT NOT NULL,                -- inversion | financiamiento
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  edad INTEGER,
  -- Inversión
  monto TEXT, experiencia TEXT, horario TEXT,
  -- Financiamiento
  propiedad TEXT, comuna TEXT, valor TEXT, necesita TEXT, para_que TEXT, urgencia TEXT,
  -- Clasificación automática
  asesor_sugerido TEXT, prioridad TEXT, derivar TEXT,
  -- Consentimientos
  consentimiento TEXT NOT NULL,
  consentimiento_texto TEXT NOT NULL,
  consentimiento_fecha TEXT NOT NULL,
  acepta_publicidad TEXT NOT NULL,
  -- Origen
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  pagina TEXT, ip_pais TEXT,
  -- Gestión comercial
  estado TEXT NOT NULL DEFAULT 'Nuevo',
  asignado TEXT, nota TEXT, actualizado TEXT,
  -- Resultado de los envíos
  aviso_equipo TEXT, correo_confirmacion TEXT, brevo_sync TEXT
);
CREATE INDEX IF NOT EXISTS idx_registros_creado ON registros(creado);
CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros(estado);
CREATE INDEX IF NOT EXISTS idx_registros_email ON registros(email);
