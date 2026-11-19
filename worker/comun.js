// Pulso Inversor · piezas comunes del Worker (configuración, Brevo y plantilla de correo).

export const DEFAULT_SENDER = 'contacto@pulsoinversor.cl';
export const EQUIPO = ['eorrego@grupomm.cl', 'ibarboza@grupomm.cl', 'frojas@grupomm.cl'];
export const SITIO = 'https://www.pulsoinversor.cl';
// WhatsApp de Pulso Inversor en respond.io: contesta el agente Lorenzo y deriva al asesor.
export const WHATSAPP = '56958792038';
export const WHATSAPP_TXT = '+56 9 5879 2038';
export const RESENAS_GOOGLE = 'https://g.page/r/CV1wmi0Qf_B7EAE/review';
export const MAX_PDF_BYTES = 3 * 1024 * 1024;
export const ORIGENES = ['https://www.pulsoinversor.cl', 'https://pulsoinversor.cl', 'https://1.pulsoinversor.cl', 'http://localhost:8787', 'http://127.0.0.1:8787'];
export const TIPOS = {
  proyecta: 'Renta de Capital',
  hipoteca: 'Hipoteca Inteligente',
  circular: 'Inversión Inmobiliaria Circular',
  patrimonial: 'Arquitectura de Capital',
};

// Enlaces de agendamiento de Brevo Meetings por tramo (pegar la URL de la página de reservas de cada asesor).
// Si un tramo no tiene enlace, el correo de seguimiento usa el formulario propio de /seguimiento/agendar.
// Con un enlace se redirige directo; con varios, la persona elige con quién agendar.
export const AGENDA_BREVO = {
  0: [{ nombre: 'Renato Vargas', url: 'https://meet.brevo.com/pulsoinversor/renato-vargas' }], // hasta $25 MM
  1: [{ nombre: 'Pamela Herrera', url: 'https://meet.brevo.com/pulsoinversor/pamela-herrera' }], // $25 a $50 MM
  2: [ // $50 MM o más
    { nombre: 'Iván Barboza', url: 'https://meet.brevo.com/pulsoinversor/ivan-barboza' },
    { nombre: 'Felipe Rojas', url: 'https://meet.brevo.com/pulsoinversor/felipe-rojas' },
  ],
};

// Asesor según el monto simulado (en pesos).
//   hasta $25 MM        → Renato Vargas
//   $25 MM a $50 MM     → Pamela Herrera
//   $50 MM o más        → Iván Barboza y Felipe Rojas
export const ASESORES = [
  { hasta: 25e6, personas: [{ nombre: 'Renato Vargas', cargo: 'Asesor de inversiones', email: 'rvargas@grupomm.cl' }] },
  { hasta: 50e6, personas: [{ nombre: 'Pamela Herrera', cargo: 'Asesora de inversiones', email: 'pherrera@partnersadvisers.cl' }] },
  { hasta: Infinity, personas: [
    { nombre: 'Iván Barboza', cargo: 'Cofundador', email: 'ibarboza@grupomm.cl' },
    { nombre: 'Felipe Rojas', cargo: 'Cofundador', email: 'frojas@grupomm.cl' },
  ] },
];
// Reconoce al asesor por el nombre de la reunión de Brevo (ej. "Renato Vargas", "Reunión con Pamela").
const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function asesorDeReunion(nombreReunion) {
  const t = sinTildes(nombreReunion);
  for (let g = 0; g < ASESORES.length; g++) for (const a of ASESORES[g].personas) {
    const ape = sinTildes(a.nombre).split(' ')[1];   // por apellido, para no confundir a dos personas con el mismo nombre
    if (t.includes(sinTildes(a.nombre)) || (ape && new RegExp('\\b' + ape + '\\b').test(t))) return { grupo: g, asesor: a };
  }
  return null;
}
export const asesoresPara = (monto) => ASESORES.find((a) => (monto || 0) < a.hasta).personas;

export const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clp = (n) => '$' + Math.round(n || 0).toLocaleString('es-CL');

// Modo de prueba: si quien simula es uno de estos correos, TODO (aviso a asesores, encuesta, agenda)
// le llega solo a esa misma casilla con [PRUEBA] en el asunto, y el seguimiento sale a los 3 minutos.
export const CORREOS_PRUEBA = ['eorrego@grupomm.cl'];
export const esPrueba = (email) => CORREOS_PRUEBA.includes(String(email || '').trim().toLowerCase());

export async function brevo(env, payload, inversionista) {
  if (esPrueba(inversionista)) {
    payload = { ...payload, to: [{ email: inversionista }], subject: '[PRUEBA] ' + payload.subject };
    delete payload.cc;
    if (payload.scheduledAt) payload.scheduledAt = new Date(Date.now() + 3 * 60e3).toISOString();
  }
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Brevo ' + r.status + ': ' + (await r.text()).slice(0, 300));
  return r.json().catch(() => ({}));
}

/* ---------- Plantilla (mismo formato que los correos de la invitación: simple, solo texto) ---------- */
export const C = { verde: '#0E2C28', verde2: '#1E5746', lima: '#C7D95D', texto: '#1F2523', gris: '#4E5A56', fondo: '#F3F5F2', borde: '#E3E8E1' };
export const FUENTE = 'Helvetica, Arial, sans-serif';
export const P = (t) => `<p style="margin:0 0 14px">${t}</p>`;

export function boton(texto, href, primario = true) {
  return `<a href="${esc(href)}" target="_blank" style="display:inline-block;background:${primario ? C.lima : '#ffffff'};border:1px solid ${primario ? C.lima : C.borde};color:${C.verde};font-family:${FUENTE};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 22px;border-radius:999px;margin:4px 6px 4px 0">${esc(texto)}</a>`;
}

export function bloqueResumen(lineas) {
  if (!lineas.length) return '';
  const filas = lineas.map((l) => {
    const i = l.indexOf(':');
    return i > 0 ? `${esc(l.slice(0, i))}: <strong style="color:${C.verde}">${esc(l.slice(i + 1).trim())}</strong>` : esc(l);
  }).join('<br>');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-radius:14px;margin:8px 0 22px">
    <tr><td style="padding:18px 20px;font-family:${FUENTE};color:${C.texto};font-size:15px;line-height:1.7">${filas}</td></tr>
  </table>`;
}

export function plantilla({ preheader, eyebrow, titulo, cuerpo, botones = '', pie }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(eyebrow)}</title></head>
<body style="margin:0;padding:0;background:${C.fondo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo}">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${C.borde}">
    <tr><td style="padding:22px 28px;border-bottom:3px solid ${C.lima}">
      <img src="${SITIO}/assets/img/email/logo-pulso.png" width="300" alt="Pulso Inversor · Una empresa de Grupo MatchMaking" style="display:block;width:300px;max-width:100%;height:auto;border:0">
    </td></tr>
    <tr><td style="padding:30px 28px 8px;font-family:${FUENTE};color:${C.texto}">
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:3px;font-weight:bold;color:${C.verde2};text-transform:uppercase">${esc(eyebrow)}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;color:${C.verde}">${titulo}</h1>
      <div style="font-size:16px;line-height:1.6;color:${C.texto}">${cuerpo}</div>
      <div style="margin:0 0 24px">${botones}</div>
    </td></tr>
    <tr><td style="padding:20px 28px 26px;background:${C.verde};font-family:${FUENTE};font-size:13px;line-height:1.55;color:rgba(255,255,255,.78)">
      <p style="margin:0 0 8px">¿Dudas? Escríbenos por <a href="https://wa.me/${WHATSAPP}" target="_blank" style="color:${C.lima}">WhatsApp ${WHATSAPP_TXT}</a> o visítanos en Los Militares 5890, of. 304, Las Condes.</p>
      <p style="margin:0;color:rgba(255,255,255,.55);font-size:12px">${esc(pie)} Pulso Inversor · Una empresa de Grupo MatchMaking.</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
