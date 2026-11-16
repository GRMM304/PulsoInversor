// Datos del evento y calendario de envíos.
// Horas en UTC. Chile continental está en UTC-3 (horario de verano) en noviembre de 2026.

export const EVENTO = {
  titulo: 'Desayuno de Inversionistas Modelo IGR',
  descripcion: 'Un espacio exclusivo para compartir el estado actual de Pulso Inversor, sus resultados y las nuevas oportunidades que vienen para nuestros inversionistas.',
  fechaTexto: 'Viernes 20 de noviembre',
  horaTexto: '09:30 a 11:00 hrs.',
  inicio: '2026-11-20T12:30:00Z', // 09:30 Chile
  fin: '2026-11-20T14:00:00Z',    // 11:00 Chile
  lugar: 'Oficina Grupo Matchmaking',
  direccion: 'Los Militares 5890, oficina 304, Las Condes',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Los%20Militares%205890%2C%20Las%20Condes%2C%20Santiago%2C%20Chile',
  whatsapp: '56983554676',
  whatsappTexto: '+56 9 8355 4676',
  telefono: '+56 2 3365 5239',
  sitio: 'https://invitacion.pulsoinversor.cl',
  privacidad: 'https://pulsoinversor.cl/privacidad',
};

// Cada envío: desde cuándo puede salir (desde) y hasta cuándo tiene sentido (hasta).
// Solo lo reciben quienes confirmaron ANTES de "desde" (quien confirma después ya recibió la confirmación).
export const ENVIOS = [
  { tipo: 'r2d',  columna: 'enviado_r2d',  desde: '2026-11-18T12:30:00Z', hasta: '2026-11-18T23:00:00Z' }, // miércoles 18, 09:30
  { tipo: 'r12h', columna: 'enviado_r12h', desde: '2026-11-20T00:30:00Z', hasta: '2026-11-20T03:00:00Z' }, // jueves 19, 21:30
  { tipo: 'rhoy', columna: 'enviado_rhoy', desde: '2026-11-20T10:30:00Z', hasta: '2026-11-20T12:30:00Z' }, // viernes 20, 07:30
  // Seguimiento posterior (viernes 20, 16:00). Solo sale si el equipo marcó al menos una llegada en el panel.
  { tipo: 'gracias',  columna: 'enviado_post', desde: '2026-11-20T19:00:00Z', hasta: '2026-11-22T23:00:00Z', post: 'asistio' },
  { tipo: 'ausente',  columna: 'enviado_post', desde: '2026-11-20T19:00:00Z', hasta: '2026-11-22T23:00:00Z', post: 'no_asistio' },
];

// Para Google Calendar y el archivo .ics.
export function fechasCompactas() {
  const f = (iso) => iso.replace(/[-:]/g, '').replace('.000', '');
  return { inicio: f(EVENTO.inicio), fin: f(EVENTO.fin) };
}

export function enlaceGoogleCalendar() {
  const { inicio, fin } = fechasCompactas();
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENTO.titulo + ' · Pulso Inversor',
    dates: `${inicio}/${fin}`,
    details: EVENTO.descripcion + '\n\nDudas: WhatsApp ' + EVENTO.whatsappTexto,
    location: EVENTO.lugar + ', ' + EVENTO.direccion,
    ctz: 'America/Santiago',
  });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

export function archivoIcs(uid) {
  const { inicio, fin } = fechasCompactas();
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pulso Inversor//Desayuno IGR//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid || 'desayuno-igr-20261120'}@pulsoinversor.cl`,
    `DTSTAMP:${ahora}`,
    `DTSTART:${inicio}`,
    `DTEND:${fin}`,
    `SUMMARY:${esc(EVENTO.titulo + ' · Pulso Inversor')}`,
    `LOCATION:${esc(EVENTO.lugar + ', ' + EVENTO.direccion)}`,
    `DESCRIPTION:${esc(EVENTO.descripcion + '\nDudas: WhatsApp ' + EVENTO.whatsappTexto)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(EVENTO.titulo)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
