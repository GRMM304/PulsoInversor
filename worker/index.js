// Pulso Inversor · Worker
// Sirve el sitio estático y atiende POST /api/enviar-simulacion:
//   1) envía al inversionista su simulación en PDF (adjunto), con un correo de marca que le presenta a su asesor;
//   2) envía a todos los asesores y a la dirección comercial un aviso con los datos y el mismo PDF;
//      el asesor asignado según el monto va como destinatario principal.
// Los correos salen por la API transaccional de Brevo.
//
// Configuración en Cloudflare (Workers > pulsoinversor > Settings > Variables and Secrets):
//   BREVO_API_KEY  (secreto, obligatorio)  clave de API de Brevo
//   SENDER_EMAIL   (opcional)  remitente verificado en Brevo. Por defecto: contacto@pulsoinversor.cl
//   EQUIPO_EMAIL   (opcional)  quienes reciben copia de TODAS las simulaciones, separados por coma.

const DEFAULT_SENDER = 'contacto@pulsoinversor.cl';
const EQUIPO = ['eorrego@grupomm.cl', 'ibarboza@grupomm.cl', 'frojas@grupomm.cl'];
const SITIO = 'https://1.pulsoinversor.cl';
const WHATSAPP = '56983554676';
const MAX_PDF_BYTES = 3 * 1024 * 1024;
const ORIGENES = ['https://1.pulsoinversor.cl', 'http://localhost:8787', 'http://127.0.0.1:8787'];
const TIPOS = {
  proyecta: 'Proyecta un Hogar',
  hipoteca: 'Hipoteca Inteligente',
  circular: 'Inversión Inmobiliaria Circular',
};

// Asesor según el monto simulado (en pesos).
//   hasta $25 MM        → Renato Vargas
//   $25 MM a $50 MM     → Pamela Herrera
//   $50 MM o más        → Iván Barboza y Felipe Rojas
const ASESORES = [
  { hasta: 25e6, personas: [{ nombre: 'Renato Vargas', cargo: 'Asesor de inversiones', email: 'rvargas@grupomm.cl' }] },
  { hasta: 50e6, personas: [{ nombre: 'Pamela Herrera', cargo: 'Asesora de inversiones', email: 'pherrera@partnersadvisers.cl' }] },
  { hasta: Infinity, personas: [
    { nombre: 'Iván Barboza', cargo: 'Cofundador', email: 'ibarboza@grupomm.cl' },
    { nombre: 'Felipe Rojas', cargo: 'Cofundador', email: 'frojas@grupomm.cl' },
  ] },
];
const asesoresPara = (monto) => ASESORES.find((a) => (monto || 0) < a.hasta).personas;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clp = (n) => '$' + Math.round(n || 0).toLocaleString('es-CL');

async function brevo(env, payload) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Brevo ' + r.status + ': ' + (await r.text()).slice(0, 300));
}

/* ---------- Plantilla (mismo formato que los correos de la invitación: simple, solo texto) ---------- */
const C = { verde: '#0E2C28', verde2: '#1E5746', lima: '#C7D95D', texto: '#1F2523', gris: '#4E5A56', fondo: '#F3F5F2', borde: '#E3E8E1' };
const FUENTE = 'Helvetica, Arial, sans-serif';
const P = (t) => `<p style="margin:0 0 14px">${t}</p>`;

function boton(texto, href) {
  return `<a href="${esc(href)}" target="_blank" style="display:inline-block;background:${C.lima};border:1px solid ${C.lima};color:${C.verde};font-family:${FUENTE};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 22px;border-radius:999px;margin:4px 6px 4px 0">${esc(texto)}</a>`;
}

function bloqueResumen(lineas) {
  if (!lineas.length) return '';
  const filas = lineas.map((l) => {
    const i = l.indexOf(':');
    return i > 0 ? `${esc(l.slice(0, i))}: <strong style="color:${C.verde}">${esc(l.slice(i + 1).trim())}</strong>` : esc(l);
  }).join('<br>');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-radius:14px;margin:8px 0 22px">
    <tr><td style="padding:18px 20px;font-family:${FUENTE};color:${C.texto};font-size:15px;line-height:1.7">${filas}</td></tr>
  </table>`;
}

function plantilla({ preheader, eyebrow, titulo, cuerpo, botones = '', pie }) {
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
      <p style="margin:0 0 8px">¿Dudas? Escríbenos por <a href="https://wa.me/${WHATSAPP}" target="_blank" style="color:${C.lima}">WhatsApp +56 9 8355 4676</a> o visítanos en Los Militares 5890, of. 304, Las Condes.</p>
      <p style="margin:0;color:rgba(255,255,255,.55);font-size:12px">${esc(pie)} Pulso Inversor · Una empresa de Grupo MatchMaking.</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function correoInversionista({ tipo, nombre, lineas, personas }) {
  const primer = esc(nombre.split(/\s+/)[0]);
  const varios = personas.length > 1;
  const quien = personas.map((a) => a.nombre).join(' y ');
  const quienCorto = personas.map((a) => a.nombre.split(' ')[0]).join(' y ');
  const cargo = varios ? 'cofundadores de Pulso' : (personas[0].cargo.toLowerCase().startsWith('asesora') ? 'tu asesora' : 'tu asesor');
  const wa = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(`Hola, soy ${nombre}. Hice mi simulación de ${tipo} y me gustaría revisarla con ${quienCorto}.`);
  return plantilla({
    preheader: `Tu simulación de ${tipo} va adjunta en PDF.`,
    eyebrow: `Tu simulación · ${tipo}`,
    titulo: `Gracias, ${primer}. Aquí está tu simulación`,
    cuerpo: P(`Te adjuntamos en PDF la simulación de <strong>${esc(tipo)}</strong> que hiciste en nuestro sitio, para que la revises con calma, la compartas con tu familia o se la muestres a tu abogado.`)
      + bloqueResumen(lineas)
      + P(`<strong>${esc(quien)}</strong>, ${cargo}, ${varios ? 'te escribirán' : 'te escribirá'} en las próximas horas hábiles para resolver tus dudas y, si quieres, mostrarte una operación real con su propiedad, su tasación y el documento que quedaría a tu favor.`)
      + P('No te vamos a pedir que decidas en esa conversación. Puedes venir con tu abogado cuando quieras.')
      + `<p style="margin:0 0 14px;font-size:13px;color:${C.gris}">La simulación es referencial: las condiciones finales dependen de la evaluación y del contrato de cada operación.</p>`,
    botones: boton('Conversar por WhatsApp', wa),
    pie: 'Recibes este correo porque pediste tu simulación en nuestro sitio.',
  });
}

function correoEquipo({ tipo, nombre, email, telefono, monto, lineas, personas }) {
  const waCliente = telefono ? 'https://wa.me/56' + telefono.replace(/^56/, '') + '?text=' + encodeURIComponent(`Hola ${nombre.split(/\s+/)[0]}, te escribo de Pulso Inversor por la simulación de ${tipo} que hiciste en nuestro sitio.`) : '';
  const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'long', timeStyle: 'short' });
  const asignado = personas.map((a) => a.nombre).join(' y ');
  return plantilla({
    preheader: `${nombre} simuló ${tipo}${monto ? ' por ' + clp(monto) : ''}. Asignado a ${asignado}.`,
    eyebrow: `Nueva simulación · ${tipo}`,
    titulo: `${esc(nombre)}${monto ? ' · ' + clp(monto) : ''}`,
    cuerpo: P(`Asesor asignado: <strong>${esc(asignado)}</strong>. Al inversionista le dijimos que ${esc(personas.map((a) => a.nombre.split(' ')[0]).join(' y '))} le escribirá en las próximas horas hábiles.`)
      + bloqueResumen([`Nombre: ${nombre}`, `Correo: ${email}`, `Teléfono: ${telefono ? '+56 ' + telefono : '—'}`, `Simulador: ${tipo}`, `Monto simulado: ${monto ? clp(monto) : '—'}`, `Fecha: ${fecha}`])
      + bloqueResumen(lineas)
      + P('El PDF que recibió va adjunto. Si respondes este correo, le escribes directamente.'),
    botones: waCliente ? boton('Escribirle por WhatsApp', waCliente) : '',
    pie: 'Aviso interno de los simuladores de 1.pulsoinversor.cl.',
  });
}

async function enviarSimulacion(request, env) {
  const origin = request.headers.get('origin') || '';
  if (origin && !ORIGENES.includes(origin)) return json({ ok: false, error: 'origen_no_permitido' }, 403);
  if (!env.BREVO_API_KEY) return json({ ok: false, error: 'correo_no_configurado' }, 503);

  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }
  if (d.website) return json({ ok: true }); // trampa para bots

  const tipo = TIPOS[d.tipo];
  const c = d.cliente || {};
  const nombre = String(c.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const email = String(c.email || '').trim().slice(0, 160);
  const telefono = String(c.telefono || '').replace(/\D/g, '').slice(0, 15);
  if (!tipo || nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'datos_invalidos' }, 400);

  const pdf = String(d.pdfBase64 || '').replace(/^data:application\/pdf;[^,]*,/, '');
  if (!pdf || !/^[A-Za-z0-9+/=]+$/.test(pdf) || pdf.length * 0.75 > MAX_PDF_BYTES) return json({ ok: false, error: 'pdf_invalido' }, 400);
  const archivo = String(d.archivo || 'simulacion-pulso-inversor.pdf').replace(/[^\w.\-]/g, '_').slice(0, 80);
  const lineas = Array.isArray(d.resumen) ? d.resumen.slice(0, 30).map((l) => String(l).slice(0, 200)) : [];
  const monto = Math.max(0, Math.min(Number(d.monto) || 0, 1e12));

  const personas = asesoresPara(monto);
  const sender = { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER };
  const adjunto = [{ content: pdf, name: archivo }];
  const equipo = (env.EQUIPO_EMAIL ? env.EQUIPO_EMAIL.split(',') : EQUIPO).map((s) => s.trim().toLowerCase()).filter(Boolean);
  // Todos los asesores reciben el PDF para prepararse; el asignado va en "Para" y el resto en copia.
  const todosAsesores = ASESORES.flatMap((g) => g.personas.map((a) => a.email.toLowerCase()));
  const paraAsesores = personas.map((a) => a.email.toLowerCase());
  const copias = [...new Set([...todosAsesores, ...equipo])].filter((e) => !paraAsesores.includes(e));

  // 1) Correo al inversionista (responde directo a su asesor)
  await brevo(env, {
    sender, to: [{ email, name: nombre }],
    replyTo: { email: personas[0].email, name: personas[0].nombre },
    subject: `Tu simulación de ${tipo} · Pulso Inversor`,
    htmlContent: correoInversionista({ tipo, nombre, lineas, personas }),
    attachment: adjunto,
    tags: ['simulacion', d.tipo],
  });

  // 2) Aviso al asesor asignado, con copia a la dirección comercial
  await brevo(env, {
    sender,
    to: personas.map((a) => ({ email: a.email, name: a.nombre })),
    cc: copias.length ? copias.map((e) => ({ email: e })) : undefined,
    replyTo: { email, name: nombre },
    subject: `Nueva simulación ${tipo}${monto ? ' · ' + clp(monto) : ''} · ${nombre}`,
    htmlContent: correoEquipo({ tipo, nombre, email, telefono, monto, lineas, personas }),
    attachment: adjunto,
    tags: ['simulacion-equipo', d.tipo],
  });

  return json({ ok: true, asesor: personas.map((a) => a.nombre).join(' y ') });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/enviar-simulacion') {
      if (request.method !== 'POST') return json({ ok: false, error: 'metodo_no_permitido' }, 405);
      try { return await enviarSimulacion(request, env); }
      catch (e) { console.error(e); return json({ ok: false, error: 'envio_fallido' }, 502); }
    }
    return env.ASSETS.fetch(request);
  },
};

