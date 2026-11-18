-- Base D1 pulso-simulaciones: una fila por simulación enviada desde 1.pulsoinversor.cl
CREATE TABLE IF NOT EXISTS simulaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creado TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  tipo TEXT NOT NULL,
  monto INTEGER,
  grupo INTEGER,
  asesor TEXT,
  seguimiento_estado TEXT,          -- programado / error / sin_firma
  seguimiento_para TEXT,            -- fecha programada del correo de 48 h
  agenda_click TEXT,                -- primera vez que tocó "Agendar reunión"
  agenda_con TEXT,                  -- con quién eligió agendar (tramo de Iván y Felipe)
  agenda_form TEXT,                 -- solicitud por formulario propio (JSON), si no había agenda Brevo
  agendado TEXT,                    -- marcado por el equipo: reunión confirmada
  contactado_click TEXT,            -- tocó "Ya me contactaron"
  encuesta TEXT,                    -- fecha de respuesta
  encuesta_json TEXT,
  satisfaccion INTEGER,
  recomienda INTEGER,
  notas TEXT
);
CREATE INDEX IF NOT EXISTS idx_sim_creado ON simulaciones(creado);

-- Reuniones avisadas por Brevo Meetings (webhooks "Meeting booked" y "Meeting cancelled")
CREATE TABLE IF NOT EXISTS reuniones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recibido TEXT NOT NULL,
  evento TEXT NOT NULL,             -- reservada / cancelada
  email TEXT,
  nombre TEXT,
  inicio TEXT,
  fin TEXT,
  reunion TEXT,                     -- meeting_name
  cuenta TEXT,                      -- account_email (usuario Brevo del asesor)
  datos TEXT                        -- JSON completo recibido
);
CREATE INDEX IF NOT EXISTS idx_reu_email ON reuniones(email);

-- Recordatorios de reuniones (24 h, 1 h y 1 minuto antes). Los envía el cron del Worker cada minuto.
CREATE TABLE IF NOT EXISTS recordatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creado TEXT NOT NULL,
  email TEXT NOT NULL,
  nombre TEXT,
  asesor TEXT,
  inicio TEXT NOT NULL,
  fin TEXT,
  url_video TEXT,
  url_cambio TEXT,
  lugar TEXT,
  cancelada TEXT,
  r24 TEXT,                         -- fecha de envío, 'omitido' o 'error: ...'
  r1h TEXT,
  r1m TEXT,
  p1h TEXT,                         -- agradecimiento + encuesta, 1 h después de terminada
  p48 TEXT                          -- seguimiento (remarketing), 48 h después de terminada
);
CREATE INDEX IF NOT EXISTS idx_rec_inicio ON recordatorios(inicio);
