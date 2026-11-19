// Pulso Inversor · Panel de simulaciones y seguimiento (/panel)
// Mismo estilo y acceso que el panel del Desayuno: clave del equipo (secreto CLAVE_PANEL) y sesión por cookie de 14 días.

import { ASESORES, esc, clp } from './comun.js';
import { reunionesPorEmail } from './reuniones.js';

const enc = new TextEncoder();
async function firmarSesion(env, valor) {
  const k = await crypto.subtle.importKey('raw', enc.encode(env.CLAVE_PANEL), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(valor));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/[+/=]/g, '');
}
async function sesionValida(request, env) {
  if (!env.CLAVE_PANEL) return false;
  const c = (request.headers.get('cookie') || '').match(/(?:^|;\s*)panel_sim=([^;]+)/);
  if (!c) return false;
  const [exp, firma] = decodeURIComponent(c[1]).split('.');
  if (!exp || Date.now() > Number(exp)) return false;
  return firma === await firmarSesion(env, exp);
}
const html = (cuerpo, status = 200) => new Response(cuerpo, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
const fmt = (iso) => iso ? new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

const ESTILO = `body{margin:0;background:#F3F5F2;font-family:Inter,Helvetica,Arial,sans-serif;color:#1F2523}header{background:#0E2C28;color:#fff;padding:18px 20px}header h1{margin:0;font-size:20px}header p{margin:4px 0 0;color:rgba(255,255,255,.7);font-size:14px}
.wrap{padding:18px 16px;max-width:1400px;margin:auto}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}.kpi{background:#fff;border-radius:16px;padding:14px 16px;border:1px solid #E3E8E1}.kpi b{display:block;font-size:28px;color:#0E2C28}.kpi span{color:#4E5A56;font-size:13px}
.acc{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.acc a,.acc input,.acc select{padding:10px 14px;border-radius:999px;border:1px solid #dfe5dc;background:#fff;color:#0E2C28;font-weight:700;text-decoration:none;font:inherit;font-size:14px}.acc input{flex:1;min-width:200px;font-weight:400}
.tabla{overflow-x:auto;background:#fff;border-radius:16px;border:1px solid #E3E8E1}table{border-collapse:collapse;width:100%;font-size:14px;min-width:1150px}th{text-align:left;background:#F7F9F6;color:#4E5A56;font-size:12px;text-transform:uppercase;letter-spacing:.04em;padding:10px;position:sticky;top:0}td{padding:10px;border-top:1px solid #EEF1EC;vertical-align:top}td.c,th.c{text-align:center}a{color:#1E5746}small{color:#4E5A56}
button{border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer;font:inherit;font-size:13px;border:1px solid #dfe5dc;background:#fff;color:#0E2C28;white-space:nowrap}button.si{background:#C7D95D;border-color:#C7D95D}.err{color:#b3261e;cursor:help}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;background:#EEF1EC;color:#1E5746;white-space:nowrap}.pill.ok{background:#C7D95D;color:#0E2C28}.pill.wait{background:#FFF4CC;color:#7A5B00}
details summary{cursor:pointer;color:#1E5746;font-weight:700}details div{margin-top:6px;font-size:13px;line-height:1.5}
.card{max-width:420px;margin:60px auto;background:#fff;border:1px solid #E3E8E1;border-radius:20px;padding:26px}.b{width:100%;min-height:48px;border-radius:999px;background:#C7D95D;border:0;font-weight:800;font:inherit;cursor:pointer}`;

function login(error = '') {
  return html(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Panel de simulaciones · Pulso Inversor</title><style>${ESTILO}</style></head><body>
<div class="card"><h1 style="margin:0 0 8px;font-size:22px;color:#0E2C28">Panel de simulaciones</h1>
${error ? `<p style="color:#b3261e;font-weight:700">${esc(error)}</p>` : '<p>Ingresa la clave del equipo para ver las simulaciones y su seguimiento.</p>'}
<form method="post" action="/panel/entrar"><input type="password" name="clave" required autocomplete="current-password" placeholder="Clave" style="width:100%;min-height:48px;border:1px solid #dfe5dc;border-radius:14px;padding:12px 14px;font:inherit;margin:6px 0 10px;box-sizing:border-box"><button class="b" type="submit">Entrar</button></form></div></body></html>`, error ? 401 : 200);
}

async function entrar(request, env) {
  const f = await request.formData();
  if (!env.CLAVE_PANEL || String(f.get('clave') || '') !== env.CLAVE_PANEL) {
    await new Promise((r) => setTimeout(r, 800));
    return login('Clave incorrecta.');
  }
  const exp = String(Date.now() + 14 * 864e5);
  const cookie = `panel_sim=${encodeURIComponent(exp + '.' + await firmarSesion(env, exp))}; Path=/panel; HttpOnly; Secure; SameSite=Lax; Max-Age=${14 * 86400}`;
  return new Response(null, { status: 303, headers: { location: '/panel', 'set-cookie': cookie } });
}

function estadoSeguimiento(s) {
  if (s.seguimiento_estado === 'programado') {
    const enviado = s.seguimiento_para && Date.parse(s.seguimiento_para) <= Date.now();
    return `<span class="pill ${enviado ? 'ok' : 'wait'}" title="${esc(fmt(s.seguimiento_para))}">${enviado ? '✓ Enviado' : 'Programado'}</span><br><small>${esc(fmt(s.seguimiento_para))}</small>`;
  }
  return s.seguimiento_estado ? `<span class="err" title="${esc(s.seguimiento_estado)}">⚠ No se programó</span>` : '<small>—</small>';
}

function celdaAgenda(s) {
  const partes = [];
  if (s.agenda_click) partes.push(`<span class="pill ok">Abrió la agenda</span><br><small>${esc(fmt(s.agenda_click))}${s.agenda_con ? ' · con ' + esc(s.agenda_con) : ''}</small>`);
  if (s.agenda_form) {
    try {
      const a = JSON.parse(s.agenda_form);
      partes.push(`<details><summary>Pidió reunión por formulario</summary><div>${esc(a.dia)} · ${esc(a.franja)}<br>${esc(a.modalidad)}${a.comentario ? '<br>“' + esc(a.comentario) + '”' : ''}</div></details>`);
    } catch (e) { /* nada */ }
  }
  return partes.join('<br>') || '<small>—</small>';
}

function celdaEncuesta(s) {
  if (!s.encuesta) return s.contactado_click ? '<span class="pill wait">Abrió la encuesta</span>' : '<small>—</small>';
  let e = {};
  try { e = JSON.parse(s.encuesta_json || '{}'); } catch (x) { /* nada */ }
  const nps = s.recomienda >= 9 ? 'Promotor' : s.recomienda >= 7 ? 'Neutro' : 'Detractor';
  return `<details><summary>${s.satisfaccion}/5 · recomienda ${s.recomienda}/10</summary><div>
Contactó: ${esc(e.quien || '')} por ${esc(e.medio || '')}<br>Dudas resueltas: ${esc(e.dudas || '')}<br>Recomendación: ${nps}<br>Hoy: ${esc(e.etapa || '')}${e.comentario ? '<br>“' + esc(e.comentario) + '”' : ''}<br><small>${esc(fmt(s.encuesta))}</small></div></details>`;
}

async function panel(env, url) {
  if (!env.DB) return html('<p>Falta la base de datos (binding DB).</p>', 500);
  const { results } = await env.DB.prepare('SELECT * FROM simulaciones ORDER BY creado DESC LIMIT 2000').all();
  const reu = await reunionesPorEmail(env);
  results.forEach((s) => { const r = reu[String(s.email).toLowerCase()]; if (r && r.recibido >= s.creado) s._reunion = r; });
  const asesorSel = url.searchParams.get('asesor') || '';
  const filas0 = asesorSel === '' ? results : results.filter((s) => String(s.grupo) === asesorSel);
  const n = filas0.length;
  const enviados = filas0.filter((s) => s.seguimiento_estado === 'programado' && Date.parse(s.seguimiento_para) <= Date.now()).length;
  const abrieron = filas0.filter((s) => s.agenda_click || s.agenda_form).length;
  const agendados = filas0.filter((s) => s.agendado || (s._reunion && s._reunion.evento !== 'cancelada')).length;
  const iniciadas = filas0.filter((s) => s._reunion && s._reunion.evento === 'iniciada').length;
  const contactados = filas0.filter((s) => s.contactado_click).length;
  const encuestas = filas0.filter((s) => s.encuesta);
  const prom = encuestas.length ? (encuestas.reduce((a, s) => a + (s.satisfaccion || 0), 0) / encuestas.length).toFixed(1).replace('.', ',') : '—';
  const nps = encuestas.length ? Math.round(100 * (encuestas.filter((s) => s.recomienda >= 9).length - encuestas.filter((s) => s.recomienda <= 6).length) / encuestas.length) : '—';
  const monto = filas0.reduce((a, s) => a + (s.monto || 0), 0);

  const filas = filas0.map((s) => `
    <tr>
      <td><strong>${esc(s.nombre)}</strong><br><small>${esc(s.tipo)}${s.publicidad ? ' · acepta publicidad' : ''}</small></td>
      <td><a href="mailto:${esc(s.email)}">${esc(s.email)}</a>${s.telefono ? `<br>+56 ${esc(s.telefono)} · <a href="https://app.respond.io/" target="_blank" title="Contactar por WhatsApp solo desde respond.io">respond.io</a>` : ''}</td>
      <td>${s.monto ? clp(s.monto) : '—'}</td>
      <td>${esc(s.asesor || '')}</td>
      <td>${esc(fmt(s.creado))}</td>
      <td>${estadoSeguimiento(s)}</td>
      <td>${celdaAgenda(s)}</td>
      <td class="c">${s._reunion ? `<span class="pill ${s._reunion.evento === 'cancelada' ? 'wait' : 'ok'}">${({ cancelada: 'Canceló', iniciada: '✓ Reunión iniciada', reservada: '✓ Reservó en Brevo' })[s._reunion.evento] || s._reunion.evento}</span><br><small>${esc(fmt(s._reunion.inicio))}${s._reunion.reunion ? '<br>con ' + esc(s._reunion.reunion) : ''}</small>${s._reunion._rec && !s._reunion._rec.cancelada ? '<br><small title="Recordatorios por correo">' + [['r24', '24 h'], ['r1h', '1 h'], ['r1m', '1 min'], ['p1h', 'gracias'], ['p48', '48 h después']].map(([k, t]) => { const v = s._reunion._rec[k]; return t + (v && /^\d{4}-/.test(v) ? ' ✓' : v === 'omitido' ? ' —' : v ? ' ⚠' : ' ·'); }).join(' &nbsp;') + '</small>' : ''}<br>` : ''}<form method="post" action="/panel/agendado"><input type="hidden" name="id" value="${s.id}"><input type="hidden" name="valor" value="${s.agendado ? 0 : 1}"><input type="hidden" name="asesor" value="${esc(asesorSel)}"><button class="${s.agendado ? 'si' : ''}" type="submit" title="${esc(fmt(s.agendado))}">${s.agendado ? '✓ Agendada' : 'Marcar agendada'}</button></form></td>
      <td>${s.contactado_click ? `<span class="pill ok">Sí</span><br><small>${esc(fmt(s.contactado_click))}</small>` : '<small>—</small>'}</td>
      <td>${celdaEncuesta(s)}</td>
    </tr>`).join('');

  const opciones = [['', 'Todos los asesores']].concat(ASESORES.map((g, i) => [String(i), g.personas.map((a) => a.nombre).join(' y ')]))
    .map(([v, t]) => `<option value="${v}"${v === asesorSel ? ' selected' : ''}>${esc(t)}</option>`).join('');

  return html(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Simulaciones y seguimiento · Pulso Inversor</title><link rel="icon" href="/assets/img/favicon-48.png" type="image/png"><style>${ESTILO}</style></head><body>
<header><h1>Simulaciones y seguimiento</h1><p>Simuladores de pulsoinversor.cl · correo de seguimiento a las 48 horas · agenda Brevo · encuesta · <a href="/panel/simuladores" style="color:#C7D95D;font-weight:800">Abrir simuladores asistidos →</a></p></header>
<div class="wrap">
  <div class="kpis">
    <div class="kpi"><b>${n}</b><span>Simulaciones${monto ? ' · ' + clp(monto) : ''}</span></div>
    <div class="kpi"><b>${enviados}</b><span>Seguimientos enviados</span></div>
    <div class="kpi"><b>${abrieron}</b><span>Abrieron la agenda</span></div>
    <div class="kpi"><b>${agendados}</b><span>Reuniones agendadas</span></div>
    <div class="kpi"><b>${iniciadas}</b><span>Reuniones iniciadas</span></div>
    <div class="kpi"><b>${contactados}</b><span>Dijeron “ya me contactaron”</span></div>
    <div class="kpi"><b>${encuestas.length}</b><span>Encuestas respondidas</span></div>
    <div class="kpi"><b>${prom}</b><span>Satisfacción promedio (1 a 5)</span></div>
    <div class="kpi"><b>${nps}</b><span>NPS (−100 a 100)</span></div>
  </div>
  <div class="acc"><input type="search" id="q" placeholder="Buscar por nombre, email o teléfono"><form method="get" action="/panel" style="margin:0"><select name="asesor" onchange="this.form.submit()">${opciones}</select></form><a href="/panel/simulaciones.csv">Descargar Excel (CSV)</a><a href="/panel${asesorSel ? '?asesor=' + esc(asesorSel) : ''}">Actualizar</a><a href="/panel/salir">Salir</a></div>
  <div class="tabla"><table id="t"><thead><tr><th>Persona</th><th>Contacto</th><th>Monto</th><th>Asesor</th><th>Simuló</th><th>Seguimiento 48 h</th><th>Agenda</th><th class="c">Reunión</th><th>Ya contactado</th><th>Encuesta</th></tr></thead><tbody>${filas || '<tr><td colspan="10" style="padding:30px;text-align:center;color:#4E5A56">Aún no hay simulaciones registradas.</td></tr>'}</tbody></table></div>
  <p style="color:#4E5A56;font-size:13px;line-height:1.6">“Abrió la agenda” = tocó el botón del correo y fue a la agenda Brevo del asesor. “Reservó en Brevo”, “Reunión iniciada” o “Canceló” = avisos automáticos de Brevo Meetings, con la fecha y hora de la reunión. Recordatorios: 24 h, 1 h y 1 min antes; “gracias” (1 h después, con encuesta) y “48 h después” (volver a agendar). ✓ enviado · = pendiente · — no correspondía. Si la reunión se coordinó por otra vía, márcala con “Marcar agendada”.<br>“Ya contactado” = tocó “Ya me contactaron” en el correo de seguimiento. Encuesta: toca el resultado para ver el detalle.</p>
</div>
<script>document.getElementById('q').addEventListener('input',function(e){var q=e.target.value.toLowerCase();document.querySelectorAll('#t tbody tr').forEach(function(tr){tr.style.display=tr.textContent.toLowerCase().indexOf(q)>-1?'':'none'})});</script>
</body></html>`);
}

async function marcarAgendado(request, env) {
  const f = await request.formData();
  const id = parseInt(f.get('id'), 10), valor = f.get('valor') === '1', asesor = String(f.get('asesor') || '');
  await env.DB.prepare('UPDATE simulaciones SET agendado = ? WHERE id = ?').bind(valor ? new Date().toISOString() : null, id).run();
  return new Response(null, { status: 303, headers: { location: '/panel' + (asesor ? '?asesor=' + encodeURIComponent(asesor) : '') } });
}

async function csv(env) {
  const { results } = await env.DB.prepare('SELECT * FROM simulaciones ORDER BY creado ASC').all();
  const enc = (s) => { try { return JSON.parse(s || '{}'); } catch (e) { return {}; } };
  const cols = [
    ['Fecha simulación', (s) => fmt(s.creado)], ['Nombre', 'nombre'], ['Email', 'email'], ['Teléfono', (s) => s.telefono ? '+56 ' + s.telefono : ''],
    ['Simulador', 'tipo'], ['Monto', 'monto'], ['Acepta publicidad', (s) => (s.publicidad ? 'Sí' : 'No')], ['Asesor', 'asesor'], ['Seguimiento', 'seguimiento_estado'], ['Seguimiento enviado', (s) => fmt(s.seguimiento_para)],
    ['Abrió agenda', (s) => fmt(s.agenda_click)], ['Agendó con', 'agenda_con'], ['Solicitud por formulario', (s) => { const a = enc(s.agenda_form); return a.dia ? `${a.dia} · ${a.franja} · ${a.modalidad}` : ''; }],
    ['Reunión agendada (marcada)', (s) => fmt(s.agendado)], ['Dijo ya contactado', (s) => fmt(s.contactado_click)], ['Encuesta', (s) => fmt(s.encuesta)],
    ['Satisfacción (1-5)', 'satisfaccion'], ['Recomienda (0-10)', 'recomienda'], ['Quién contactó', (s) => enc(s.encuesta_json).quien], ['Medio', (s) => enc(s.encuesta_json).medio],
    ['Dudas resueltas', (s) => enc(s.encuesta_json).dudas], ['Etapa', (s) => enc(s.encuesta_json).etapa], ['Comentario encuesta', (s) => enc(s.encuesta_json).comentario],
  ];
  const celda = (v) => { let s = String(v ?? ''); if (/^[=@]|^[+\-](?![\d\s])/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const lineas = [cols.map(([t]) => celda(t)).join(';')].concat(results.map((s) => cols.map(([, k]) => celda(typeof k === 'function' ? k(s) : s[k])).join(';')));
  return new Response('﻿' + lineas.join('\r\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="simulaciones-pulso.csv"', 'cache-control': 'no-store' } });
}

// ---------- Simuladores asistidos (/panel/simuladores): clave propia del equipo ----------
// La clave no está escrita aquí: se compara su derivación PBKDF2. Si se define el secreto CLAVE_SIMULADORES en Cloudflare, se usa ese.
const SIM_SAL = 'pulso-sim-2026';
const SIM_HASH = '0bcf13066285a8dc2f1faa97a712a3f2f94f1b7ddd2d8a53843e4bbabad79fce';
async function claveSimOk(env, clave) {
  if (env.CLAVE_SIMULADORES) return clave === env.CLAVE_SIMULADORES;
  const k = await crypto.subtle.importKey('raw', enc.encode(clave), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SIM_SAL), iterations: 100000 }, k, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('') === SIM_HASH;
}
async function firmaSim(env, valor) {
  const k = await crypto.subtle.importKey('raw', enc.encode('sim:' + (env.CLAVE_SIMULADORES || env.CLAVE_PANEL || SIM_HASH)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(valor));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/[+/=]/g, '');
}
async function sesionSim(request, env) {
  const c = (request.headers.get('cookie') || '').match(/(?:^|;\s*)sim_eq=([^;]+)/);
  if (!c) return false;
  const [exp, firma] = decodeURIComponent(c[1]).split('.');
  if (!exp || Date.now() > Number(exp)) return false;
  return firma === await firmaSim(env, exp);
}
function loginSim(error = '') {
  return html(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Simuladores asistidos · Pulso Inversor</title><link rel="icon" href="/assets/img/favicon-48.png" type="image/png"><style>${ESTILO}</style></head><body>
<div class="card"><h1 style="margin:0 0 8px;font-size:22px;color:#0E2C28">Simuladores asistidos</h1>
${error ? `<p style="color:#b3261e;font-weight:700">${esc(error)}</p>` : '<p>Acceso para el equipo de Pulso Inversor. Ingresa la clave para usar los simuladores de Producción y Arquitectura de Capital.</p>'}
<form method="post" action="/panel/simuladores/entrar"><input type="password" name="clave" required autocomplete="current-password" placeholder="Clave" style="width:100%;min-height:48px;border:1px solid #dfe5dc;border-radius:14px;padding:12px 14px;font:inherit;margin:6px 0 10px;box-sizing:border-box"><button class="b" type="submit">Entrar</button></form>
<p style="margin:14px 0 0;font-size:14px"><a href="/simuladores">← Volver a los simuladores</a></p></div></body></html>`, error ? 401 : 200);
}
async function rutaSimuladores(request, env, url) {
  if (url.pathname === '/panel/simuladores/entrar' && request.method === 'POST') {
    const f = await request.formData();
    if (!(await claveSimOk(env, String(f.get('clave') || '')))) { await new Promise((r) => setTimeout(r, 800)); return loginSim('Clave incorrecta.'); }
    const exp = String(Date.now() + 14 * 864e5);
    const cookie = `sim_eq=${encodeURIComponent(exp + '.' + await firmaSim(env, exp))}; Path=/panel/simuladores; HttpOnly; Secure; SameSite=Lax; Max-Age=${14 * 86400}`;
    return new Response(null, { status: 303, headers: { location: '/panel/simuladores', 'set-cookie': cookie } });
  }
  if (!(await sesionSim(request, env)) && !(await sesionValida(request, env))) return loginSim();
  const r = await env.ASSETS.fetch(new Request(new URL('/simuladores-equipo', url)));
  return new Response(r.body, { status: r.status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

export async function rutaPanel(request, env, url) {
  const p = url.pathname, m = request.method;
  if (p === '/panel/simuladores' || p === '/panel/simuladores/entrar') return rutaSimuladores(request, env, url);
  if (p === '/panel/entrar' && m === 'POST') return entrar(request, env);
  if (p === '/panel/salir') return new Response(null, { status: 303, headers: { location: '/panel', 'set-cookie': 'panel_sim=; Path=/panel; Max-Age=0; HttpOnly; Secure; SameSite=Lax' } });
  if (!(await sesionValida(request, env))) return login();
  if (p === '/panel/agendado' && m === 'POST') return marcarAgendado(request, env);
  if (p === '/panel/simulaciones.csv') return csv(env);
  // Informe semanal: vista previa (GET) y envío de prueba a INFORME_PARA (POST).
  if (p === '/panel/informe') {
    const { armarInforme, enviarInforme } = await import('./informe.js');
    if (!env.WINDSOR_API_KEY) return new Response('Falta el secreto WINDSOR_API_KEY.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    if (m === 'POST') { const r = await enviarInforme(env); return new Response('Enviado: ' + r.asunto + (r.errores.length ? '\nAvisos: ' + r.errores.join(' · ') : ''), { headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
    const r = await armarInforme(env);
    return new Response(r.html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return panel(env, url);
}
