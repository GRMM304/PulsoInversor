// Landing campaña Red Capital (doble ruta) · 5.pulsoinversor.cl
// - Sirve la página (carpeta public/).
// - POST /api/registro: guarda en D1, avisa al equipo según la ruta, confirma al interesado y sincroniza el contacto en Brevo
//   (consentimiento + lista "RC · Formulario", que lo saca de la automatización de activación).
// - /panel: reemplaza el Excel del equipo comercial (estado, asignado y nota editables). Usuario: pulso, clave: secreto CLAVE_PANEL.
// - /panel/registros.csv: descarga completa.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const corta = (v, n) => String(v ?? '').trim().slice(0, n);
const enLista = (v, lista) => (lista.includes(v) ? v : '');

const CONSENTIMIENTO_TEXTO = 'Autorizo a Pulso Inversor y a las empresas de Grupo MatchMaking a tratar los datos que entrego en este formulario para contactarme por teléfono, WhatsApp o correo y evaluar mi solicitud, según la Política de Privacidad.';
const WHATSAPP_PULSO = '56958792038';

const RUTAS = ['inversion', 'financiamiento'];
const RUTA_NOMBRE = { inversion: 'Inversión', financiamiento: 'Financiamiento' };
const MONTOS = ['Menos de $5 MM', '$5 a $25 MM', '$25 a $100 MM', 'Más de $100 MM'];
const HORARIOS = ['Mañana', 'Tarde', 'Después de las 19:00'];
const PROPIEDAD = ['Sí, casa o departamento', 'Sí, terreno, galpón o local', 'No'];
const VALORES = ['Menos de 2.000 UF', '2.000 a 5.000 UF', '5.000 a 15.000 UF', 'Más de 15.000 UF'];
const NECESITA = ['Menos de $20 MM', '$20 a $50 MM', '$50 a $150 MM', 'Más de $150 MM'];
const PARA_QUE = ['Capital de trabajo', 'Ordenar o pagar deudas', 'Detener un remate o embargo', 'Financiar un proyecto', 'Otro'];
const URGENCIA = ['Este mes', '1 a 3 meses', 'Solo estoy evaluando'];
const ESTADOS = ['Nuevo', 'Contactado', 'Reunión agendada', 'Oportunidad', 'Cerrado', 'Descartado'];

// ---------- Correo (Brevo transaccional) ----------
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
        tags: ['landing-red-capital', etiqueta].filter(Boolean),
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
<tr><td style="padding:18px 28px;background:#f4f6f2;color:#6b7a71;font-size:12px;line-height:1.5">Pulso Inversor, una empresa de Grupo MatchMaking · Avenida Los Militares 5890, of. 304, Las Condes · WhatsApp +56 9 5879 2038.<br>Operaciones bajo contratos civiles, no reguladas por la CMF. Toda inversión tiene riesgos. Revisa los documentos con tu abogado antes de firmar.<br>Puedes modificar o eliminar tus datos escribiendo a contacto@pulsoinversor.cl.</td></tr>
</table></td></tr></table></body></html>`;
}
const p = (t) => `<p style="font-size:15px;line-height:1.6;margin:0 0 14px">${t}</p>`;
const boton = (href, texto, fondo = '#C7D95D', color = '#0E2C28') => `<p style="margin:22px 0"><a href="${href}" style="background:${fondo};color:${color};text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:999px;display:inline-block">${texto}</a></p>`;

function correoInteresado(d) {
  const primer = esc(d.nombre.split(' ')[0]);
  const wa = (msg) => `https://wa.me/${WHATSAPP_PULSO}?text=${encodeURIComponent(msg)}`;
  if (d.ruta === 'financiamiento') {
    return {
      asunto: 'Recibimos tu solicitud · Pulso Inversor',
      html: plantilla(`Gracias, ${primer}. Ya tenemos tu solicitud.`,
        p('Un asesor de Pulso te escribirá por WhatsApp para conocer tu caso y tu propiedad.') +
        p('Con esa información te diremos si un <b>leaseback</b> tiene sentido para ti: vendes tu propiedad con pacto de recompra, sigues usándola mientras corre el plazo y la recompras al final, al precio acordado desde el primer día.') +
        p('La evaluación no tiene costo ni te obliga a nada. Cada caso se revisa por separado y no todas las solicitudes califican.') +
        boton(wa(`Hola, soy ${d.nombre}. Dejé una solicitud de liquidez con mi propiedad en Pulso Inversor.`), 'Adelantar por WhatsApp')),
    };
  }
  if (d.monto === 'Menos de $5 MM') {
    return {
      asunto: 'Recibimos tus datos · Pulso Inversor',
      html: plantilla(`Gracias, ${primer}`,
        p('Recibimos tus datos. Hoy nuestras operaciones parten en $5 millones, así que no queremos hacerte perder tiempo con una reunión.') +
        p('Te iremos enviando contenido para que aprendas a evaluar cualquier inversión con respaldo inmobiliario, y te avisaremos cuando tenga sentido conversar.') +
        p('Si tienes una duda, responde este correo o escríbenos por WhatsApp al +56 9 5879 2038.')),
    };
  }
  return {
    asunto: 'Recibimos tus datos · Pulso Inversor',
    html: plantilla(`Gracias, ${primer}. Ya tenemos tus datos.`,
      p('Un asesor de Pulso te escribirá por WhatsApp con su nombre para coordinar una conversación' + (d.horario ? `, en el horario que elegiste (${esc(d.horario.toLowerCase())})` : '') + '.') +
      p('En esa conversación te mostramos una operación real con sus documentos: <b>qué propiedad respalda tu dinero, qué documento queda a tu favor y cómo lo recuperas.</b>') +
      p('Puedes venir con tu pareja, tu socio o tu abogado. No te vamos a pedir que decidas nada en esa conversación.') +
      boton(wa(`Hola, soy ${d.nombre}. Dejé mis datos en Pulso Inversor y quiero conocer cómo invertir con respaldo inmobiliario.`), 'Escríbenos por WhatsApp') +
      p('Mientras tanto, puedes revisar <a href="https://4.pulsoinversor.cl/?utm_source=brevo&utm_medium=email&utm_campaign=red-capital&utm_content=confirmacion" style="color:#1d5248">las operaciones de este mes</a>.')),
  };
}

function resumen(d) {
  if (d.ruta === 'financiamiento') return [d.propiedad, d.comuna, d.valor, d.necesita && `necesita ${d.necesita}`, d.para_que, d.urgencia].filter(Boolean).join(' · ');
  return [d.monto, d.experiencia && (d.experiencia === 'Sí' ? 'ya ha invertido' : 'primera inversión'), d.horario].filter(Boolean).join(' · ');
}

function correoEquipo(d, id) {
  const fila = (k, v) => `<tr><td style="padding:6px 10px;color:#6b7a71;font-size:13px;white-space:nowrap">${k}</td><td style="padding:6px 10px;font-size:14px"><b>${esc(v || '—')}</b></td></tr>`;
  const tel = d.telefono.replace(/[^0-9]/g, '');
  const alta = d.prioridad.startsWith('Alta');
  const filas = d.ruta === 'financiamiento'
    ? fila('Propiedad', d.propiedad) + fila('Comuna', d.comuna) + fila('Valor aprox.', d.valor) + fila('Necesita', d.necesita) + fila('Para qué', d.para_que) + fila('Urgencia', d.urgencia)
    : fila('Monto', d.monto) + fila('Ya invirtió', d.experiencia) + fila('Horario', d.horario);
  return {
    asunto: `${alta ? '⭐ Prioridad · ' : ''}Red Capital · ${RUTA_NOMBRE[d.ruta]}: ${d.nombre}${d.ruta === 'inversion' ? ` (${d.monto})` : ` (${d.necesita})`}`,
    html: plantilla(`Nuevo registro #${id} · ${RUTA_NOMBRE[d.ruta]}`, `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:16px">
${fila('Nombre', d.nombre)}${fila('WhatsApp', d.telefono)}${fila('Correo', d.email)}${fila('Edad', d.edad)}${filas}
${fila('Prioridad', d.prioridad)}${fila('Asesor sugerido', d.asesor_sugerido)}${d.derivar ? fila('Derivar', d.derivar) : ''}${fila('Publicidad', d.acepta_publicidad)}${fila('Origen', [d.utm_source, d.utm_medium, d.utm_campaign, d.utm_content].filter(Boolean).join(' · '))}
</table>
${alta ? `<p style="font-size:14px;margin:0 0 14px;color:#7a5600"><b>${esc(d.prioridad)}.</b></p>` : ''}
${boton(`https://wa.me/${tel}`, 'Abrir WhatsApp', '#25d366', '#0b2e17')}
<p style="font-size:13px;color:#6b7a71;margin:0">Actualiza el estado en el panel: https://5.pulsoinversor.cl/panel</p>`),
  };
}

// ---------- Brevo: contacto con consentimiento ----------
async function sincronizarBrevo(env, d) {
  if (!env.BREVO_API_KEY) return 'sin clave Brevo';
  const lista = parseInt(env.BREVO_LISTA_FORMULARIO, 10);
  const base = {
    NOMBRE: d.nombre,
    WHATSAPP: d.telefono.replace(/\D/g, ''),
    CONSENT_TEXTO: CONSENTIMIENTO_TEXTO,
    CONSENT_FECHA: d.consentimiento_fecha.slice(0, 10),
    OPT_IN: d.acepta_publicidad === 'Sí',
  };
  const enviar = async (attributes) => {
    const cuerpo = { email: d.email, attributes, updateEnabled: true };
    if (lista > 0) cuerpo.listIds = [lista];
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    return { ok: r.ok, status: r.status, texto: r.ok ? '' : (await r.text()).slice(0, 200) };
  };
  try {
    let r = await enviar({ ...base, RC_RUTA: RUTA_NOMBRE[d.ruta], RC_ETAPA: 'Formulario' });
    if (!r.ok && /attribute/i.test(r.texto)) {
      const r2 = await enviar(base);
      return r2.ok ? `ok sin RC_RUTA/RC_ETAPA (crear atributos en Brevo)${lista > 0 ? '' : ' · sin lista'}` : `error ${r2.status}: ${r2.texto}`;
    }
    return r.ok ? `ok${lista > 0 ? ` · lista ${lista}` : ' · sin lista (completar BREVO_LISTA_FORMULARIO)'}` : `error ${r.status}: ${r.texto}`;
  } catch (e) {
    return 'error: ' + e.message;
  }
}

// ---------- Registro ----------
function clasificar(d) {
  if (d.ruta === 'inversion') {
    d.asesor_sugerido = d.edad <= 40 ? 'Renato Vargas' : 'Pamela Herrera';
    if (d.monto === 'Menos de $5 MM') d.prioridad = 'Nutrición (bajo el mínimo)';
    else if (d.monto === '$25 a $100 MM' || d.monto === 'Más de $100 MM') d.prioridad = 'Alta · contactar en menos de 1 hora hábil';
    else d.prioridad = 'Normal · mismo día hábil';
    d.derivar = '';
  } else {
    d.asesor_sugerido = 'Por asignar (confirmar responsable)';
    const tienePropiedad = d.propiedad && d.propiedad !== 'No';
    d.prioridad = d.urgencia === 'Este mes' && tienePropiedad ? 'Alta · contactar en menos de 1 hora hábil' : 'Normal · mismo día hábil';
    d.derivar = d.para_que === 'Detener un remate o embargo' ? 'Derivar a Plan de Salida' : '';
  }
}

async function guardarRegistro(request, env, ctx) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'Datos inválidos' }, 400); }
  if (b.sitio) return json({ ok: true }); // trampa para robots
  const ruta = RUTAS.includes(b.ruta) ? b.ruta : '';
  const d = {
    ruta,
    nombre: corta(b.nombre, 120),
    telefono: corta(b.telefono, 30),
    email: corta(b.correo, 160).toLowerCase(),
    edad: parseInt(b.edad, 10),
    monto: '', experiencia: '', horario: '',
    propiedad: '', comuna: '', valor: '', necesita: '', para_que: '', urgencia: '',
    consentimiento: b.consentimiento === 'Sí' ? 'Sí' : '',
    consentimiento_texto: CONSENTIMIENTO_TEXTO,
    consentimiento_fecha: new Date().toISOString(),
    acepta_publicidad: b.acepta_publicidad === 'Sí' ? 'Sí' : 'No',
    utm_source: corta(b.utm_source, 120), utm_medium: corta(b.utm_medium, 120), utm_campaign: corta(b.utm_campaign, 160), utm_content: corta(b.utm_content, 160), utm_term: corta(b.utm_term, 160),
    pagina: corta(b.pagina, 400),
  };
  const faltan = [];
  if (!ruta) faltan.push('ruta');
  if (d.nombre.length < 3) faltan.push('nombre');
  if (d.telefono.replace(/\D/g, '').length < 9) faltan.push('telefono');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) faltan.push('correo');
  if (!(d.edad >= 18 && d.edad <= 99)) faltan.push('edad');
  if (!d.consentimiento) faltan.push('consentimiento');
  if (ruta === 'inversion') {
    d.monto = enLista(b.monto, MONTOS);
    d.experiencia = enLista(b.experiencia, ['Sí', 'No']);
    d.horario = enLista(b.horario, HORARIOS);
    if (!d.monto) faltan.push('monto');
    if (!d.experiencia) faltan.push('experiencia');
  } else if (ruta === 'financiamiento') {
    d.propiedad = enLista(b.propiedad, PROPIEDAD);
    d.comuna = corta(b.comuna, 80);
    d.valor = enLista(b.valor, VALORES);
    d.necesita = enLista(b.necesita, NECESITA);
    d.para_que = enLista(b.para_que, PARA_QUE);
    d.urgencia = enLista(b.urgencia, URGENCIA);
    if (!d.propiedad) faltan.push('propiedad');
    if (!d.necesita) faltan.push('necesita');
    if (!d.para_que) faltan.push('para_que');
    if (!d.urgencia) faltan.push('urgencia');
  }
  if (faltan.length) return json({ ok: false, error: 'Faltan datos', campos: faltan }, 400);
  clasificar(d);

  const r = await env.DB.prepare(`INSERT INTO registros (ruta, nombre, telefono, email, edad, monto, experiencia, horario, propiedad, comuna, valor, necesita, para_que, urgencia,
      asesor_sugerido, prioridad, derivar, consentimiento, consentimiento_texto, consentimiento_fecha, acepta_publicidad,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, pagina, ip_pais)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    d.ruta, d.nombre, d.telefono, d.email, d.edad, d.monto, d.experiencia, d.horario, d.propiedad, d.comuna, d.valor, d.necesita, d.para_que, d.urgencia,
    d.asesor_sugerido, d.prioridad, d.derivar, d.consentimiento, d.consentimiento_texto, d.consentimiento_fecha, d.acepta_publicidad,
    d.utm_source, d.utm_medium, d.utm_campaign, d.utm_content, d.utm_term, d.pagina, request.cf?.country || '').run();
  const id = r.meta.last_row_id;

  ctx.waitUntil((async () => {
    const lista = d.ruta === 'financiamiento' ? env.AVISO_EQUIPO_FINANCIAMIENTO : env.AVISO_EQUIPO_INVERSION;
    const equipo = String(lista || '').split(',').map((s) => s.trim()).filter(Boolean);
    const ce = correoEquipo(d, id);
    const ci = correoInteresado(d);
    const [a, c, s] = await Promise.all([
      equipo.length ? enviarCorreo(env, { para: equipo, asunto: ce.asunto, html: ce.html, etiqueta: 'aviso-equipo' }) : 'sin equipo',
      enviarCorreo(env, { para: d.email, nombre: d.nombre, asunto: ci.asunto, html: ci.html, etiqueta: `confirmacion-${d.ruta}` }),
      sincronizarBrevo(env, d),
    ]);
    await env.DB.prepare('UPDATE registros SET aviso_equipo = ?, correo_confirmacion = ?, brevo_sync = ? WHERE id = ?').bind(a, c, s, id).run();
  })());
  return json({ ok: true });
}

// ---------- Panel comercial ----------
function autorizado(request, env) {
  const h = request.headers.get('authorization') || '';
  if (!env.CLAVE_PANEL || !h.startsWith('Basic ')) return false;
  let txt = '';
  try { txt = atob(h.slice(6)); } catch { return false; }
  const i = txt.indexOf(':');
  return txt.slice(0, i) === 'pulso' && txt.slice(i + 1) === env.CLAVE_PANEL;
}
const pedirClave = () => new Response('Acceso restringido', { status: 401, headers: { 'www-authenticate': 'Basic realm="Panel Pulso Red Capital", charset="UTF-8"', 'cache-control': 'no-store' } });

const COLS = ['id', 'creado', 'ruta', 'nombre', 'telefono', 'email', 'edad', 'monto', 'experiencia', 'horario', 'propiedad', 'comuna', 'valor', 'necesita', 'para_que', 'urgencia',
  'asesor_sugerido', 'prioridad', 'derivar', 'estado', 'asignado', 'nota', 'actualizado', 'consentimiento', 'consentimiento_fecha', 'acepta_publicidad',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'aviso_equipo', 'correo_confirmacion', 'brevo_sync'];

async function csv(env) {
  const { results } = await env.DB.prepare(`SELECT ${COLS.join(',')} FROM registros ORDER BY id DESC`).all();
  const cel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const cuerpo = '﻿' + [COLS.join(';'), ...results.map((r) => COLS.map((c) => cel(r[c])).join(';'))].join('\r\n');
  return new Response(cuerpo, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="registros-red-capital.csv"', 'cache-control': 'no-store' } });
}

async function actualizar(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'Datos inválidos' }, 400); }
  const id = parseInt(b.id, 10);
  const estado = enLista(b.estado, ESTADOS);
  if (!(id > 0) || !estado) return json({ ok: false, error: 'Datos inválidos' }, 400);
  const actualizado = new Date().toISOString();
  const r = await env.DB.prepare('UPDATE registros SET estado = ?, asignado = ?, nota = ?, actualizado = ? WHERE id = ?')
    .bind(estado, corta(b.asignado, 80), corta(b.nota, 1000), actualizado, id).run();
  if (!r.meta.changes) return json({ ok: false, error: 'No existe' }, 404);
  return json({ ok: true, actualizado });
}

async function panel(request, env) {
  const url = new URL(request.url);
  const fRuta = RUTAS.includes(url.searchParams.get('ruta')) ? url.searchParams.get('ruta') : '';
  const fEstado = ESTADOS.includes(url.searchParams.get('estado')) ? url.searchParams.get('estado') : '';
  const { results: todos } = await env.DB.prepare(`SELECT ${COLS.join(',')} FROM registros ORDER BY id DESC`).all();
  const cuenta = (fn) => todos.filter(fn).length;
  const ahora = Date.now();
  const vencido = (r) => r.estado === 'Nuevo' && ahora - Date.parse(r.creado) > 24 * 3600 * 1000;
  const lista = todos.filter((r) => (!fRuta || r.ruta === fRuta) && (!fEstado || r.estado === fEstado));
  const fecha = (v) => (v ? new Date(v).toLocaleString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
  const enlace = (q) => { const u = new URLSearchParams({ ...(fRuta && { ruta: fRuta }), ...(fEstado && { estado: fEstado }), ...q }); for (const [k, v] of [...u]) if (!v) u.delete(k); const s = u.toString(); return '/panel' + (s ? '?' + s : ''); };
  const chip = (txt, n, q, activo) => `<a class="chip${activo ? ' on' : ''}" href="${esc(enlace(q))}">${esc(txt)} <b>${n}</b></a>`;

  const filas = lista.map((r) => {
    const res = resumen(r);
    const tel = String(r.telefono || '').replace(/\D/g, '');
    return `<tr data-id="${r.id}" class="${vencido(r) ? 'vencido' : ''}">
<td>${r.id}<br><small>${esc(fecha(r.creado))}</small></td>
<td><span class="ruta ${esc(r.ruta)}">${esc(RUTA_NOMBRE[r.ruta] || r.ruta)}</span></td>
<td><b>${esc(r.nombre)}</b><br><a href="https://wa.me/${tel}" target="_blank" rel="noopener">${esc(r.telefono)}</a><br><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
<td>${esc(r.edad)}</td>
<td class="res">${esc(res)}${r.derivar ? `<br><b class="deriv">${esc(r.derivar)}</b>` : ''}${r.acepta_publicidad === 'Sí' ? '<br><small>Acepta publicidad</small>' : ''}</td>
<td class="${String(r.prioridad).startsWith('Alta') ? 'alta' : ''}">${esc(r.prioridad)}</td>
<td>${esc(r.asesor_sugerido)}</td>
<td><select name="estado" aria-label="Estado">${ESTADOS.map((e) => `<option${e === r.estado ? ' selected' : ''}>${e}</option>`).join('')}</select></td>
<td><input name="asignado" value="${esc(r.asignado)}" placeholder="Quién lo toma" aria-label="Asignado" maxlength="80"></td>
<td><textarea name="nota" rows="2" placeholder="Nota" aria-label="Nota" maxlength="1000">${esc(r.nota)}</textarea></td>
<td><button type="button" class="guardar">Guardar</button><small class="msg">${r.actualizado ? 'Act. ' + esc(fecha(r.actualizado)) : ''}</small></td>
</tr>`;
  }).join('');

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Panel comercial · Red Capital</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#f4f6f2;color:#0E2C28}
header{background:#0E2C28;color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
header b{color:#C7D95D;font-size:18px}
a.btn{background:#C7D95D;color:#0E2C28;padding:10px 16px;border-radius:999px;font-weight:700;text-decoration:none}
.res-top{display:flex;gap:10px;flex-wrap:wrap;padding:16px 22px 0}
.kpi{background:#fff;border-radius:12px;padding:12px 16px;min-width:120px;border:1px solid #dfe5dc}.kpi b{display:block;font-size:24px}.kpi span{font-size:12px;color:#5b6b62;text-transform:uppercase}
.kpi.rojo{border-color:#b3261e}.kpi.rojo b{color:#b3261e}
.filtros{padding:14px 22px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.filtros span{font-size:12px;text-transform:uppercase;color:#5b6b62;margin-right:4px}
.chip{background:#fff;border:1px solid #cdd6cf;border-radius:999px;padding:6px 12px;color:#0E2C28;text-decoration:none;font-size:14px}.chip.on{background:#0E2C28;color:#fff;border-color:#0E2C28}
main{padding:0 22px 30px;overflow-x:auto}
table{border-collapse:collapse;background:#fff;width:100%;font-size:14px;min-width:1250px}
th,td{padding:9px 10px;border-bottom:1px solid #e3e8e2;text-align:left;vertical-align:top}
th{background:#123D35;color:#fff;font-size:12px;text-transform:uppercase;position:sticky;top:0}
td small{color:#5b6b62}
td a{color:#1d5248}
tr.vencido{background:#fdecea}tr.vencido td:first-child{border-left:4px solid #b3261e}
.ruta{font-size:12px;font-weight:700;padding:3px 8px;border-radius:999px;white-space:nowrap}.ruta.inversion{background:#eef4d6}.ruta.financiamiento{background:#e0ece9}
.alta{color:#7a5600;font-weight:700}.deriv{color:#b3261e}.res{max-width:260px}
select,input,textarea{font:inherit;font-size:13px;padding:6px;border:1px solid #c9d3cb;border-radius:8px;width:100%;min-width:120px}
textarea{min-width:180px}
button.guardar{background:#0E2C28;color:#fff;border:0;border-radius:999px;padding:8px 14px;font-weight:700;cursor:pointer}
.msg{display:block;margin-top:4px}
.ayuda{padding:0 22px 6px;font-size:13px;color:#5b6b62}
</style></head>
<body><header><div><b>Panel comercial · Campaña Red Capital</b><br><small>${todos.length} registros · ${cuenta((r) => r.ruta === 'inversion')} inversión · ${cuenta((r) => r.ruta === 'financiamiento')} financiamiento</small></div><a class="btn" href="/panel/registros.csv">Descargar CSV</a></header>
<div class="res-top">
${ESTADOS.map((e) => `<div class="kpi"><b>${cuenta((r) => r.estado === e)}</b><span>${e}</span></div>`).join('')}
<div class="kpi rojo"><b>${cuenta(vencido)}</b><span>Nuevos con más de 24 h</span></div>
</div>
<div class="filtros"><span>Ruta</span>${chip('Todas', todos.length, { ruta: '' }, !fRuta)}${RUTAS.map((r) => chip(RUTA_NOMBRE[r], cuenta((x) => x.ruta === r), { ruta: r }, fRuta === r)).join('')}
<span style="margin-left:12px">Estado</span>${chip('Todos', todos.filter((r) => !fRuta || r.ruta === fRuta).length, { estado: '' }, !fEstado)}${ESTADOS.map((e) => chip(e, todos.filter((r) => (!fRuta || r.ruta === fRuta) && r.estado === e).length, { estado: e }, fEstado === e)).join('')}</div>
<p class="ayuda">Cambia el estado, quién lo toma o la nota y presiona Guardar. En rojo: registros que siguen en "Nuevo" después de 24 horas.</p>
<main><table><thead><tr><th>#</th><th>Ruta</th><th>Contacto</th><th>Edad</th><th>Resumen</th><th>Prioridad</th><th>Asesor sugerido</th><th>Estado</th><th>Asignado</th><th>Nota</th><th></th></tr></thead>
<tbody>${filas || '<tr><td colspan="11">No hay registros con este filtro.</td></tr>'}</tbody></table></main>
<script>
document.querySelectorAll('button.guardar').forEach(function(b){b.addEventListener('click',function(){
  var tr=b.closest('tr'),msg=tr.querySelector('.msg');
  var d={id:tr.getAttribute('data-id'),estado:tr.querySelector('[name=estado]').value,asignado:tr.querySelector('[name=asignado]').value,nota:tr.querySelector('[name=nota]').value};
  b.disabled=true;msg.textContent='Guardando…';
  fetch('/panel/actualizar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d),credentials:'same-origin'})
   .then(function(r){return r.json()}).then(function(j){
     if(!j.ok)throw 0;msg.textContent='Guardado';if(d.estado!=='Nuevo')tr.classList.remove('vencido');
   }).catch(function(){msg.textContent='No se pudo guardar'}).finally(function(){b.disabled=false});
});});
</script></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ruta = url.pathname.replace(/\/+$/, '') || '/';
    if (ruta === '/api/registro') {
      if (request.method !== 'POST') return json({ ok: false }, 405);
      return guardarRegistro(request, env, ctx);
    }
    if (ruta === '/panel' || ruta.startsWith('/panel/')) {
      if (!autorizado(request, env)) return pedirClave();
      if (ruta === '/panel') return panel(request, env);
      if (ruta === '/panel/registros.csv') return csv(env);
      if (ruta === '/panel/actualizar' && request.method === 'POST') return actualizar(request, env);
      return new Response('No encontrado', { status: 404, headers: { 'cache-control': 'no-store' } });
    }
    return env.ASSETS.fetch(request);
  },
};
