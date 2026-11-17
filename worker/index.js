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
  { hasta: 25e6, personas: [{ nombre: 'Renato Vargas', cargo: 'Asesor de inversiones', email: 'rvargas@grupomm.cl', foto: 'renato.jpg' }] },
  { hasta: 50e6, personas: [{ nombre: 'Pamela Herrera', cargo: 'Asesora de inversiones', email: 'pherrera@partnersadvisers.cl', foto: 'pamela.jpg' }] },
  { hasta: Infinity, personas: [
    { nombre: 'Iván Barboza', cargo: 'Cofundador', email: 'ibarboza@grupomm.cl', foto: 'ivan.jpg' },
    { nombre: 'Felipe Rojas', cargo: 'Cofundador', email: 'frojas@grupomm.cl', foto: 'felipe-rojas.jpg' },
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

/* ---------- Plantilla de marca ---------- */
const C = { verde: '#0E2C28', verde2: '#123D35', lima: '#C7D95D', oro: '#FFC33F', texto: '#1F2523', gris: '#4E5A56', suave: '#7B8783', fondo: '#F3F5F2', linea: '#E3E8E2' };
const P = (t, extra = '') => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${C.texto};${extra}">${t}</p>`;

function plantilla({ preheader, cuerpo, pie = 'Recibes este correo porque pediste tu simulación en nuestro sitio.' }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Pulso Inversor</title></head>
<body style="margin:0;padding:0;background:${C.fondo};font-family:Arial,Helvetica,sans-serif;color:${C.texto}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="padding:0 4px 18px"><img src="${SITIO}/assets/img/email/logo-pulso.png" width="300" alt="Pulso Inversor · Una empresa de Grupo MatchMaking" style="display:block;width:300px;max-width:80%;height:auto;border:0"></td></tr>
<tr><td style="background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid ${C.linea}">
${cuerpo}
</td></tr>
<tr><td style="padding:22px 8px 0;font-size:12px;line-height:1.6;color:${C.suave};text-align:center">
<b style="color:${C.gris}">Pulso Inversor SpA</b> · Una empresa de Grupo MatchMaking<br>
Los Militares 5890, of. 304, Las Condes · WhatsApp +56 9 8355 4676 · <a href="${SITIO}" style="color:${C.suave}">pulsoinversor.cl</a><br>
${pie}
</td></tr>
</table></td></tr></table></body></html>`;
}

function tarjetaAsesores(personas) {
  const celdas = personas.map((a) => `<td valign="top" style="padding:0 18px 0 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="padding-right:12px"><img src="${SITIO}/assets/img/email/${a.foto}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:50%;border:2px solid ${C.lima}"></td>
<td valign="middle"><div style="font-size:15px;font-weight:bold;color:#ffffff">${esc(a.nombre)}</div><div style="font-size:13px;color:#B9CBC4">${esc(a.cargo)}</div></td></tr></table></td>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.verde};border-radius:16px"><tr><td style="padding:20px 22px">
<div style="font-size:12px;letter-spacing:1.5px;font-weight:bold;color:${C.lima};text-transform:uppercase;margin-bottom:12px">${personas.length > 1 ? 'Quienes te acompañan' : 'Quien te acompaña'}</div>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>${celdas}</tr></table>
</td></tr></table>`;
}

function correoInversionista({ tipo, nombre, lineas, personas, archivo }) {
  const primer = esc(nombre.split(/\s+/)[0]);
  const quien = personas.map((a) => a.nombre.split(' ')[0]).join(' y ');
  const wa = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(`Hola, soy ${nombre}. Hice mi simulación de ${tipo} en el sitio y me gustaría revisarla con ${quien}.`);
  const filas = lineas.map((l) => {
    const i = l.indexOf(':');
    const k = i > 0 ? l.slice(0, i) : l, v = i > 0 ? l.slice(i + 1).trim() : '';
    return `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.linea};font-size:14px;color:${C.gris}">${esc(k)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid ${C.linea};font-size:14px;font-weight:bold;color:${C.verde}">${esc(v)}</td></tr>`;
  }).join('');
  const cuerpo = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.verde};padding:34px 32px 30px;border-bottom:4px solid ${C.lima}">
<div style="display:inline-block;background:rgba(199,217,93,.16);color:${C.lima};font-size:12px;font-weight:bold;letter-spacing:1px;padding:6px 12px;border-radius:999px;margin-bottom:14px">TU SIMULACIÓN · ${esc(tipo.toUpperCase())}</div>
<h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff">Hola ${primer}, aquí están tus números</h1>
<p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#CFE0D9">Gracias por darte el tiempo de simular. Es el primer paso para decidir con calma y con la información en la mano.</p>
</td></tr>
<tr><td style="padding:30px 32px 6px">
${P('Te adjuntamos el <b>PDF con tu simulación</b> para que lo revises cuando quieras, lo compartas con tu familia o se lo muestres a tu abogado. Sabemos que invertir tus ahorros es una decisión importante, y queremos que la tomes sin apuro.')}
${filas ? `<div style="font-size:12px;letter-spacing:1.5px;font-weight:bold;color:${C.suave};text-transform:uppercase;margin:6px 0 4px">Lo esencial de tu simulación</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px">${filas}</table>` : ''}
${tarjetaAsesores(personas)}
<p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:${C.texto}">${esc(quien)} ${personas.length > 1 ? 'te escribirán' : 'te escribirá'} en las próximas horas hábiles para resolver tus dudas y, si quieres, mostrarte una operación real con su propiedad, su tasación y los documentos que quedarían a tu favor. <b>No te vamos a pedir que decidas en esa conversación.</b></p>
</td></tr>
<tr><td style="padding:24px 32px 8px" align="left">
<a href="${wa}" style="display:inline-block;background:${C.lima};color:${C.verde};text-decoration:none;font-weight:bold;font-size:16px;padding:15px 26px;border-radius:999px">Conversar por WhatsApp →</a>
</td></tr>
<tr><td style="padding:22px 32px 30px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-radius:14px"><tr><td style="padding:18px 20px;font-size:14px;line-height:1.6;color:${C.gris}">
<b style="color:${C.verde}">Antes de cualquier decisión, revisa siempre tres cosas:</b><br>
1. Qué propiedad respalda tu dinero y cuánto vale.<br>
2. Qué documento firmado ante notario queda a tu favor.<br>
3. Cuándo y cómo recuperas tu capital.<br>
Puedes venir con tu abogado a nuestra oficina en Las Condes cuando quieras.
</td></tr></table>
<p style="margin:18px 0 0;font-size:12px;line-height:1.55;color:${C.suave}">Tu simulación es referencial: las condiciones finales dependen de la evaluación y del contrato de cada operación. Si tienes cualquier duda, responde este correo.</p>
</td></tr></table>`;
  return plantilla({ preheader: `Tu simulación de ${tipo} va adjunta en PDF. ${quien} te acompaña desde aquí.`, cuerpo });
}

function correoEquipo({ tipo, nombre, email, telefono, monto, lineas, personas }) {
  const tel = telefono ? '+56 ' + telefono : '—';
  const waCliente = telefono ? 'https://wa.me/56' + telefono.replace(/^56/, '') + '?text=' + encodeURIComponent(`Hola ${nombre.split(/\s+/)[0]}, te escribo de Pulso Inversor por la simulación de ${tipo} que hiciste en nuestro sitio.`) : '';
  const fila = (k, v) => `<tr><td style="padding:9px 0;border-bottom:1px solid ${C.linea};font-size:13px;color:${C.suave};white-space:nowrap;padding-right:16px">${k}</td><td style="padding:9px 0;border-bottom:1px solid ${C.linea};font-size:14px;font-weight:bold;color:${C.texto}">${v}</td></tr>`;
  const lista = lineas.map((l) => `<li style="margin:0 0 6px">${esc(l)}</li>`).join('');
  const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'long', timeStyle: 'short' });
  const cuerpo = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.verde};padding:26px 30px;border-bottom:4px solid ${C.lima}">
<div style="font-size:12px;letter-spacing:1.5px;font-weight:bold;color:${C.lima};text-transform:uppercase;margin-bottom:8px">Nueva simulación · ${esc(tipo)}</div>
<h1 style="margin:0;font-size:24px;line-height:1.25;color:#ffffff">${esc(nombre)}${monto ? ' · ' + clp(monto) : ''}</h1>
<p style="margin:8px 0 0;font-size:14px;color:#CFE0D9">Asesor asignado: <b style="color:#ffffff">${esc(personas.map((a) => a.nombre).join(' y '))}</b></p>
</td></tr>
<tr><td style="padding:24px 30px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${fila('Nombre', esc(nombre))}${fila('Correo', `<a href="mailto:${esc(email)}" style="color:${C.verde2}">${esc(email)}</a>`)}${fila('Teléfono', esc(tel))}${fila('Simulador', esc(tipo))}${fila('Monto simulado', monto ? clp(monto) : '—')}${fila('Fecha', esc(fecha))}
</table>
${lista ? `<div style="font-size:12px;letter-spacing:1.5px;font-weight:bold;color:${C.suave};text-transform:uppercase;margin:22px 0 8px">Resumen</div><ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.5;color:${C.texto}">${lista}</ul>` : ''}
</td></tr>
<tr><td style="padding:20px 30px 28px">
${waCliente ? `<a href="${waCliente}" style="display:inline-block;background:${C.lima};color:${C.verde};text-decoration:none;font-weight:bold;font-size:15px;padding:13px 22px;border-radius:999px">Escribirle por WhatsApp →</a>` : ''}
<p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:${C.gris}">El PDF que recibió va adjunto. Al inversionista le dijimos que ${esc(personas.map((a) => a.nombre.split(' ')[0]).join(' y '))} le escribirá en las próximas horas hábiles. Puedes responder este correo para escribirle directamente.</p>
</td></tr></table>`;
  return plantilla({ preheader: `${nombre} simuló ${tipo}${monto ? ' por ' + clp(monto) : ''}.`, cuerpo, pie: 'Aviso interno de los simuladores de 1.pulsoinversor.cl.' });
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
    subject: `${nombre.split(' ')[0]}, aquí está tu simulación de ${tipo}`,
    htmlContent: correoInversionista({ tipo, nombre, lineas, personas, archivo }),
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

