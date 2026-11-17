// Landing "Operaciones reales" (Invierte con Respaldo Inmobiliario) · 4.pulsoinversor.cl
// - Sirve la página (carpeta public/).
// - POST /api/contacto: guarda al interesado en D1, avisa al equipo y le confirma por correo (Brevo).
// - /panel: lista de interesados y descarga CSV (usuario: pulso, clave: secreto CLAVE_PANEL).

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const corta = (v, n) => String(v ?? '').trim().slice(0, n);

const MONTOS = ['Menos de $5 MM', '$5 a $25 MM', '$25 a $100 MM', 'Más de $100 MM'];
const HORARIOS = ['Mañana', 'Tarde', 'Después de las 19:00'];

async function enviarCorreo(env, { para, nombre, asunto, html, etiqueta }) {
  if (!env.BREVO_API_KEY) return 'sin clave Brevo';
  const to = Array.isArray(para) ? para.map((email) => ({ email })) : [{ email: para, name: nombre || undefined }];
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: env.REMITENTE_NOMBRE || 'Pulso Inversor', email: env.REMITENTE_EMAIL },
        to,
        replyTo: { email: env.RESPONDER_A || env.REMITENTE_EMAIL, name: 'Pulso Inversor' },
        subject: asunto,
        htmlContent: html,
        tags: ['landing-operaciones-reales', etiqueta].filter(Boolean),
      }),
    });
    return r.ok ? 'enviado' : `error ${r.status}: ${(await r.text()).slice(0, 200)}`;
  } catch (e) {
    return 'error: ' + e.message;
  }
}

function plantilla(titulo, cuerpo) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f6f2;font-family:Arial,Helvetica,sans-serif;color:#0E2C28">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#0E2C28;padding:22px 28px;color:#C7D95D;font-weight:bold;font-size:18px">Pulso Inversor</td></tr>
<tr><td style="padding:28px">
<h1 style="font-size:21px;margin:0 0 14px;color:#0E2C28">${titulo}</h1>
${cuerpo}
</td></tr>
<tr><td style="padding:18px 28px;background:#f4f6f2;color:#6b7a71;font-size:12px;line-height:1.5">Pulso Inversor, una empresa de Grupo MatchMaking · Los Militares 5890, of. 304, Las Condes.<br>Operaciones bajo contratos civiles, no reguladas por la CMF. Toda inversión tiene riesgos. Revisa los documentos con tu abogado antes de firmar.</td></tr>
</table></td></tr></table></body></html>`;
}

function correoInteresado(d) {
  const primer = esc(d.nombre.split(' ')[0]);
  const p = (t) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px">${t}</p>`;
  if (d.monto === 'Menos de $5 MM') {
    return {
      asunto: 'Recibimos tus datos · Pulso Inversor',
      html: plantilla(`Gracias, ${primer}`, p('Recibimos tus datos. Hoy nuestras operaciones parten en $5 millones, así que no queremos hacerte perder tiempo con una reunión.') + p('Te iremos enviando contenido para que aprendas a evaluar cualquier inversión con respaldo inmobiliario, y te avisaremos cuando tenga sentido conversar.') + p('Si tienes una duda, responde este correo o escríbenos por WhatsApp al +56 9 8355 4676.')),
    };
  }
  return {
    asunto: 'Recibimos tus datos · Agenda tu reunión con Pulso',
    html: plantilla(`Gracias, ${primer}. Ya tenemos tus datos.`,
      p('Un asesor de Pulso te escribirá por WhatsApp con su nombre para coordinar la reunión' + (d.horario ? `, en el horario que elegiste (${esc(d.horario.toLowerCase())})` : '') + '.') +
      (d.operacion ? p(`Anotamos que te interesa la operación <b>${esc(d.operacion)}</b>. En la reunión revisas su ficha, la tasación de la propiedad y qué documento quedaría a tu favor.`) : p('En la reunión te mostramos las operaciones del mes con sus documentos: <b>qué propiedad respalda tu dinero, qué documento queda a tu favor y cómo lo recuperas.</b>')) +
      p('Puedes venir con tu pareja, tu socio o tu abogado. No te vamos a pedir que decidas en la reunión.') +
      `<p style="margin:22px 0"><a href="https://wa.me/56983554676" style="background:#C7D95D;color:#0E2C28;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:999px;display:inline-block">Escríbenos por WhatsApp</a></p>`),
  };
}

function correoEquipo(d, id) {
  const fila = (k, v) => `<tr><td style="padding:6px 10px;color:#6b7a71;font-size:13px;white-space:nowrap">${k}</td><td style="padding:6px 10px;font-size:14px"><b>${esc(v || '—')}</b></td></tr>`;
  const prioridad = d.monto === '$25 a $100 MM' || d.monto === 'Más de $100 MM';
  const tel = d.telefono.replace(/[^0-9]/g, '');
  return {
    asunto: `${prioridad ? '⭐ Prioridad · ' : ''}Nuevo interesado landing operaciones: ${d.nombre} (${d.monto})`,
    html: plantilla(`Nuevo interesado #${id}`, `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">
${fila('Nombre', d.nombre)}${fila('WhatsApp', d.telefono)}${fila('Correo', d.email)}${fila('Operación', d.operacion || 'Aún no elige')}${fila('Monto', d.monto)}${fila('Perfil', d.perfil)}${fila('Horario', d.horario)}${fila('Publicidad', d.acepta_publicidad)}${fila('Video / anuncio', d.utm_content)}${fila('Campaña', [d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(' · '))}
</table>
${prioridad ? '<p style="font-size:14px;margin:0 0 14px;color:#7a5600"><b>$25 MM o más: prioridad uno, contactar en menos de 1 hora hábil.</b></p>' : ''}
<p style="margin:0"><a href="https://wa.me/${tel}" style="background:#25d366;color:#0b2e17;text-decoration:none;font-weight:bold;padding:11px 18px;border-radius:999px;display:inline-block">Abrir WhatsApp</a></p>`),
  };
}

async function guardarContacto(request, env, ctx) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'Datos inválidos' }, 400); }
  if (b.sitio) return json({ ok: true }); // trampa para robots
  const d = {
    nombre: corta(b.nombre, 120),
    telefono: corta(b.telefono, 30),
    email: corta(b.correo, 160).toLowerCase(),
    monto: MONTOS.includes(b.monto) ? b.monto : '',
    experiencia: b.experiencia === 'Sí' || b.experiencia === 'No' ? b.experiencia : '',
    horario: HORARIOS.includes(b.horario) ? b.horario : '',
    operacion: corta(b.operacion, 160),
    consentimiento: b.consentimiento === 'Sí' ? 'Sí' : '',
    acepta_publicidad: b.acepta_publicidad === 'Sí' ? 'Sí' : 'No',
    utm_source: corta(b.utm_source, 120), utm_medium: corta(b.utm_medium, 120), utm_campaign: corta(b.utm_campaign, 160), utm_content: corta(b.utm_content, 160),
    pagina: corta(b.pagina, 400),
  };
  d.perfil = d.experiencia === 'No' ? 'Perfil 1 · primera inversión' : d.experiencia === 'Sí' ? 'Perfil 2 · con experiencia' : '';
  const faltan = [];
  if (!d.nombre) faltan.push('nombre');
  if (d.telefono.replace(/\D/g, '').length < 8) faltan.push('telefono');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) faltan.push('correo');
  if (!d.monto) faltan.push('monto');
  if (!d.experiencia) faltan.push('experiencia');
  if (!d.consentimiento) faltan.push('consentimiento');
  if (faltan.length) return json({ ok: false, error: 'Faltan datos', campos: faltan }, 400);

  const r = await env.DB.prepare(`INSERT INTO interesados (nombre, telefono, email, operacion, monto, experiencia, perfil, horario, consentimiento, acepta_publicidad, utm_source, utm_medium, utm_campaign, utm_content, pagina, ip_pais)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(d.nombre, d.telefono, d.email, d.operacion, d.monto, d.experiencia, d.perfil, d.horario, d.consentimiento, d.acepta_publicidad,
    d.utm_source, d.utm_medium, d.utm_campaign, d.utm_content, d.pagina, request.cf?.country || '').run();
  const id = r.meta.last_row_id;

  ctx.waitUntil((async () => {
    const equipo = String(env.AVISO_EQUIPO_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean);
    const ce = correoEquipo(d, id);
    const ci = correoInteresado(d);
    const [a, c] = await Promise.all([
      equipo.length ? enviarCorreo(env, { para: equipo, asunto: ce.asunto, html: ce.html, etiqueta: 'aviso-equipo' }) : 'sin equipo',
      enviarCorreo(env, { para: d.email, nombre: d.nombre, asunto: ci.asunto, html: ci.html, etiqueta: 'confirmacion' }),
    ]);
    await env.DB.prepare('UPDATE interesados SET aviso_equipo = ?, correo_confirmacion = ? WHERE id = ?').bind(a, c, id).run();
  })());
  return json({ ok: true });
}

function autorizado(request, env) {
  const h = request.headers.get('authorization') || '';
  if (!env.CLAVE_PANEL || !h.startsWith('Basic ')) return false;
  let txt = '';
  try { txt = atob(h.slice(6)); } catch { return false; }
  const i = txt.indexOf(':');
  return txt.slice(0, i) === 'pulso' && txt.slice(i + 1) === env.CLAVE_PANEL;
}

const COLS = ['id', 'creado', 'nombre', 'telefono', 'email', 'operacion', 'monto', 'experiencia', 'perfil', 'horario', 'consentimiento', 'acepta_publicidad', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'aviso_equipo', 'correo_confirmacion'];

async function panel(request, env, csv) {
  if (!autorizado(request, env)) return new Response('Acceso restringido', { status: 401, headers: { 'www-authenticate': 'Basic realm="Panel Pulso", charset="UTF-8"' } });
  const { results } = await env.DB.prepare(`SELECT ${COLS.join(',')} FROM interesados ORDER BY id DESC`).all();
  if (csv) {
    const cel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const cuerpo = '﻿' + [COLS.join(';'), ...results.map((r) => COLS.map((c) => cel(r[c])).join(';'))].join('\r\n');
    return new Response(cuerpo, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="interesados-landing-operaciones.csv"', 'cache-control': 'no-store' } });
  }
  const filas = results.map((r) => `<tr>${['id', 'creado', 'nombre', 'telefono', 'email', 'operacion', 'monto', 'perfil', 'horario', 'acepta_publicidad', 'utm_content'].map((c) => `<td>${esc(c === 'creado' ? new Date(r[c]).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : r[c])}</td>`).join('')}</tr>`).join('');
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Interesados · Landing Operaciones reales</title>
<style>body{font-family:system-ui,sans-serif;margin:0;background:#f4f6f2;color:#0E2C28}header{background:#0E2C28;color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}header b{color:#C7D95D}a.btn{background:#C7D95D;color:#0E2C28;padding:10px 16px;border-radius:999px;font-weight:700;text-decoration:none}main{padding:20px;overflow-x:auto}table{border-collapse:collapse;background:#fff;width:100%;font-size:14px}th,td{padding:9px 10px;border-bottom:1px solid #e3e8e2;text-align:left;white-space:nowrap}th{background:#123D35;color:#fff;font-size:12px;text-transform:uppercase}</style></head>
<body><header><div><b>Interesados</b> · Landing Operaciones reales · ${results.length} en total</div><a class="btn" href="/panel/interesados.csv">Descargar CSV</a></header>
<main><table><thead><tr><th>#</th><th>Fecha</th><th>Nombre</th><th>WhatsApp</th><th>Correo</th><th>Operación</th><th>Monto</th><th>Perfil</th><th>Horario</th><th>Publicidad</th><th>Video</th></tr></thead><tbody>${filas || '<tr><td colspan="11">Aún no hay interesados.</td></tr>'}</tbody></table></main></body></html>`,
  { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contacto') {
      if (request.method !== 'POST') return json({ ok: false }, 405);
      return guardarContacto(request, env, ctx);
    }
    if (url.pathname === '/panel' || url.pathname === '/panel/') return panel(request, env, false);
    if (url.pathname === '/panel/interesados.csv') return panel(request, env, true);
    return env.ASSETS.fetch(request);
  },
};
