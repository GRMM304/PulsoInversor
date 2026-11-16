// Invitación al Desayuno de Inversionistas Modelo IGR · Pulso Inversor
// Cloudflare Worker + D1 (base de asistentes) + Cron (recordatorios) + Brevo (envío de correos).
import { EVENTO, ENVIOS, archivoIcs } from './evento.js';
import { correoConfirmacion, correoRecordatorio, correoEquipo, esc } from './emails.js';

const MAX_ENVIOS_POR_CORRIDA = 40; // el plan gratuito permite 50 llamadas externas por ejecución

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const ahoraIso = (env) => (env.AHORA_PRUEBA ? new Date(env.AHORA_PRUEBA) : new Date()).toISOString();

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

function urlsAsistente(env, token) {
  const base = env.URL_BASE || EVENTO.sitio;
  return {
    cancelar: `${base}/cancelar?t=${encodeURIComponent(token)}`,
    ics: `${base}/calendario.ics`,
    panel: `${base}/panel`,
  };
}

function base64Utf8(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

async function enviarCorreo(env, { para, nombre, asunto, html, etiqueta, adjuntarIcs }) {
  if (!env.BREVO_API_KEY) return { ok: false, error: 'Falta BREVO_API_KEY' };
  const destinatarios = Array.isArray(para) ? para.map((email) => ({ email })) : [{ email: para, name: nombre || undefined }];
  const body = {
    sender: { name: env.REMITENTE_NOMBRE || 'Pulso Inversor', email: env.REMITENTE_EMAIL },
    to: destinatarios,
    replyTo: { email: env.RESPONDER_A || env.REMITENTE_EMAIL, name: 'Pulso Inversor' },
    subject: asunto,
    htmlContent: html,
    tags: ['desayuno-igr-2026', etiqueta].filter(Boolean),
  };
  if (adjuntarIcs) body.attachment = [{ name: 'desayuno-inversionistas-igr.ics', content: base64Utf8(archivoIcs()) }];
  try {
    const r = await fetch(env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) return { ok: true };
    return { ok: false, error: `Brevo ${r.status}: ${(await r.text()).slice(0, 300)}` };
  } catch (e) {
    return { ok: false, error: 'Brevo sin respuesta: ' + e.message };
  }
}

async function avisarEquipo(env, evento, a) {
  // AVISO_EQUIPO_EMAIL acepta varios correos separados por coma.
  const equipo = String(env.AVISO_EQUIPO_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!equipo.length) return;
  const c = correoEquipo(evento, a, urlsAsistente(env, a.token));
  await enviarCorreo(env, { para: equipo, asunto: c.asunto, html: c.html, etiqueta: 'aviso-equipo' });
}

async function cuposOcupados(env, excluirEmail) {
  const r = await env.DB.prepare(
    "SELECT COALESCE(SUM(1 + CASE WHEN acompanante IS NOT NULL AND acompanante <> '' THEN 1 ELSE 0 END), 0) AS n FROM asistentes WHERE estado = 'confirmado' AND email <> ?"
  ).bind(excluirEmail || '').first();
  return r?.n || 0;
}

// ---------------------------------------------------------------------------
// Confirmar asistencia
// ---------------------------------------------------------------------------

async function confirmar(request, env, ctx) {
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'Datos inválidos.' }, 400); }

  if (d.sitio_web) return json({ ok: true, nombre: '' }); // trampa para bots

  const ahora = ahoraIso(env);
  if (ahora >= EVENTO.fin) return json({ ok: false, error: 'El evento ya terminó. Escríbenos por WhatsApp si quieres conversar con un asesor.' }, 410);

  const limpiar = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  const a = {
    nombre: limpiar(d.nombre, 80),
    apellidos: limpiar(d.apellidos, 120),
    email: limpiar(d.email, 160).toLowerCase(),
    telefono: String(d.telefono ?? '').replace(/[^\d+]/g, '').slice(0, 20),
    acompanante: d.con_acompanante ? limpiar(d.acompanante, 120) : '',
    acepta_privacidad: d.acepta_privacidad ? 1 : 0,
    acepta_publicidad: d.acepta_publicidad ? 1 : 0,
  };

  if (!a.nombre) return json({ ok: false, error: 'Ingresa tu nombre.' }, 400);
  if (!a.apellidos) return json({ ok: false, error: 'Ingresa tus apellidos.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return json({ ok: false, error: 'Ingresa un email válido.' }, 400);
  if (a.telefono.replace(/\D/g, '').length < 8) return json({ ok: false, error: 'Ingresa un WhatsApp válido (mínimo 8 dígitos).' }, 400);
  if (d.con_acompanante && !a.acompanante) return json({ ok: false, error: 'Ingresa el nombre de tu acompañante.' }, 400);
  if (!a.acepta_privacidad) return json({ ok: false, error: 'Para confirmar, acepta la Política de privacidad.' }, 400);
  if (!a.telefono.startsWith('+')) a.telefono = '+56' + a.telefono.replace(/^0+/, '');

  const cupos = parseInt(env.CUPOS || '0', 10);
  if (cupos > 0) {
    const ocupados = await cuposOcupados(env, a.email);
    if (ocupados + 1 + (a.acompanante ? 1 : 0) > cupos) {
      return json({ ok: false, error: 'Los cupos están completos. Escríbenos por WhatsApp y te avisamos si se libera un lugar.' }, 409);
    }
  }

  const fila = await env.DB.prepare(`
    INSERT INTO asistentes (token, nombre, apellidos, email, telefono, acompanante, acepta_privacidad, acepta_publicidad, estado, creado, actualizado, origen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmado', ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      nombre = excluded.nombre, apellidos = excluded.apellidos, telefono = excluded.telefono,
      acompanante = excluded.acompanante, acepta_privacidad = excluded.acepta_privacidad,
      acepta_publicidad = excluded.acepta_publicidad, estado = 'confirmado',
      actualizado = excluded.actualizado, enviado_confirmacion = NULL, cancelado = NULL
    RETURNING *`
  ).bind(crypto.randomUUID(), a.nombre, a.apellidos, a.email, a.telefono, a.acompanante || null,
    a.acepta_privacidad, a.acepta_publicidad, ahora, ahora, limpiar(d.origen, 60) || null).first();

  ctx.waitUntil((async () => {
    const urls = urlsAsistente(env, fila.token);
    const c = correoConfirmacion(fila, urls);
    const r = await enviarCorreo(env, { para: fila.email, nombre: `${fila.nombre} ${fila.apellidos}`, asunto: c.asunto, html: c.html, etiqueta: 'confirmacion', adjuntarIcs: true });
    await env.DB.prepare('UPDATE asistentes SET enviado_confirmacion = ?, ultimo_error = ? WHERE id = ?')
      .bind(r.ok ? ahoraIso(env) : null, r.ok ? null : r.error, fila.id).run();
    await avisarEquipo(env, fila.creado === ahora ? 'confirmacion' : 'actualizacion', fila);
  })());

  return json({ ok: true, nombre: fila.nombre, email: fila.email });
}

// ---------------------------------------------------------------------------
// Cancelar (GET muestra confirmación; POST cancela, para que los antivirus de correo no cancelen al abrir el enlace)
// ---------------------------------------------------------------------------

function paginaSimple(titulo, cuerpo, status = 200) {
  return new Response(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titulo)} · Pulso Inversor</title><link rel="icon" href="/assets/favicon.svg">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F3F5F2;font-family:Inter,Helvetica,Arial,sans-serif;color:#1F2523;padding:20px}main{max-width:520px;width:100%;background:#fff;border-radius:22px;padding:34px 28px;box-shadow:0 20px 60px rgba(0,0,0,.08);border-top:5px solid #C7D95D}img{width:260px;max-width:100%;margin-bottom:22px}h1{color:#0E2C28;font-size:26px;line-height:1.15;margin:0 0 12px}p{color:#4E5A56;line-height:1.55}.b{display:inline-block;padding:13px 22px;border-radius:999px;font-weight:800;text-decoration:none;border:1px solid #C7D95D;background:#C7D95D;color:#0E2C28;font-size:15px;cursor:pointer;margin:6px 6px 0 0}.b2{background:#fff;border-color:#dfe5dc}</style></head>
<body><main><img src="/assets/logo-pulso-gmm.png" alt="Pulso Inversor"><h1>${titulo}</h1>${cuerpo}</main></body></html>`,
  { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

async function cancelar(request, env, ctx) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || '';
  const a = token && await env.DB.prepare('SELECT * FROM asistentes WHERE token = ?').bind(token).first();
  if (!a) return paginaSimple('Enlace no válido', '<p>No encontramos tu registro. Si necesitas ayuda, escríbenos por WhatsApp.</p>', 404);

  if (request.method === 'POST') {
    if (a.estado !== 'cancelado') {
      await env.DB.prepare("UPDATE asistentes SET estado = 'cancelado', cancelado = ?, actualizado = ? WHERE id = ?")
        .bind(ahoraIso(env), ahoraIso(env), a.id).run();
      ctx.waitUntil(avisarEquipo(env, 'cancelacion', a));
    }
    return paginaSimple('Liberamos tu cupo', `<p>${esc(a.nombre)}, gracias por avisarnos. No te enviaremos más recordatorios de este desayuno.</p><p>Si cambias de opinión, puedes volver a confirmar mientras queden cupos.</p><a class="b" href="/?confirmar=1">Volver a confirmar</a><a class="b b2" href="https://wa.me/${EVENTO.whatsapp}">Hablar por WhatsApp</a>`);
  }

  if (a.estado === 'cancelado') {
    return paginaSimple('Tu asistencia ya está cancelada', `<p>${esc(a.nombre)}, ya liberamos tu cupo. Si quieres volver a confirmar, hazlo aquí.</p><a class="b" href="/?confirmar=1">Volver a confirmar</a>`);
  }
  return paginaSimple('¿No podrás asistir?', `<p>${esc(a.nombre)}, si confirmas, liberamos tu cupo para otra persona y dejamos de enviarte recordatorios del ${esc(EVENTO.titulo)}.</p>
    <form method="post" action="/cancelar?t=${encodeURIComponent(token)}"><button class="b" type="submit">Sí, no podré asistir</button><a class="b b2" href="/">Mantener mi asistencia</a></form>`);
}

// ---------------------------------------------------------------------------
// Panel de asistencia (protegido con clave; cookie firmada)
// ---------------------------------------------------------------------------

async function firmar(env, valor) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.CLAVE_PANEL), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(valor));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/[+/=]/g, '');
}

async function sesionValida(request, env) {
  if (!env.CLAVE_PANEL) return false;
  const c = (request.headers.get('cookie') || '').match(/(?:^|;\s*)panel=([^;]+)/);
  if (!c) return false;
  const [exp, firma] = decodeURIComponent(c[1]).split('.');
  if (!exp || Date.now() > Number(exp)) return false;
  return firma === await firmar(env, exp);
}

function paginaLogin(error = '') {
  return paginaSimple('Panel de asistencia', `${error ? `<p style="color:#b3261e;font-weight:700">${esc(error)}</p>` : '<p>Ingresa la clave del equipo para ver la lista de asistentes.</p>'}
    <form method="post" action="/panel/entrar"><input type="password" name="clave" required autocomplete="current-password" placeholder="Clave" style="width:100%;min-height:48px;border:1px solid #dfe5dc;border-radius:14px;padding:12px 14px;font:inherit;margin:6px 0 10px"><button class="b" type="submit">Entrar</button></form>`, error ? 401 : 200);
}

async function entrarPanel(request, env) {
  const f = await request.formData();
  const clave = String(f.get('clave') || '');
  if (!env.CLAVE_PANEL || clave !== env.CLAVE_PANEL) {
    await new Promise((r) => setTimeout(r, 800));
    return paginaLogin('Clave incorrecta.');
  }
  const exp = String(Date.now() + 1000 * 60 * 60 * 24 * 14);
  const cookie = `panel=${encodeURIComponent(exp + '.' + await firmar(env, exp))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}`;
  return new Response(null, { status: 303, headers: { location: '/panel', 'set-cookie': cookie } });
}

const fmtFecha = (iso) => iso ? new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

async function panel(request, env) {
  const { results } = await env.DB.prepare('SELECT * FROM asistentes ORDER BY estado ASC, creado DESC').all();
  const conf = results.filter((a) => a.estado === 'confirmado');
  const personas = conf.reduce((n, a) => n + 1 + (a.acompanante ? 1 : 0), 0);
  const llegaron = conf.filter((a) => a.asistio).length;
  const cupos = parseInt(env.CUPOS || '0', 10);
  const marca = (v) => v === 'omitido' ? '<span title="No correspondía">—</span>' : v ? `<span title="${esc(fmtFecha(v))}">✓</span>` : '';

  const filas = results.map((a) => `
    <tr class="${a.estado}">
      <td><strong>${esc(a.nombre)} ${esc(a.apellidos)}</strong>${a.acompanante ? `<br><small>+ ${esc(a.acompanante)}</small>` : ''}${a.estado === 'cancelado' ? '<br><small class="tag">Canceló</small>' : ''}</td>
      <td><a href="mailto:${esc(a.email)}">${esc(a.email)}</a><br><a href="https://wa.me/${esc(a.telefono.replace(/\D/g, ''))}" target="_blank">${esc(a.telefono)}</a></td>
      <td>${esc(fmtFecha(a.creado))}</td>
      <td class="c">${a.acepta_publicidad ? 'Sí' : 'No'}</td>
      <td class="c">${marca(a.enviado_confirmacion)}</td><td class="c">${marca(a.enviado_r2d)}</td><td class="c">${marca(a.enviado_r12h)}</td><td class="c">${marca(a.enviado_rhoy)}</td><td class="c">${marca(a.enviado_post)}</td>
      <td class="c">${a.estado === 'confirmado' ? `<form method="post" action="/panel/llegada"><input type="hidden" name="id" value="${a.id}"><input type="hidden" name="valor" value="${a.asistio ? 0 : 1}"><button class="${a.asistio ? 'si' : 'no'}" type="submit">${a.asistio ? '✓ Llegó' : 'Marcar llegada'}</button></form>` : ''}</td>
      ${a.ultimo_error ? `<td class="err" title="${esc(a.ultimo_error)}">⚠</td>` : '<td></td>'}
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Asistencia · Desayuno IGR</title><link rel="icon" href="/assets/favicon.svg">
<style>
body{margin:0;background:#F3F5F2;font-family:Inter,Helvetica,Arial,sans-serif;color:#1F2523}header{background:#0E2C28;color:#fff;padding:18px 20px}header h1{margin:0;font-size:20px}header p{margin:4px 0 0;color:rgba(255,255,255,.7);font-size:14px}
.wrap{padding:18px 16px;max-width:1300px;margin:auto}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px}.kpi{background:#fff;border-radius:16px;padding:14px 16px;border:1px solid #E3E8E1}.kpi b{display:block;font-size:28px;color:#0E2C28}.kpi span{color:#4E5A56;font-size:13px}
.acc{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.acc a,.acc input{padding:10px 14px;border-radius:999px;border:1px solid #dfe5dc;background:#fff;color:#0E2C28;font-weight:700;text-decoration:none;font:inherit;font-size:14px}.acc input{flex:1;min-width:200px;font-weight:400}
.tabla{overflow-x:auto;background:#fff;border-radius:16px;border:1px solid #E3E8E1}table{border-collapse:collapse;width:100%;font-size:14px;min-width:980px}th{text-align:left;background:#F7F9F6;color:#4E5A56;font-size:12px;text-transform:uppercase;letter-spacing:.04em;padding:10px;position:sticky;top:0}td{padding:10px;border-top:1px solid #EEF1EC;vertical-align:top}td.c,th.c{text-align:center}a{color:#1E5746}small{color:#4E5A56}.tag{color:#b3261e;font-weight:700}tr.cancelado td{opacity:.55}
button{border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer;font:inherit;font-size:13px;border:1px solid #dfe5dc;background:#fff;color:#0E2C28;white-space:nowrap}button.si{background:#C7D95D;border-color:#C7D95D}.err{color:#b3261e;cursor:help}
</style></head><body>
<header><h1>Asistencia · ${esc(EVENTO.titulo)}</h1><p>${esc(EVENTO.fechaTexto)}, ${esc(EVENTO.horaTexto)} · ${esc(EVENTO.direccion)}</p></header>
<div class="wrap">
  <div class="kpis">
    <div class="kpi"><b>${conf.length}</b><span>Registros confirmados</span></div>
    <div class="kpi"><b>${personas}${cupos ? ` / ${cupos}` : ''}</b><span>Personas (con acompañantes)${cupos ? ' / cupos' : ''}</span></div>
    <div class="kpi"><b>${llegaron}</b><span>Llegaron (marcados hoy)</span></div>
    <div class="kpi"><b>${results.length - conf.length}</b><span>Cancelaron</span></div>
  </div>
  <div class="acc"><input type="search" id="q" placeholder="Buscar por nombre, email o teléfono"><a href="/panel/asistentes.csv">Descargar Excel (CSV)</a><a href="/panel">Actualizar</a></div>
  <div class="tabla"><table id="t"><thead><tr><th>Asistente</th><th>Contacto</th><th>Confirmó</th><th class="c">Publicidad</th><th class="c">Confirm.</th><th class="c">2 días</th><th class="c">12 h</th><th class="c">Mismo día</th><th class="c">Seguim.</th><th class="c">Llegada</th><th></th></tr></thead><tbody>${filas || '<tr><td colspan="11" style="padding:30px;text-align:center;color:#4E5A56">Aún no hay confirmaciones.</td></tr>'}</tbody></table></div>
  <p style="color:#4E5A56;font-size:13px">✓ = correo enviado (pasa el cursor para ver la hora) · — = no correspondía (confirmó después) · ⚠ = error de envío (pasa el cursor para ver el detalle). El seguimiento posterior sale el viernes 20 a las 16:00 solo si se marcó al menos una llegada.</p>
</div>
<script>document.getElementById('q').addEventListener('input',function(e){var q=e.target.value.toLowerCase();document.querySelectorAll('#t tbody tr').forEach(function(tr){tr.style.display=tr.textContent.toLowerCase().indexOf(q)>-1?'':'none'})});</script>
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

async function marcarLlegada(request, env) {
  const f = await request.formData();
  const id = parseInt(f.get('id'), 10);
  const valor = f.get('valor') === '1';
  await env.DB.prepare('UPDATE asistentes SET asistio = ?, llegada = ?, actualizado = ? WHERE id = ?')
    .bind(valor ? 1 : 0, valor ? ahoraIso(env) : null, ahoraIso(env), id).run();
  return new Response(null, { status: 303, headers: { location: '/panel' } });
}

async function exportarCsv(env) {
  const { results } = await env.DB.prepare('SELECT * FROM asistentes ORDER BY creado ASC').all();
  const cols = [
    ['Nombre', 'nombre'], ['Apellidos', 'apellidos'], ['Email', 'email'],
    ['WhatsApp', (a) => String(a.telefono || '').replace(/^\+56(9)(\d{4})(\d{4})$/, '+56 $1 $2 $3')], ['Acompañante', 'acompanante'],
    ['Estado', 'estado'], ['Llegó', (a) => (a.asistio ? 'Sí' : 'No')], ['Hora de llegada', (a) => fmtFecha(a.llegada)],
    ['Acepta publicidad', (a) => (a.acepta_publicidad ? 'Sí' : 'No')], ['Confirmó', (a) => fmtFecha(a.creado)],
    ['Canceló', (a) => fmtFecha(a.cancelado)], ['Correo confirmación', (a) => fmtFecha(a.enviado_confirmacion)],
    ['Recordatorio 2 días', 'enviado_r2d'], ['Recordatorio 12 h', 'enviado_r12h'], ['Recordatorio mismo día', 'enviado_rhoy'],
    ['Seguimiento', 'enviado_post'], ['Origen', 'origen'],
  ];
  const celda = (v) => {
    let s = String(v ?? '');
    if (/^\d{4}-\d\d-\d\dT/.test(s)) s = fmtFecha(s);
    if (/^[=@]|^[+\-](?![\d\s])/.test(s)) s = "'" + s; // evita fórmulas al abrir en Excel
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const lineas = [cols.map(([t]) => celda(t)).join(';')]
    .concat(results.map((a) => cols.map(([, k]) => celda(typeof k === 'function' ? k(a) : a[k])).join(';')));
  return new Response('﻿' + lineas.join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="asistentes-desayuno-igr-2026-11-20.csv"',
      'cache-control': 'no-store',
    },
  });
}

// ---------------------------------------------------------------------------
// Envíos programados (Cron cada 5 minutos)
// ---------------------------------------------------------------------------

export async function procesarEnvios(env) {
  const ahora = ahoraIso(env);
  let enviados = 0;
  const log = [];

  // 1) Confirmaciones pendientes (por ejemplo, si Brevo falló o aún no estaba la clave).
  if (ahora < EVENTO.fin) {
    const { results } = await env.DB.prepare(
      "SELECT * FROM asistentes WHERE estado = 'confirmado' AND enviado_confirmacion IS NULL ORDER BY id LIMIT ?"
    ).bind(MAX_ENVIOS_POR_CORRIDA).all();
    for (const a of results) {
      if (enviados >= MAX_ENVIOS_POR_CORRIDA) break;
      const c = correoConfirmacion(a, urlsAsistente(env, a.token));
      const r = await enviarCorreo(env, { para: a.email, nombre: `${a.nombre} ${a.apellidos}`, asunto: c.asunto, html: c.html, etiqueta: 'confirmacion', adjuntarIcs: true });
      enviados++;
      await env.DB.prepare('UPDATE asistentes SET enviado_confirmacion = ?, ultimo_error = ? WHERE id = ?').bind(r.ok ? ahora : null, r.ok ? null : r.error, a.id).run();
      log.push(`confirmacion ${a.email} ${r.ok ? 'ok' : r.error}`);
    }
  }

  // 2) Recordatorios y seguimiento.
  for (const e of ENVIOS) {
    if (ahora < e.desde) continue;

    // Ventana vencida: se marca como omitido para no enviarlo tarde.
    if (ahora > e.hasta) {
      await env.DB.prepare(`UPDATE asistentes SET ${e.columna} = 'omitido' WHERE ${e.columna} IS NULL`).run();
      continue;
    }

    let filtro = '';
    if (e.post) {
      const marcados = await env.DB.prepare('SELECT COUNT(*) AS n FROM asistentes WHERE asistio = 1').first();
      if (!marcados?.n) { log.push(`${e.tipo}: espera (nadie marcado como llegado)`); continue; }
      filtro = e.post === 'asistio' ? 'AND asistio = 1' : 'AND (asistio IS NULL OR asistio = 0)';
    }

    // Quien confirmó después de la hora del envío no lo necesita.
    await env.DB.prepare(`UPDATE asistentes SET ${e.columna} = 'omitido' WHERE ${e.columna} IS NULL AND creado >= ?`).bind(e.desde).run();

    const { results } = await env.DB.prepare(
      `SELECT * FROM asistentes WHERE estado = 'confirmado' AND ${e.columna} IS NULL AND creado < ? ${filtro} ORDER BY id LIMIT ?`
    ).bind(e.desde, Math.max(0, MAX_ENVIOS_POR_CORRIDA - enviados)).all();

    for (const a of results) {
      if (enviados >= MAX_ENVIOS_POR_CORRIDA) break;
      const c = correoRecordatorio(e.tipo, a, urlsAsistente(env, a.token));
      const r = await enviarCorreo(env, { para: a.email, nombre: `${a.nombre} ${a.apellidos}`, asunto: c.asunto, html: c.html, etiqueta: e.tipo });
      enviados++;
      await env.DB.prepare(`UPDATE asistentes SET ${e.columna} = ?, ultimo_error = ? WHERE id = ?`).bind(r.ok ? ahora : null, r.ok ? null : r.error, a.id).run();
      log.push(`${e.tipo} ${a.email} ${r.ok ? 'ok' : r.error}`);
    }
  }
  return { ahora, enviados, log };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    const m = request.method;

    if (p === '/api/confirmar' && m === 'POST') return confirmar(request, env, ctx);
    if (p === '/cancelar') return cancelar(request, env, ctx);
    if (p === '/calendario.ics') {
      return new Response(archivoIcs(), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': 'attachment; filename="desayuno-inversionistas-igr.ics"' } });
    }

    if (p === '/panel/entrar' && m === 'POST') return entrarPanel(request, env);
    if (p === '/panel/salir') return new Response(null, { status: 303, headers: { location: '/panel', 'set-cookie': 'panel=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' } });
    if (p.startsWith('/panel')) {
      if (!(await sesionValida(request, env))) return paginaLogin();
      if (p === '/panel/llegada' && m === 'POST') return marcarLlegada(request, env);
      if (p === '/panel/asistentes.csv') return exportarCsv(env);
      if (p === '/panel/procesar' && m === 'POST') return json(await procesarEnvios(env));
      return panel(request, env);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(procesarEnvios(env).then((r) => { if (r.log.length) console.log(JSON.stringify(r)); }));
  },
};
