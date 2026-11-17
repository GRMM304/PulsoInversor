-- Base de asistencia del Desayuno de Inversionistas Modelo IGR (Cloudflare D1).
-- Fechas en ISO 8601 UTC. Columnas enviado_*: fecha de envío, 'omitido' si no correspondía, NULL si está pendiente.

CREATE TABLE IF NOT EXISTS asistentes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  token                TEXT    NOT NULL UNIQUE,              -- identificador privado para el enlace de cancelación
  nombre               TEXT    NOT NULL,
  apellidos            TEXT    NOT NULL,
  email                TEXT    NOT NULL UNIQUE,              -- una inscripción por email (si repite, se actualiza)
  telefono             TEXT    NOT NULL,                     -- WhatsApp con código de país
  acompanante          TEXT,                                 -- nombre del acompañante, o NULL si viene solo
  estacionamiento      INTEGER NOT NULL DEFAULT 0,           -- 1 = pidió estacionamiento
  patente              TEXT,                                 -- patente del auto si pidió estacionamiento
  acepta_privacidad    INTEGER NOT NULL DEFAULT 0,           -- 1 = aceptó la Política de privacidad (obligatorio)
  acepta_publicidad    INTEGER NOT NULL DEFAULT 0,           -- 1 = aceptó recibir publicidad (opcional)
  estado               TEXT    NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'cancelado')),
  origen               TEXT,                                 -- de dónde llegó (parámetro ?origen= del enlace)
  creado               TEXT    NOT NULL,
  actualizado          TEXT    NOT NULL,
  cancelado            TEXT,
  asistio              INTEGER NOT NULL DEFAULT 0,           -- 1 = el equipo marcó su llegada en el panel
  llegada              TEXT,
  enviado_confirmacion TEXT,
  enviado_r2d          TEXT,                                 -- recordatorio 2 días antes
  enviado_r12h         TEXT,                                 -- recordatorio 12 horas antes
  enviado_rhoy         TEXT,                                 -- recordatorio el mismo día
  enviado_post         TEXT,                                 -- seguimiento posterior (gracias / te echamos de menos)
  ultimo_error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_asistentes_estado ON asistentes (estado);
