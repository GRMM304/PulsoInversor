// Pulso Inversor · Seguimiento de simulaciones
// 1) Al enviar una simulación se programa en Brevo (scheduledAt) un correo de seguimiento a las 48 horas.
// 2) Ese correo trae dos botones con un enlace firmado (sin base de datos):
//    · /seguimiento/agendar   → la persona pide una reunión con su asesor (le llega al asesor, copia a dirección comercial).
//    · /seguimiento/encuesta  → si ya la contactaron, responde una encuesta breve (le llega a ENCUESTA_EMAIL).
//
// Secreto necesario en Cloudflare: FIRMA_SEGUIMIENTO (texto aleatorio para firmar los enlaces).

import { avisoRespond, RESPOND_APP, AGENDA_BREVO, ASESORES, SITIO, WHATSAPP, WHATSAPP_TXT, DEFAULT_SENDER, C, P, esc, clp, brevo, boton, bloqueResumen, plantilla } from './comun.js';

export const HORAS_SEGUIMIENTO = 48;
const ENCUESTA_EMAIL = ['eorrego@grupomm.cl'];
const COPIA_AGENDA = ['eorrego@grupomm.cl'];
const VIGENCIA_DIAS = 90;
const PIXEL = '4384764601785320';

/* ---------- Enlace firmado ---------- */
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const enc = new TextEncoder();
async function clave(env) {
  return crypto.subtle.importKey('raw', enc.encode(env.FIRMA_SEGUIMIENTO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function firmar(env, datos) {
  const cuerpo = b64u(enc.encode(JSON.stringify(datos)));
  const firma = b64u(await crypto.subtle.sign('HMAC', await clave(env), enc.encode(cuerpo)));
  return cuerpo + '.' + firma;
}
async function leer(env, token) {
  if (!env.FIRMA_SEGUIMIENTO || !token || token.indexOf('.') < 0) return null;
  const [cuerpo, firma] = token.split('.');
  try {
    const ok = await crypto.subtle.verify('HMAC', await clave(env), deB64u(firma), enc.encode(cuerpo));
    if (!ok) return null;
    const d = JSON.parse(new TextDecoder().decode(deB64u(cuerpo)));
    if (!d.f || Date.now() - d.f > VIGENCIA_DIAS * 864e5) return null;
    return d;
  } catch (e) { return null; }
}
// Registra en la base lo que hizo la persona (solo si el enlace trae el id de la simulación).
async function registrar(env, d, sql, ...vals) {
  if (!env.DB || !d.i) return;
  try { await env.DB.prepare(sql).bind(...vals, d.i).run(); } catch (e) { console.error('db', e); }
}
const ahora = () => new Date().toISOString();
const personasDe = (d) => (ASESORES[d.g] || ASESORES[0]).personas;
const nombres = (ps) => ps.map((a) => a.nombre).join(' y ');
const cortos = (ps) => ps.map((a) => a.nombre.split(' ')[0]).join(' y ');

/* ---------- Correo de seguimiento (48 h) ---------- */
export async function programarSeguimiento(env, { id, nombre, email, telefono, tipo, monto, grupo }) {
  if (!env.FIRMA_SEGUIMIENTO) return 'sin_firma';
  const t = await firmar(env, { i: id, n: nombre, e: email, p: telefono, s: tipo, m: Math.round(monto || 0), g: grupo, f: Date.now() });
  const ps = ASESORES[grupo].personas, varios = ps.length > 1, quien = cortos(ps);
  const html = plantilla({
    preheader: `¿Te quedó alguna duda con tu simulación de ${tipo}? ${quien} puede ayudarte.`,
    eyebrow: `Seguimiento · ${tipo}`,
    titulo: `Hola ${esc(nombre.split(' ')[0])}, ¿pudiste revisar tu simulación?`,
    cuerpo: P(`Hace dos días te enviamos tu simulación de <strong>${esc(tipo)}</strong>. Sabemos que una decisión así se toma con calma, y queremos asegurarnos de que tengas todo lo que necesitas.`)
      + P(`Si quieres revisarla con alguien, <strong>${esc(nombres(ps))}</strong> ${varios ? 'pueden' : 'puede'} reunirse contigo en nuestra oficina, por videollamada o por teléfono. Elige el día y el horario que te acomode.`),
    botones: boton(`Agendar reunión con ${quien}`, `${SITIO}/seguimiento/agendar?t=${t}`)
      + `<p style="margin:22px 0 8px;font-size:15px;line-height:1.6;color:${C.texto}">¿${esc(quien)} ya ${varios ? 'conversaron' : 'conversó'} contigo? Cuéntanos cómo te fue, nos toma un minuto mejorar con tu opinión.</p>`
      + boton('Ya me contactaron', `${SITIO}/seguimiento/encuesta?t=${t}`, false),
    pie: 'Recibes este correo porque pediste tu simulación en nuestro sitio.',
  });
  const r = await brevo(env, {
    sender: { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER },
    to: [{ email, name: nombre }],
    replyTo: { email: ps[0].email, name: ps[0].nombre },
    subject: `${nombre.split(' ')[0]}, ¿te quedó alguna duda con tu simulación?`,
    htmlContent: html,
    scheduledAt: new Date(Date.now() + HORAS_SEGUIMIENTO * 3600e3).toISOString(),
    tags: ['simulacion-seguimiento'],
  }, email);
  return r.messageId || r.batchId || 'programado';
}

/* ---------- Páginas ---------- */
function pagina(titulo, cuerpo, extraHead = '') {
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)} · Pulso Inversor</title><meta name="robots" content="noindex"><link rel="icon" href="/assets/img/favicon-48.png" type="image/png">
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');</script>
${extraHead}
<style>
*{box-sizing:border-box}body{margin:0;background:${C.fondo};font-family:Helvetica,Arial,sans-serif;color:${C.texto};line-height:1.55}
.wrap{max-width:620px;margin:0 auto;padding:24px 16px 48px}
.card{background:#fff;border:1px solid ${C.borde};border-radius:20px;overflow:hidden}
.top{padding:20px 26px;border-bottom:3px solid ${C.lima}}.top img{display:block;width:280px;max-width:100%;height:auto}
.in{padding:28px 26px 30px}.eyebrow{margin:0 0 8px;font-size:12px;letter-spacing:3px;font-weight:700;color:${C.verde2};text-transform:uppercase}
h1{margin:0 0 14px;font-size:26px;line-height:1.2;color:${C.verde}}p{margin:0 0 14px;font-size:16px}
fieldset{border:0;padding:0;margin:22px 0 0}legend{font-weight:700;font-size:16px;color:${C.verde};margin-bottom:10px;padding:0}
.ops{display:flex;flex-wrap:wrap;gap:8px}.ops label{position:relative}
.ops input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.ops span{display:inline-block;padding:10px 16px;border:1.5px solid ${C.borde};border-radius:999px;font-size:15px;background:#fff;cursor:pointer}
.ops input:checked+span{background:${C.verde};border-color:${C.verde};color:#fff}
.ops input:focus-visible+span{outline:3px solid ${C.lima};outline-offset:2px}
.escala span{min-width:44px;text-align:center;padding:10px 0}
.ayuda{display:flex;justify-content:space-between;font-size:13px;color:${C.gris};margin-top:6px}
input[type=date],textarea{width:100%;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid ${C.borde};border-radius:12px;background:#fff;color:${C.texto}}
textarea{min-height:96px;resize:vertical}
button{margin-top:26px;background:${C.lima};color:${C.verde};border:0;border-radius:999px;padding:15px 26px;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
.nota{font-size:13px;color:${C.gris};margin-top:18px}.pie{padding:18px 26px;background:${C.verde};color:rgba(255,255,255,.78);font-size:13px}
.pie a{color:${C.lima}}.err{color:#b3432c;font-weight:700}
</style></head><body><div class="wrap"><div class="card">
<div class="top"><a href="/"><img src="/assets/img/email/logo-pulso.png" alt="Pulso Inversor · Una empresa de Grupo MatchMaking"></a></div>
<div class="in">${cuerpo}</div>
<div class="pie">¿Dudas? Escríbenos por <a href="https://wa.me/${WHATSAPP}">WhatsApp ${WHATSAPP_TXT}</a> · Los Militares 5890, of. 304, Las Condes.</div>
</div></div></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}
const opciones = (name, lista, req = true, clase = '') => `<div class="ops ${clase}">${lista.map((o, i) => `<label><input type="radio" name="${name}" value="${esc(o)}"${req && i === 0 ? ' required' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;
const enlaceVencido = () => pagina('Enlace no válido', `<p class="eyebrow">Seguimiento</p><h1>Este enlace ya no está disponible</h1><p>Puede que haya vencido o que se haya copiado incompleto. Escríbenos por WhatsApp y te ayudamos de inmediato.</p><p><a href="https://wa.me/${WHATSAPP}" style="color:${C.verde2};font-weight:700">Escribir por WhatsApp →</a></p>`);
const leerForm = async (request) => { const f = await request.formData(); const o = {}; for (const [k, v] of f) o[k] = String(v).trim().slice(0, 1200); return o; };

/* ---------- Agendar reunión ---------- */
const FRANJAS = ['Mañana (9:00 a 13:00)', 'Tarde (15:00 a 19:00)', 'Me da lo mismo'];
const MODALIDADES = ['En la oficina (Las Condes)', 'Videollamada', 'Llamada telefónica'];

async function agendar(request, env, url) {
  const t = request.method === 'POST' ? null : url.searchParams.get('t');
  if (request.method !== 'POST') {
    const d = await leer(env, t);
    if (!d) return enlaceVencido();
    // Si el tramo tiene agenda de Brevo, se redirige allí (el enlace del correo no cambia aunque se cambie la agenda).
    const agendas = (AGENDA_BREVO[d.g] || []).filter((a) => a.url);
    await registrar(env, d, 'UPDATE simulaciones SET agenda_click = COALESCE(agenda_click, ?) WHERE id = ?', ahora());
    let con = parseInt(url.searchParams.get('con'), 10);
    // Si el enlace viene de una reunión con un asesor concreto, va directo a su agenda.
    if (!agendas[con] && d.a) con = agendas.findIndex((x) => x.nombre === d.a);
    if (agendas[con]) {
      await registrar(env, d, 'UPDATE simulaciones SET agenda_con = ? WHERE id = ?', agendas[con].nombre);
      return Response.redirect(agendas[con].url, 302);
    }
    if (agendas.length === 1) {
      await registrar(env, d, 'UPDATE simulaciones SET agenda_con = ? WHERE id = ?', agendas[0].nombre);
      return Response.redirect(agendas[0].url, 302);
    }
    if (agendas.length > 1) {
      return pagina('Agendar reunión', `<p class="eyebrow">Agendar reunión · ${esc(d.s)}</p>
<h1>Hola ${esc(d.n.split(' ')[0])}, elige con quién quieres reunirte</h1>
<p>${esc(agendas.map((a) => a.nombre).join(' y '))} son los cofundadores de Pulso. Elige a uno y luego el día y la hora que te acomoden. Puedes venir con tu pareja, tu socio o tu abogado.</p>
${agendas.map((a, i) => `<p><a href="/seguimiento/agendar?t=${esc(t)}&amp;con=${i}" style="display:inline-block;background:${C.lima};color:${C.verde};font-weight:700;text-decoration:none;padding:14px 24px;border-radius:999px">Agendar con ${esc(a.nombre)} →</a></p>`).join('')}
<p class="nota">No te vamos a pedir que decidas en la reunión.</p>`);
    }
    const ps = personasDe(d), varios = ps.length > 1;
    const manana = new Date(Date.now() + 864e5 - 3 * 3600e3).toISOString().slice(0, 10);
    return pagina('Agendar reunión', `<p class="eyebrow">Agendar reunión · ${esc(d.s)}</p>
<h1>Hola ${esc(d.n.split(' ')[0])}, coordinemos tu reunión con ${esc(cortos(ps))}</h1>
<p>Cuéntanos qué te acomoda y ${esc(cortos(ps))} te ${varios ? 'escribirán' : 'escribirá'} por WhatsApp para confirmar la hora. Puedes venir con tu pareja, tu socio o tu abogado.</p>
<form method="post"><input type="hidden" name="t" value="${esc(t)}">
<fieldset><legend>¿Qué día prefieres?</legend><input type="date" name="dia" min="${manana}" required></fieldset>
<fieldset><legend>¿En qué horario?</legend>${opciones('franja', FRANJAS)}</fieldset>
<fieldset><legend>¿Cómo prefieres reunirte?</legend>${opciones('modalidad', MODALIDADES)}</fieldset>
<fieldset><legend>¿Algo que quieras revisar en la reunión? <span style="font-weight:400;color:${C.gris}">(opcional)</span></legend><textarea name="comentario" maxlength="1000" placeholder="Por ejemplo: quiero ver una operación con hipoteca a 21 meses"></textarea></fieldset>
<button type="submit">Solicitar reunión</button>
<p class="nota">No te vamos a pedir que decidas en la reunión.</p></form>`);
  }
  const f = await leerForm(request);
  const d = await leer(env, f.t);
  if (!d) return enlaceVencido();
  if (!f.dia || !FRANJAS.includes(f.franja) || !MODALIDADES.includes(f.modalidad)) return pagina('Agendar reunión', `<p class="err">Faltan datos. Vuelve atrás y completa el día, el horario y la modalidad.</p>`);
  await registrar(env, d, 'UPDATE simulaciones SET agenda_form = ? WHERE id = ?', JSON.stringify({ fecha: ahora(), dia: f.dia, franja: f.franja, modalidad: f.modalidad, comentario: f.comentario || '' }));
  const ps = personasDe(d), varios = ps.length > 1;
  const diaTxt = new Date(f.dia + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  const sender = { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER };
  const copias = COPIA_AGENDA.filter((e) => !ps.some((a) => a.email === e));
  await brevo(env, {
    sender, to: ps.map((a) => ({ email: a.email, name: a.nombre })), cc: copias.length ? copias.map((e) => ({ email: e })) : undefined,
    replyTo: { email: d.e, name: d.n },
    subject: `Pide reunión: ${d.n} · ${diaTxt}, ${f.franja.split(' (')[0].toLowerCase()}`,
    htmlContent: plantilla({
      preheader: `${d.n} quiere reunirse ${diaTxt}. Confírmale por WhatsApp desde respond.io.`,
      eyebrow: `Solicitud de reunión · ${d.s}`,
      titulo: `${esc(d.n)} quiere reunirse contigo`,
      cuerpo: P(`Respondió el correo de seguimiento de su simulación. Escríbele por WhatsApp desde respond.io para confirmar la hora exacta.`)
        + avisoRespond(d.p)
        + bloqueResumen([`Día preferido: ${diaTxt}`, `Horario: ${f.franja}`, `Modalidad: ${f.modalidad}`, `Comentario: ${f.comentario || '—'}`])
        + bloqueResumen([`Nombre: ${d.n}`, `Correo: ${d.e}`, `Teléfono: ${d.p ? '+56 ' + d.p : '—'}`, `Simulador: ${d.s}`, `Monto simulado: ${d.m ? clp(d.m) : '—'}`, `Asesor asignado: ${nombres(ps)}`]),
      botones: boton('Abrir respond.io', RESPOND_APP),
      pie: 'Aviso interno del seguimiento de simulaciones de pulsoinversor.cl.',
    }),
    tags: ['seguimiento-agenda'],
  }, d.e);
  await brevo(env, {
    sender, to: [{ email: d.e, name: d.n }], replyTo: { email: ps[0].email, name: ps[0].nombre },
    subject: `Recibimos tu solicitud de reunión · Pulso Inversor`,
    htmlContent: plantilla({
      preheader: `${cortos(ps)} te escribirá por WhatsApp para confirmar la hora.`,
      eyebrow: 'Solicitud de reunión',
      titulo: `Gracias, ${esc(d.n.split(' ')[0])}. Ya le avisamos a ${esc(cortos(ps))}`,
      cuerpo: P(`Pediste reunirte el <strong>${esc(diaTxt)}</strong>, ${esc(f.franja.toLowerCase())}, ${esc(f.modalidad.toLowerCase())}. ${esc(cortos(ps))} te ${varios ? 'escribirán' : 'escribirá'} por WhatsApp para confirmar la hora exacta.`)
        + P('Puedes venir con tu pareja, tu socio o tu abogado. No te vamos a pedir que decidas en la reunión.'),
      pie: 'Recibes este correo porque pediste una reunión con Pulso Inversor.',
    }),
    tags: ['seguimiento-agenda-cliente'],
  }, d.e);
  return pagina('Reunión solicitada', `<p class="eyebrow">Solicitud enviada</p><h1>¡Listo, ${esc(d.n.split(' ')[0])}!</h1>
<p>Le avisamos a <strong>${esc(nombres(ps))}</strong>. Te ${varios ? 'escribirán' : 'escribirá'} por WhatsApp para confirmar la hora de tu reunión del ${esc(diaTxt)}.</p>
<p>También te enviamos un correo con el resumen de tu solicitud.</p>`, `<script>fbq('track','Schedule');</script>`);
}

/* ---------- Encuesta de experiencia ---------- */
const MEDIOS = ['WhatsApp', 'Llamada', 'Correo', 'Reunión en la oficina', 'Videollamada'];
const DUDAS = ['Sí, todas', 'En parte', 'No'];
const ETAPAS = ['Quiero avanzar con una inversión', 'Lo estoy evaluando', 'Por ahora no'];

async function encuesta(request, env, url) {
  if (request.method !== 'POST') {
    const t = url.searchParams.get('t');
    const d = await leer(env, t);
    if (!d) return enlaceVencido();
    await registrar(env, d, 'UPDATE simulaciones SET contactado_click = COALESCE(contactado_click, ?) WHERE id = ?', ahora());
    const ps = personasDe(d);
    const quienes = [...ps.map((a) => a.nombre), 'Otra persona del equipo'];
    return pagina('Cuéntanos tu experiencia', `<p class="eyebrow">Tu experiencia · ${esc(d.s)}</p>
<h1>Gracias por conversar con nosotros, ${esc(d.n.split(' ')[0])}</h1>
<p>Son seis preguntas rápidas. Tu opinión nos ayuda a acompañar mejor a cada persona que confía en Pulso.</p>
<form method="post"><input type="hidden" name="t" value="${esc(t)}">
<fieldset><legend>¿Quién te contactó?</legend>${opciones('quien', quienes)}</fieldset>
<fieldset><legend>¿Cómo te contactaron?</legend>${opciones('medio', MEDIOS)}</fieldset>
<fieldset><legend>¿Qué tan satisfecho quedaste con la atención?</legend>${opciones('satisfaccion', ['1', '2', '3', '4', '5'], true, 'escala')}<div class="ayuda"><span>1 · Nada satisfecho</span><span>5 · Muy satisfecho</span></div></fieldset>
<fieldset><legend>¿Te resolvieron tus dudas?</legend>${opciones('dudas', DUDAS)}</fieldset>
<fieldset><legend>Del 0 al 10, ¿qué tan probable es que recomiendes Pulso a un amigo o familiar?</legend>${opciones('recomienda', ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], true, 'escala')}<div class="ayuda"><span>0 · Nada probable</span><span>10 · Muy probable</span></div></fieldset>
<fieldset><legend>¿En qué estás hoy?</legend>${opciones('etapa', ETAPAS)}</fieldset>
<fieldset><legend>¿Algo que quieras contarnos? <span style="font-weight:400;color:${C.gris}">(opcional)</span></legend><textarea name="comentario" maxlength="1000"></textarea></fieldset>
<button type="submit">Enviar mi opinión</button></form>`);
  }
  const f = await leerForm(request);
  const d = await leer(env, f.t);
  if (!d) return enlaceVencido();
  const n = (v, max) => /^\d+$/.test(v || '') && +v <= max;
  if (!f.quien || !MEDIOS.includes(f.medio) || !n(f.satisfaccion, 5) || +f.satisfaccion < 1 || !DUDAS.includes(f.dudas) || !n(f.recomienda, 10) || !ETAPAS.includes(f.etapa)) {
    return pagina('Encuesta', `<p class="err">Falta responder alguna pregunta. Vuelve atrás y complétala, por favor.</p>`);
  }
  await registrar(env, d, 'UPDATE simulaciones SET encuesta = ?, encuesta_json = ?, satisfaccion = ?, recomienda = ?, contactado_click = COALESCE(contactado_click, ?) WHERE id = ?',
    ahora(), JSON.stringify({ quien: f.quien, medio: f.medio, satisfaccion: +f.satisfaccion, dudas: f.dudas, recomienda: +f.recomienda, etapa: f.etapa, comentario: f.comentario || '' }), +f.satisfaccion, +f.recomienda, ahora());
  const ps = personasDe(d);
  const nps = +f.recomienda, tipoNps = nps >= 9 ? 'Promotor' : nps >= 7 ? 'Neutro' : 'Detractor';
  await brevo(env, {
    sender: { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER },
    to: ENCUESTA_EMAIL.map((e) => ({ email: e })), replyTo: { email: d.e, name: d.n },
    subject: `Encuesta: ${d.n} · satisfacción ${f.satisfaccion}/5 · recomienda ${nps}/10`,
    htmlContent: plantilla({
      preheader: `${d.n}: ${f.satisfaccion}/5, recomienda ${nps}/10 (${tipoNps}). ${f.etapa}.`,
      eyebrow: `Encuesta de experiencia · ${d.s}`,
      titulo: `${esc(d.n)} respondió la encuesta`,
      cuerpo: P(`Confirmó que ya fue contactado y respondió la encuesta del correo de seguimiento.`)
        + bloqueResumen([`Quién lo contactó: ${f.quien}`, `Medio: ${f.medio}`, `Satisfacción con la atención: ${f.satisfaccion} de 5`, `Dudas resueltas: ${f.dudas}`, `Recomendaría Pulso: ${nps} de 10 (${tipoNps})`, `En qué está hoy: ${f.etapa}`, `Comentario: ${f.comentario || '—'}`])
        + bloqueResumen([`Nombre: ${d.n}`, `Correo: ${d.e}`, `Teléfono: ${d.p ? '+56 ' + d.p : '—'}`, `Simulador: ${d.s}`, `Monto simulado: ${d.m ? clp(d.m) : '—'}`, `Asesor asignado: ${nombres(ps)}`, `Fecha de la simulación: ${new Date(d.f).toLocaleDateString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'long' })}`]),
      pie: 'Aviso interno del seguimiento de simulaciones de pulsoinversor.cl.',
    }),
    tags: ['seguimiento-encuesta'],
  }, d.e);
  return pagina('Gracias', `<p class="eyebrow">Encuesta enviada</p><h1>¡Gracias, ${esc(d.n.split(' ')[0])}!</h1>
<p>Recibimos tu opinión. Nos ayuda mucho a mejorar cómo acompañamos a cada persona.</p>
<p>Si te quedó alguna duda, escríbenos por WhatsApp cuando quieras.</p>`);
}

export async function rutaSeguimiento(request, env, url) {
  if (!['GET', 'POST'].includes(request.method)) return new Response('Método no permitido', { status: 405 });
  if (url.pathname === '/seguimiento/agendar') return agendar(request, env, url);
  if (url.pathname === '/seguimiento/encuesta') return encuesta(request, env, url);
  return null;
}
