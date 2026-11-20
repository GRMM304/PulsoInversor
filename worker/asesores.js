// Pulso Inversor · Portal de asesores (/asesores)
// Cada asesor entra con su correo corporativo (enlace de acceso por correo, sin contraseña) y ve:
//   · Inicio: sus métricas (leads, reuniones, asistencia, inversiones, satisfacción) y lo que tiene pendiente.
//   · Reuniones: su enlace de agenda para copiar, próximas reuniones, las que debe confirmar y el historial.
//   · Leads: las simulaciones que le corresponden y el botón "Invirtió".
//   · Recursos: presentación, simuladores, páginas para compartir, mensajes listos y lo que vaya sumando el equipo.
// Los administradores (EQUIPO_PORTAL con rol 'admin') ven a todo el equipo, pueden agregar o quitar recursos y publican las noticias del sitio (worker/noticias.js).

import { vistaNoticiasAdmin, rutaNoticiasAdmin } from './noticias.js';
import { ASESORES, AGENDA_BREVO, RESENAS_GOOGLE, asesorDeReunion, esPrueba, SITIO, DEFAULT_SENDER, P, esc, clp, brevo, boton, plantilla } from './comun.js';

// Quiénes entran. Los asesores salen de ASESORES (grupo 0 = Renato, grupo 1 = Pamela).
// Por ahora (19-nov-2026) solo entran los administradores: Renato y Pamela quedan sin acceso (acceso: false)
// hasta confirmar sus correos. Más adelante, cualquier persona @grupomm.cl podrá tener su espacio como asesor.
const ADMINS = [
  { email: 'eorrego@grupomm.cl', nombre: 'Erika' },
  { email: 'ibarboza@grupomm.cl', nombre: 'Iván Barboza' },
  { email: 'frojas@grupomm.cl', nombre: 'Felipe Rojas' },
];
// Personas de Grupo MM que venden Pulso Inversor sin tramo de edad asignado (todavía sin leads ni agenda propia).
const VENDEDORES = [
  { email: 'jvalenzuela@grupomm.cl', nombre: 'Jessica Valenzuela', cargo: 'Asesora de inversiones' },
];
export const EQUIPO_PORTAL = [
  ...[0, 1].map((g) => ({ ...ASESORES[g].personas[0], grupo: g, rol: 'asesor', acceso: false })),
  ...VENDEDORES.map((v) => ({ ...v, rol: 'asesor', acceso: true })),
  ...ADMINS.map((a) => ({ ...a, rol: 'admin', acceso: true })),
];
const persona = (email) => EQUIPO_PORTAL.find((p) => p.acceso && p.email === String(email || '').trim().toLowerCase()) || null;
const ASESORES_PORTAL = EQUIPO_PORTAL.filter((p) => p.rol === 'asesor');

const PRESENTACION = 'https://presentacion.pulsoinversor.cl/';
const BANDEJA_WHATSAPP = 'https://app.respond.io/';

/* ---------- Sesión ---------- */
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function hmac(env, txt) {
  const k = await crypto.subtle.importKey('raw', enc.encode('asesores|' + env.FIRMA_SEGUIMIENTO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(txt)));
}
async function sellar(env, tipo, email, msVigencia) {
  const c = [tipo, email, Date.now() + msVigencia].join('~');
  return c + '~' + await hmac(env, c);
}
async function abrir(env, token, tipo) {
  const p = String(token || '').split('~');
  if (p.length !== 4 || p[0] !== tipo || !env.FIRMA_SEGUIMIENTO) return null;
  if (Date.now() > Number(p[2])) return null;
  if (p[3] !== await hmac(env, p.slice(0, 3).join('~'))) return null;
  return persona(p[1]);
}
export async function sesionAsesor(request, env) {
  const c = (request.headers.get('cookie') || '').match(/(?:^|;\s*)asesor_ses=([^;]+)/);
  return c ? abrir(env, decodeURIComponent(c[1]), 'ses') : null;
}

/* ---------- Utilidades ---------- */
const TZ = 'America/Santiago';
const fFecha = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CL', { timeZone: TZ, day: '2-digit', month: '2-digit', year: '2-digit' }) : '');
const fHora = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-CL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const fLarga = (iso) => (iso ? new Date(iso).toLocaleString('es-CL', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
const html = (cuerpo, status = 200, extra = {}) => new Response(cuerpo, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', ...extra } });
const ir = (location, extra = {}) => new Response(null, { status: 303, headers: { location, ...extra } });
const asesorDe = (r) => { const x = asesorDeReunion(r.asesor); return x ? x.asesor.nombre : ''; };
const genero = (p) => (p && /^asesora/i.test(p.cargo || '') ? 'a' : 'o');

/* ---------- Estilos y marco ---------- */
const CSS = `:root{--v:#0E2C28;--v2:#1E5746;--l:#C7D95D;--t:#1F2523;--g:#4E5A56;--f:#F3F5F2;--b:#E3E8E1}
*{box-sizing:border-box}body{margin:0;background:var(--f);font-family:Inter,Helvetica,Arial,sans-serif;color:var(--t);font-size:15px;line-height:1.5}
a{color:var(--v2)}header{background:var(--v);color:#fff}header .in{max-width:1200px;margin:auto;padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
header .marca{font-weight:800;font-size:17px;letter-spacing:-.01em}header .marca span{color:var(--l)}header .yo{margin-left:auto;font-size:13px;opacity:.85}header .yo a{color:#fff}
nav{background:#fff;border-bottom:1px solid var(--b)}nav .in{max-width:1200px;margin:auto;padding:0 10px;display:flex;gap:2px;overflow-x:auto}
nav a{padding:13px 14px;text-decoration:none;color:var(--g);font-weight:700;white-space:nowrap;border-bottom:3px solid transparent}nav a.on{color:var(--v);border-color:var(--l)}
main{max-width:1200px;margin:auto;padding:20px 16px 60px}h1{font-size:24px;margin:0 0 4px;color:var(--v);letter-spacing:-.02em}h2{font-size:18px;margin:28px 0 10px;color:var(--v)}
.sub{color:var(--g);margin:0 0 16px}.barra{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 16px}
.chip{display:inline-block;padding:7px 13px;border-radius:999px;border:1px solid var(--b);background:#fff;color:var(--v);font-weight:700;font-size:13px;text-decoration:none}.chip.on{background:var(--v);color:#fff;border-color:var(--v)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:12px}.kpi{background:#fff;border:1px solid var(--b);border-radius:16px;padding:14px 16px}
.kpi b{display:block;font-size:26px;color:var(--v);letter-spacing:-.02em;line-height:1.2}.kpi span{font-size:13px;color:var(--g)}.kpi small{display:block;font-size:12px;color:var(--v2);font-weight:700;margin-top:2px}
.card{background:#fff;border:1px solid var(--b);border-radius:16px;padding:16px 18px}.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
.tabla{overflow-x:auto;background:#fff;border:1px solid var(--b);border-radius:16px}table{border-collapse:collapse;width:100%;font-size:14px}
th{text-align:left;background:#F7F9F6;color:var(--g);font-size:12px;text-transform:uppercase;letter-spacing:.04em;padding:10px 12px;white-space:nowrap}td{padding:10px 12px;border-top:1px solid var(--b);vertical-align:top}td:first-child{white-space:nowrap}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:700;background:#EEF1EC;color:var(--v2);white-space:nowrap}.pill.ok{background:var(--l);color:var(--v)}.pill.wait{background:#FFF4CC;color:#7a5b00}.pill.no{background:#FBE3E1;color:#9b2c22}
.btn{display:inline-block;border-radius:999px;padding:9px 16px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;border:1px solid var(--v2);background:#fff;color:var(--v);text-decoration:none;white-space:nowrap}
.btn.p{background:var(--l);border-color:var(--l)}.btn:hover{filter:brightness(.96)}.btn.peq{padding:6px 11px;font-size:12px}
.aviso{background:#FFF8DB;border:1px solid #F1DE8A;border-radius:14px;padding:12px 14px;font-size:14px;margin:0 0 14px}
.enlace{display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:var(--f);border:1px dashed #cdd6c9;border-radius:12px;padding:10px 12px;margin:10px 0}.enlace code{font-size:13px;word-break:break-all;flex:1;min-width:200px}
.rec{display:flex;flex-direction:column;gap:8px}.rec h3{margin:0;font-size:16px;color:var(--v)}.rec p{margin:0;color:var(--g);font-size:14px}.rec .acc{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}
.rec pre{white-space:pre-wrap;font:inherit;font-size:14px;background:var(--f);border-radius:10px;padding:10px 12px;margin:0}
.cat{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--v2);font-weight:800}
.bars{display:flex;align-items:flex-end;gap:10px;height:150px;padding:10px 4px 0}.bars>div{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;color:var(--g)}
.bars i{display:block;width:42%;max-width:20px;background:var(--l);border-radius:6px 6px 0 0;min-height:2px}.bars i.r{background:var(--v2)}.bars .par{display:flex;gap:3px;align-items:flex-end;width:100%;justify-content:center;height:110px}
.ley{font-size:12px;color:var(--g)}.ley i{display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--l);margin:0 4px 0 10px}.ley i.r{background:var(--v2)}
input,select,textarea{font:inherit;padding:10px 12px;border:1px solid #d6ddd2;border-radius:12px;background:#fff;width:100%}label{font-size:13px;font-weight:700;color:var(--g);display:block;margin:0 0 4px}
.form{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.vacio{color:var(--g);font-size:14px;padding:6px 0}
.login{max-width:430px;margin:70px auto;background:#fff;border:1px solid var(--b);border-radius:20px;padding:28px}
@media(max-width:600px){h1{font-size:21px}.kpi b{font-size:22px}}`;

const SCRIPT = `<script>document.addEventListener('click',function(e){var b=e.target.closest('[data-copiar]');if(!b)return;e.preventDefault();var t=b.getAttribute('data-copiar'),o=b.textContent;
function ok(){b.textContent='¡Copiado!';setTimeout(function(){b.textContent=o},1600)}
if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,function(){prompt('Copia el texto:',t)});else prompt('Copia el texto:',t)});
var q=document.getElementById('buscar');if(q)q.addEventListener('input',function(){var v=q.value.toLowerCase();document.querySelectorAll('[data-fila]').forEach(function(f){f.style.display=f.textContent.toLowerCase().indexOf(v)>-1?'':'none'})});</script>`;

function marco(yo, vista, cuerpo, q = '') {
  const tabs = [['inicio', 'Inicio'], ['reuniones', 'Reuniones'], ['leads', 'Leads'], ...(yo.rol === 'admin' ? [['encuestas', 'Encuestas']] : []), ['recursos', 'Recursos de venta'], ...(yo.rol === 'admin' ? [['noticias', 'Noticias']] : [])];
  return html(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Portal de asesores · Pulso Inversor</title><link rel="icon" href="/assets/img/favicon-32.png"><style>${CSS}</style></head><body>
<header><div class="in"><div class="marca">Pulso Inversor · <span>Portal de asesores</span></div><div class="yo">${esc(yo.nombre)} · <a href="/asesores/salir">Salir</a></div></div></header>
<nav><div class="in">${tabs.map(([k, t]) => `<a href="/asesores?v=${k}${q}" class="${k === vista ? 'on' : ''}">${t}</a>`).join('')}</div></nav>
<main>${cuerpo}</main>${SCRIPT}</body></html>`);
}

function pantallaLogin(mensaje = '', error = false) {
  return html(`<!DOCTYPE html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Portal de asesores · Pulso Inversor</title><link rel="icon" href="/assets/img/favicon-32.png"><style>${CSS}</style></head><body>
<div class="login"><p class="cat">Pulso Inversor</p><h1>Portal de asesores</h1>
${mensaje ? `<p style="${error ? 'color:#9b2c22;font-weight:700' : 'color:var(--v2);font-weight:700'}">${esc(mensaje)}</p>` : '<p class="sub">Escribe tu correo de Pulso Inversor y te enviamos un enlace para entrar. No necesitas contraseña.</p>'}
<form method="post" action="/asesores/entrar"><label for="e">Correo</label><input id="e" type="email" name="email" required autocomplete="email" placeholder="nombre@grupomm.cl">
<button class="btn p" style="width:100%;margin-top:12px;padding:13px" type="submit">Enviarme el enlace</button></form></div></body></html>`, error ? 400 : 200);
}

/* ---------- Datos ---------- */
async function cargar(env) {
  const desde = new Date(Date.now() - 400 * 864e5).toISOString();
  const [s, r] = await Promise.all([
    env.DB.prepare('SELECT id, creado, nombre, email, telefono, tipo, monto, grupo, edad, whatsapp, seguimiento_estado, encuesta, encuesta_json, satisfaccion, recomienda, invirtio FROM simulaciones WHERE creado >= ? ORDER BY creado DESC').bind(desde).all(),
    env.DB.prepare('SELECT id, email, nombre, asesor, inicio, fin, url_video, lugar, cancelada, realizada, grabacion FROM recordatorios WHERE inicio >= ? ORDER BY inicio DESC').bind(desde).all(),
  ]);
  const sims = (s.results || []).filter((x) => !esPrueba(x.email));
  const reus = (r.results || []).filter((x) => !esPrueba(x.email)).map((x) => ({ ...x, asesorNombre: asesorDe(x) }));
  return { sims, reus };
}
// Filtra por asesor (null = todo el equipo).
const deAsesor = (datos, a) => (a ? {
  sims: datos.sims.filter((s) => Number(s.grupo) === a.grupo),
  reus: datos.reus.filter((r) => r.asesorNombre === a.nombre),
} : datos);

function metricas({ sims, reus }, dias) {
  const desde = Date.now() - dias * 864e5, ahora = Date.now();
  const enP = (iso) => iso && Date.parse(iso) >= desde;
  const leads = sims.filter((s) => enP(s.creado));
  const activas = reus.filter((r) => !r.cancelada);
  const agendadas = activas.filter((r) => enP(r.inicio) || (Date.parse(r.inicio) > ahora && Date.parse(r.inicio) - ahora < 60 * 864e5));
  const pasadas = activas.filter((r) => enP(r.inicio) && Date.parse(r.fin || r.inicio) < ahora);
  const realizadas = pasadas.filter((r) => r.realizada === 'si');
  const noshow = pasadas.filter((r) => r.realizada === 'no');
  const porConfirmar = activas.filter((r) => !r.realizada && Date.parse(r.fin || r.inicio) < ahora && ahora - Date.parse(r.inicio) < 14 * 864e5);
  const proximas = activas.filter((r) => Date.parse(r.inicio) >= ahora - 30 * 60e3).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const correosReu = new Set(activas.map((r) => String(r.email).toLowerCase()));
  const leadsConReu = leads.filter((s) => correosReu.has(String(s.email).toLowerCase()));
  const inv = sims.filter((s) => enP(s.invirtio));
  const enc = sims.filter((s) => enP(s.encuesta) && s.satisfaccion);
  const prom = enc.length ? (enc.reduce((a, s) => a + Number(s.satisfaccion), 0) / enc.length).toFixed(1).replace('.', ',') : '—';
  const nps = enc.length ? Math.round(((enc.filter((s) => s.recomienda >= 9).length - enc.filter((s) => s.recomienda <= 6).length) / enc.length) * 100) : null;
  return {
    leads, montoLeads: leads.reduce((a, s) => a + (Number(s.monto) || 0), 0), agendadas, realizadas, noshow, porConfirmar, proximas,
    leadsConReu, inv, montoInv: inv.reduce((a, s) => a + (Number(s.monto) || 0), 0), enc, prom, nps,
  };
}

function semanas({ sims, reus }) {
  const out = [];
  for (let w = 7; w >= 0; w--) {
    const fin = Date.now() - w * 7 * 864e5, ini = fin - 7 * 864e5;
    const en = (iso) => iso && Date.parse(iso) >= ini && Date.parse(iso) < fin;
    out.push({ etiqueta: new Date(ini).toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short' }), leads: sims.filter((s) => en(s.creado)).length, reus: reus.filter((r) => !r.cancelada && r.realizada === 'si' && en(r.inicio)).length });
  }
  return out;
}

/* ---------- Vistas ---------- */
function kpi(valor, texto, extra = '') { return `<div class="kpi"><b>${valor}</b><span>${texto}</span>${extra ? `<small>${extra}</small>` : ''}</div>`; }

function selectorPeriodo(vista, dias, q) {
  return [7, 30, 90, 365].map((d) => `<a class="chip ${d === dias ? 'on' : ''}" href="/asesores?v=${vista}&dias=${d}${q}">${d === 365 ? '12 meses' : 'Últimos ' + d + ' días'}</a>`).join('');
}
function selectorAsesor(yo, vista, dias, ver) {
  if (yo.rol !== 'admin') return '';
  const op = [['', 'Todo el equipo'], ...ASESORES_PORTAL.map((a) => [a.email, a.nombre])];
  return `<span style="margin-left:auto"></span>` + op.map(([e, n]) => `<a class="chip ${(ver ? ver.email : '') === e ? 'on' : ''}" href="/asesores?v=${vista}&dias=${dias}${e ? '&ver=' + encodeURIComponent(e) : ''}">${esc(n)}</a>`).join('');
}

function filaReunion(r, conAsesor, conAcciones) {
  const ahora = Date.now(), pasada = Date.parse(r.fin || r.inicio) < ahora;
  const estado = r.cancelada ? '<span class="pill no">Cancelada</span>' : r.realizada === 'si' ? '<span class="pill ok">Realizada</span>' : r.realizada === 'no' ? '<span class="pill no">No se presentó</span>' : pasada ? '<span class="pill wait">Por confirmar</span>' : '<span class="pill">Agendada</span>';
  const acc = [];
  if (conAcciones && !r.cancelada && !r.realizada && pasada) acc.push(`<a class="btn p peq" href="/asesores/reunion?rid=${r.id}&r=si">Sí, se realizó</a> <a class="btn peq" href="/asesores/reunion?rid=${r.id}&r=no">No se presentó</a>`);
  if (conAcciones && r.realizada === 'si' && !r.grabacion) acc.push(`<a class="btn peq" href="/asesores/reunion?rid=${r.id}&r=si">Enviar grabación</a>`);
  if (r.grabacion) acc.push(`<a class="btn peq" href="${esc(r.grabacion)}" target="_blank" rel="noopener">Ver grabación</a>`);
  if (!pasada && r.url_video && !r.cancelada) acc.push(`<a class="btn p peq" href="${esc(r.url_video)}" target="_blank" rel="noopener">Entrar</a>`);
  return `<tr data-fila><td><strong>${esc(fLarga(r.inicio))}</strong></td><td>${esc(r.nombre || '—')}<br><small style="color:var(--g)">${esc(r.email)}</small></td>${conAsesor ? `<td>${esc(r.asesorNombre || r.asesor || '—')}</td>` : ''}<td>${esc(r.url_video ? 'Videollamada' : (r.lugar || '—'))}</td><td>${estado}</td><td>${acc.join(' ') || ''}</td></tr>`;
}
function tablaReuniones(lista, conAsesor, conAcciones, vacio) {
  if (!lista.length) return `<p class="vacio">${vacio}</p>`;
  return `<div class="tabla"><table><thead><tr><th>Fecha</th><th>Persona</th>${conAsesor ? '<th>Asesor</th>' : ''}<th>Modalidad</th><th>Estado</th><th></th></tr></thead><tbody>${lista.map((r) => filaReunion(r, conAsesor, conAcciones)).join('')}</tbody></table></div>`;
}

function vistaInicio(yo, ver, datos, dias, q) {
  const d = deAsesor(datos, ver), m = metricas(d, dias), sem = semanas(d);
  const max = Math.max(1, ...sem.map((s) => Math.max(s.leads, s.reus)));
  let cuerpo = `<h1>Hola, ${esc(yo.nombre.split(' ')[0])}</h1><p class="sub">${ver ? `Métricas de ${esc(ver.nombre)}` : 'Métricas de todo el equipo'} · solo cuentan personas reales (sin pruebas).</p>
<div class="barra">${selectorPeriodo('inicio', dias, q)}${selectorAsesor(yo, 'inicio', dias, ver)}</div>`;
  if (ver && ver.grupo == null) cuerpo += `<div class="aviso"><strong>Todavía no tienes leads ni agenda asignados.</strong> Cuando te asignemos personas, aquí verás tus métricas y reuniones. Mientras tanto, en <a href="/asesores?v=recursos">Recursos de venta</a> tienes la presentación, los simuladores y mensajes listos para WhatsApp.</div>`;
  if (m.porConfirmar.length) cuerpo += `<div class="aviso"><strong>${ver ? 'Tienes' : 'El equipo tiene'} ${m.porConfirmar.length} reunión${m.porConfirmar.length > 1 ? 'es' : ''} por confirmar.</strong> Sin tu confirmación, la persona no recibe el agradecimiento ni el seguimiento. <a href="/asesores?v=reuniones${q}">Confirmar ahora →</a></div>`;
  cuerpo += `<div class="kpis">
${kpi(m.leads.length, 'Leads (simulaciones)', m.montoLeads ? clp(m.montoLeads) + ' simulados' : '')}
${kpi(m.agendadas.length, 'Reuniones agendadas', pct(m.leadsConReu.length, m.leads.length) + ' de los leads agendó')}
${kpi(m.realizadas.length, 'Reuniones realizadas', 'Asistencia ' + pct(m.realizadas.length, m.realizadas.length + m.noshow.length))}
${kpi(m.noshow.length, 'No se presentaron')}
${kpi(m.inv.length, 'Invirtieron', m.montoInv ? clp(m.montoInv) + ' simulados' : '')}
${yo.rol !== 'admin' ? '' : kpi(m.prom === '—' ? '—' : m.prom + '/5', 'Satisfacción (encuesta)', m.enc.length ? m.enc.length + ' respuesta' + (m.enc.length > 1 ? 's' : '') + (m.nps != null ? ' · NPS ' + m.nps : '') : 'Sin respuestas aún')}
</div>
<div class="grid2" style="margin-top:14px">
<div class="card"><strong>Últimas 8 semanas</strong><div class="ley"><i></i>Leads<i class="r"></i>Reuniones realizadas</div>
<div class="bars">${sem.map((s) => `<div><div class="par"><i style="height:${Math.round((s.leads / max) * 100)}%" title="${s.leads} leads"></i><i class="r" style="height:${Math.round((s.reus / max) * 100)}%" title="${s.reus} reuniones"></i></div>${esc(s.etiqueta)}</div>`).join('')}</div></div>
<div class="card"><strong>Próximas reuniones</strong>${m.proximas.length ? '<ul style="padding-left:18px;margin:10px 0 0">' + m.proximas.slice(0, 6).map((r) => `<li><strong>${esc(fLarga(r.inicio))}</strong> · ${esc(r.nombre || r.email)}${ver ? '' : ` · <small>${esc(r.asesorNombre)}</small>`}</li>`).join('') + '</ul>' : `<p class="vacio">No hay reuniones agendadas.</p>`}
<p style="margin:12px 0 0"><a href="/asesores?v=reuniones${q}">Ver todas →</a></p></div></div>`;
  // Comparación del equipo (solo administradores, vista "Todo el equipo").
  if (yo.rol === 'admin' && !ver) {
    const filas = ASESORES_PORTAL.map((a) => { const x = metricas(deAsesor(datos, a), dias); return `<tr><td><strong>${esc(a.nombre)}</strong></td><td>${x.leads.length}</td><td>${x.agendadas.length}</td><td>${x.realizadas.length}</td><td>${pct(x.realizadas.length, x.realizadas.length + x.noshow.length)}</td><td>${x.porConfirmar.length}</td><td>${x.inv.length}</td><td>${x.prom}</td></tr>`; }).join('');
    cuerpo += `<h2>Comparación por asesor</h2><div class="tabla"><table><thead><tr><th>Asesor</th><th>Leads</th><th>Agendadas</th><th>Realizadas</th><th>Asistencia</th><th>Por confirmar</th><th>Invirtieron</th><th>Satisfacción</th></tr></thead><tbody>${filas}</tbody></table></div>`;
  }
  const yoAsesor = ver || (yo.rol === 'asesor' ? yo : null);
  if (yoAsesor) cuerpo += bloqueAgenda(yoAsesor);
  return cuerpo;
}

function bloqueAgenda(a) {
  const ag = (AGENDA_BREVO[a.grupo] || [])[0];
  if (!ag) return '';
  return `<h2>Enlace de agenda · ${esc(a.nombre)}</h2><div class="card">
<p style="margin:0 0 6px">Compártelo <strong>solo con personas que Lorenzo ya precalificó</strong> en el WhatsApp de Pulso Inversor. En el sitio no hay enlaces directos a tu agenda.</p>
<div class="enlace"><code>${esc(ag.url)}</code><button class="btn p peq" data-copiar="${esc(ag.url)}">Copiar enlace</button><a class="btn peq" href="${esc(ag.url)}" target="_blank" rel="noopener">Abrir</a></div>
<p style="margin:0;font-size:13px;color:var(--g)">Después de reservar, la persona llega a la página "Reunión agendada" y recibe la confirmación por correo y WhatsApp.</p></div>`;
}

function vistaReuniones(yo, ver, datos, dias, q) {
  const d = deAsesor(datos, ver), m = metricas(d, dias), equipo = !ver;
  const puede = (r) => yo.rol === 'admin' || r.asesorNombre === yo.nombre;
  const hist = d.reus.filter((r) => Date.parse(r.fin || r.inicio) < Date.now() && Date.parse(r.inicio) >= Date.now() - dias * 864e5 && (r.realizada || r.cancelada));
  return `<h1>Reuniones</h1><p class="sub">${ver ? esc(ver.nombre) : 'Todo el equipo'}</p>
<div class="barra">${selectorPeriodo('reuniones', dias, q)}${selectorAsesor(yo, 'reuniones', dias, ver)}</div>
${ver ? bloqueAgenda(ver) : ''}
<h2>Por confirmar${m.porConfirmar.length ? ` (${m.porConfirmar.length})` : ''}</h2>
<p class="sub" style="margin-top:-4px">Confirma si la reunión se realizó: con "Sí" la persona recibe el agradecimiento, la encuesta y el seguimiento, y puedes enviar la grabación a Iván y Felipe. Con "No se presentó" recibe la invitación a reagendar.</p>
${tablaReuniones(m.porConfirmar.filter(puede).concat(m.porConfirmar.filter((r) => !puede(r))), equipo, true, 'No tienes reuniones por confirmar. ¡Bien!')}
<h2>Próximas</h2>${tablaReuniones(m.proximas, equipo, true, 'No hay reuniones agendadas.')}
<h2>Historial</h2>${tablaReuniones(hist, equipo, true, 'Sin reuniones en este período.')}`;
}

function vistaLeads(yo, ver, datos, dias, q) {
  const d = deAsesor(datos, ver), m = metricas(d, dias), equipo = !ver;
  const reuPorCorreo = {};
  for (const r of datos.reus) { const k = String(r.email).toLowerCase(); if (!r.cancelada && (!reuPorCorreo[k] || Date.parse(r.inicio) > Date.parse(reuPorCorreo[k].inicio))) reuPorCorreo[k] = r; }
  const filas = m.leads.map((s) => {
    const r = reuPorCorreo[String(s.email).toLowerCase()];
    const reu = !r ? '<span class="pill">Sin reunión</span>' : r.realizada === 'si' ? '<span class="pill ok">Realizada</span>' : r.realizada === 'no' ? '<span class="pill no">No se presentó</span>' : Date.parse(r.inicio) > Date.now() ? `<span class="pill wait">${esc(fFecha(r.inicio))} ${esc(fHora(r.inicio))}</span>` : '<span class="pill wait">Por confirmar</span>';
    const wa = s.whatsapp === 'enviado' ? '<span class="pill ok">Lorenzo escribió</span>' : s.whatsapp ? `<span class="pill">${esc(String(s.whatsapp).split(':')[0])}</span>` : '<span class="pill">—</span>';
    const enc = s.satisfaccion ? `<span class="pill ok">${s.satisfaccion}/5 · ${s.recomienda}/10</span>` : '';
    const inv = s.invirtio ? `<span class="pill ok">Invirtió ${esc(fFecha(s.invirtio))}</span>` : `<form method="post" action="/asesores/invirtio" onsubmit="return confirm('¿Confirmas que ${esc(String(s.nombre).replace(/'/g, ''))} invirtió? Se registra en el CRM y en Meta.')"><input type="hidden" name="id" value="${s.id}"><input type="hidden" name="volver" value="${esc('/asesores?v=leads&dias=' + dias + q)}"><button class="btn peq" type="submit">Invirtió</button></form>`;
    const asesorTxt = ASESORES[s.grupo] ? ASESORES[s.grupo].personas.map((p) => p.nombre.split(' ')[0]).join(' y ') : '—';
    return `<tr data-fila><td>${esc(fFecha(s.creado))}</td><td><strong>${esc(s.nombre)}</strong><br><small style="color:var(--g)">${esc(s.email)}${s.telefono ? ' · +56 ' + esc(s.telefono) : ''}</small></td>${equipo ? `<td>${esc(asesorTxt)}</td>` : ''}<td>${esc(s.edad || '—')}</td><td>${esc(s.tipo)}</td><td>${s.monto ? clp(s.monto) : '—'}</td><td>${wa}</td><td>${reu}</td>${yo.rol === 'admin' ? `<td>${enc}</td>` : ''}<td>${inv}</td></tr>`;
  }).join('');
  return `<h1>Leads</h1><p class="sub">Simulaciones ${ver ? 'asignadas a ' + esc(ver.nombre) : 'de todo el equipo'}${ver && ver.grupo == null ? '. Todavía no tienes leads asignados' : ' (asignación por edad: hasta 40 años Renato, 41 y más Pamela)'}.</p>
<div class="aviso"><strong>Contacta solo desde el WhatsApp de Pulso Inversor (+56 9 5879 2038)</strong>, nunca desde tu WhatsApp personal. Así la conversación queda registrada y Lorenzo puede precalificar. <a href="${BANDEJA_WHATSAPP}" target="_blank" rel="noopener">Abrir la bandeja de WhatsApp →</a></div>
<div class="barra">${selectorPeriodo('leads', dias, q)}${selectorAsesor(yo, 'leads', dias, ver)}</div>
<input id="buscar" type="search" placeholder="Buscar por nombre, correo, estrategia…" style="max-width:420px;margin:0 0 12px">
${m.leads.length ? `<div class="tabla"><table><thead><tr><th>Fecha</th><th>Persona</th>${equipo ? '<th>Asesor</th>' : ''}<th>Edad</th><th>Estrategia</th><th>Monto</th><th>WhatsApp</th><th>Reunión</th>${yo.rol === 'admin' ? '<th>Encuesta</th>' : ''}<th>Inversión</th></tr></thead><tbody>${filas}</tbody></table></div>` : '<p class="vacio">Sin leads en este período.</p>'}`;
}

/* ---------- Encuestas (solo administradores) ---------- */
function reparto(titulo, lista, opciones) {
  const total = lista.length || 1;
  return `<div class="card"><strong>${esc(titulo)}</strong><div style="margin-top:10px">${opciones.map((o) => {
    const n = lista.filter((x) => String(x) === String(o)).length;
    return `<div style="display:flex;align-items:center;gap:8px;margin:5px 0;font-size:13px"><span style="width:150px;flex:none">${esc(o)}</span><span style="flex:1;background:var(--f);border-radius:6px;height:14px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round((n / total) * 100)}%;background:var(--l)"></i></span><span style="width:52px;text-align:right">${n} · ${Math.round((n / total) * 100)}%</span></div>`;
  }).join('')}</div></div>`;
}

function vistaEncuestas(yo, ver, datos, dias, q) {
  const d = deAsesor(datos, ver), desde = Date.now() - dias * 864e5;
  const res = d.sims.filter((s) => s.encuesta && Date.parse(s.encuesta) >= desde).map((s) => {
    let j = {}; try { j = JSON.parse(s.encuesta_json || '{}'); } catch (e) { /* sin detalle */ }
    return { ...s, j, sat: Number(j.satisfaccion ?? s.satisfaccion), rec: Number(j.recomienda ?? s.recomienda) };
  }).sort((a, b) => Date.parse(b.encuesta) - Date.parse(a.encuesta));
  const n = res.length;
  const prom = n ? (res.reduce((a, x) => a + x.sat, 0) / n).toFixed(1).replace('.', ',') : '—';
  const prom10 = n ? (res.reduce((a, x) => a + x.rec, 0) / n).toFixed(1).replace('.', ',') : '—';
  const pro = res.filter((x) => x.rec >= 9).length, neu = res.filter((x) => x.rec >= 7 && x.rec <= 8).length, det = res.filter((x) => x.rec <= 6).length;
  const nps = n ? Math.round(((pro - det) / n) * 100) : null;
  const todas = res.filter((x) => x.j.dudas === 'Sí, todas').length, avanzar = res.filter((x) => x.j.etapa === 'Quiero avanzar con una inversión').length;
  const tipo = (r) => (r >= 9 ? '<span class="pill ok">Promotor</span>' : r >= 7 ? '<span class="pill">Neutro</span>' : '<span class="pill no">Detractor</span>');
  const filas = res.map((x) => `<tr data-fila><td>${esc(fFecha(x.encuesta))}</td><td><strong>${esc(x.nombre)}</strong><br><small style="color:var(--g)">${esc(x.email)}</small></td>${ver ? '' : `<td>${esc(ASESORES[x.grupo] ? ASESORES[x.grupo].personas.map((a) => a.nombre.split(' ')[0]).join(' y ') : '—')}</td>`}<td>${esc(x.j.quien || '—')}<br><small style="color:var(--g)">${esc(x.j.medio || '')}</small></td><td><strong>${x.sat || '—'}/5</strong></td><td>${esc(x.j.dudas || '—')}</td><td><strong>${Number.isFinite(x.rec) ? x.rec : '—'}/10</strong><br>${Number.isFinite(x.rec) ? tipo(x.rec) : ''}</td><td>${esc(x.j.etapa || '—')}</td><td style="min-width:220px">${esc(x.j.comentario || '')}</td></tr>`).join('');
  return `<h1>Encuestas</h1><p class="sub">Respuestas de la encuesta de experiencia (llega en el correo de agradecimiento después de la reunión). Solo la ven los administradores.</p>
<div class="barra">${selectorPeriodo('encuestas', dias, q)}${selectorAsesor(yo, 'encuestas', dias, ver)}</div>
<div class="kpis">
${kpi(n, 'Respuestas')}
${kpi(prom === '—' ? '—' : prom + '/5', 'Satisfacción con la atención')}
${kpi(nps == null ? '—' : nps, 'NPS', n ? `${pro} promotores · ${neu} neutros · ${det} detractores` : '')}
${kpi(prom10 === '—' ? '—' : prom10 + '/10', 'Recomendaría Pulso Inversor')}
${kpi(pct(todas, n), 'Resolvió todas sus dudas')}
${kpi(avanzar, 'Quieren avanzar con una inversión')}
</div>
${n ? `<div class="grid2" style="margin-top:14px">
${reparto('Satisfacción (1 a 5)', res.map((x) => x.sat), [5, 4, 3, 2, 1])}
${reparto('¿Le resolvieron sus dudas?', res.map((x) => x.j.dudas), ['Sí, todas', 'En parte', 'No'])}
${reparto('¿En qué está hoy?', res.map((x) => x.j.etapa), ['Quiero avanzar con una inversión', 'Lo estoy evaluando', 'Por ahora no'])}
${reparto('¿Cómo lo contactaron?', res.map((x) => x.j.medio), ['WhatsApp', 'Llamada', 'Correo', 'Reunión en la oficina', 'Videollamada'])}
</div>
<h2>Respuestas</h2><input id="buscar" type="search" placeholder="Buscar por nombre, comentario…" style="max-width:420px;margin:0 0 12px">
<div class="tabla"><table><thead><tr><th>Fecha</th><th>Persona</th>${ver ? '' : '<th>Asesor</th>'}<th>Quién lo contactó</th><th>Satisfacción</th><th>Dudas resueltas</th><th>Recomienda</th><th>En qué está</th><th>Comentario</th></tr></thead><tbody>${filas}</tbody></table></div>` : '<p class="vacio" style="margin-top:14px">Sin respuestas en este período.</p>'}`;
}

/* ---------- Recursos de venta ---------- */
const CATEGORIAS = ['Presentaciones', 'Simuladores', 'Páginas para compartir', 'Mensajes para WhatsApp', 'Documentos', 'Capacitación', 'Herramientas internas'];

function recursosBase(a) {
  const yoA = a && a.rol === 'asesor' ? a : null;
  const firma = yoA ? `${yoA.nombre}, asesor${genero(yoA) === 'a' ? 'a' : ''} de inversiones de Pulso Inversor` : '[tu nombre], asesor(a) de inversiones de Pulso Inversor';
  const agenda = yoA && AGENDA_BREVO[yoA.grupo] && AGENDA_BREVO[yoA.grupo][0] ? AGENDA_BREVO[yoA.grupo][0].url : '[tu enlace de agenda]';
  const pag = (titulo, ruta, desc) => ({ categoria: 'Páginas para compartir', titulo, url: SITIO + ruta, descripcion: desc });
  return [
    { categoria: 'Presentaciones', titulo: 'Presentación interactiva de Pulso Inversor', url: PRESENTACION, descripcion: 'Para mostrar en la reunión o enviar después para que la revise con calma.' },
    { categoria: 'Simuladores', titulo: 'Simuladores asistidos', url: SITIO + '/panel/simuladores', descripcion: 'Producción de Capital y Arquitectura de Capital. Se usan junto a la persona, en la reunión. Desde este portal entras sin clave.', soloAbrir: true },
    { categoria: 'Simuladores', titulo: 'Simuladores del sitio', url: SITIO + '/simuladores', descripcion: 'Renta de Capital e Inversión Inmobiliaria Circular. La persona los usa por su cuenta y recibe el PDF por correo.' },
    pag('Cómo funciona', '/como-funciona', 'El modelo explicado paso a paso.'),
    pag('Inversiones', '/inversiones', 'Las estrategias con plazos, tasas y montos mínimos.'),
    pag('Garantías y documentos', '/garantias-y-documentos', 'Qué respalda cada operación y qué documentos firma la persona.'),
    pag('Verifica a Pulso Inversor', '/verifica-a-pulso', 'Datos de la empresa para que la persona los compruebe por su cuenta. Ideal ante dudas de confianza.'),
    pag('Preguntas frecuentes', '/preguntas-frecuentes', 'Respuestas a las dudas más comunes.'),
    pag('Mi primera inversión', '/mi-primera-inversion', 'Para quien nunca ha invertido.'),
    pag('Ya tengo experiencia', '/ya-tengo-experiencia', 'Para quien ya invierte y busca operaciones más grandes.'),
    pag('Nosotros', '/nosotros', 'El equipo y la historia de Pulso Inversor.'),
    { categoria: 'Páginas para compartir', titulo: 'Reseñas en Google', url: RESENAS_GOOGLE, descripcion: 'Pídele una reseña a cada persona que quedó conforme con la reunión.' },
    { categoria: 'Mensajes para WhatsApp', titulo: 'Primer contacto después de Lorenzo', texto: `Hola [nombre], soy ${firma}. Lorenzo me contó que te interesa [estrategia]. ¿Te acomoda que conversemos 30 minutos, por videollamada o en nuestra oficina en Las Condes? Puedes elegir el día y la hora aquí: ${agenda}`, descripcion: 'Úsalo cuando Lorenzo te derive a una persona precalificada.' },
    { categoria: 'Mensajes para WhatsApp', titulo: 'Después de la reunión', texto: `Hola [nombre], gracias por tu tiempo hoy. Te dejo la presentación para que la revises con calma: ${PRESENTACION} Y aquí puedes verificar nuestros datos: ${SITIO}/verifica-a-pulso Quedo atent${yoA ? genero(yoA) : 'o/a'} a tus dudas.`, descripcion: 'Para enviar el mismo día de la reunión.' },
    { categoria: 'Mensajes para WhatsApp', titulo: 'Pedir una reseña', texto: `Hola [nombre], ¿nos ayudarías con una reseña en Google? Toma un minuto y ayuda a otras personas a conocernos: ${RESENAS_GOOGLE} ¡Muchas gracias!`, descripcion: 'Cuando la persona quedó conforme con la atención.' },
    { categoria: 'Herramientas internas', titulo: 'Bandeja de WhatsApp de Pulso Inversor', url: BANDEJA_WHATSAPP, descripcion: 'Aquí conversas con las personas desde el número de Pulso Inversor. Nunca desde tu WhatsApp personal.', soloAbrir: true },
    { categoria: 'Herramientas internas', titulo: 'Embudo de negocios en Brevo', url: 'https://app.brevo.com/crm/deals', descripcion: 'El negocio de cada lead avanza solo: nuevo lead, en conversación, reunión agendada, realizada, invirtió.', soloAbrir: true },
    { categoria: 'Herramientas internas', titulo: 'Mis reuniones en Brevo', url: 'https://app.brevo.com/meetings', descripcion: 'Tu calendario, disponibilidad y tipos de reunión.', soloAbrir: true },
  ];
}

async function recursosExtra(env) {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS recursos (id INTEGER PRIMARY KEY AUTOINCREMENT, creado TEXT, categoria TEXT, titulo TEXT, url TEXT, texto TEXT, descripcion TEXT, autor TEXT)').run().catch(() => {});
  const { results } = await env.DB.prepare('SELECT * FROM recursos ORDER BY creado DESC').all().catch(() => ({ results: [] }));
  return results || [];
}

function tarjetaRecurso(r, admin) {
  const botones = [];
  if (r.url) botones.push(`<a class="btn p peq" href="${esc(r.url)}" target="_blank" rel="noopener">Abrir</a>`);
  if (r.url && !r.soloAbrir) botones.push(`<button class="btn peq" data-copiar="${esc(r.url)}">Copiar enlace</button>`);
  if (r.texto) botones.push(`<button class="btn p peq" data-copiar="${esc(r.texto)}">Copiar mensaje</button>`);
  if (admin && r.id) botones.push(`<form method="post" action="/asesores/recursos/borrar" style="display:inline" onsubmit="return confirm('¿Quitar este recurso?')"><input type="hidden" name="id" value="${r.id}"><button class="btn peq" type="submit">Quitar</button></form>`);
  return `<div class="card rec" data-fila><h3>${esc(r.titulo)}</h3>${r.descripcion ? `<p>${esc(r.descripcion)}</p>` : ''}${r.texto ? `<pre>${esc(r.texto)}</pre>` : ''}<div class="acc">${botones.join(' ')}</div>${r.autor ? `<p style="font-size:12px">Agregado por ${esc(r.autor)} · ${esc(fFecha(r.creado))}</p>` : ''}</div>`;
}

async function vistaRecursos(env, yo, ver) {
  const todos = [...recursosBase(ver || yo), ...(await recursosExtra(env))];
  const admin = yo.rol === 'admin';
  const cats = CATEGORIAS.filter((c) => todos.some((r) => r.categoria === c)).concat([...new Set(todos.map((r) => r.categoria))].filter((c) => !CATEGORIAS.includes(c)));
  let cuerpo = `<h1>Recursos de venta</h1><p class="sub">Todo lo que necesitas para acompañar a cada persona. Los mensajes ya traen tu nombre y tu enlace de agenda: solo completa lo que está entre [corchetes].</p>
<input id="buscar" type="search" placeholder="Buscar recurso…" style="max-width:420px;margin:0 0 6px">`;
  for (const c of cats) cuerpo += `<h2>${esc(c)}</h2><div class="grid2">${todos.filter((r) => r.categoria === c).map((r) => tarjetaRecurso(r, admin)).join('')}</div>`;
  if (admin) cuerpo += `<h2>Agregar un recurso</h2><div class="card"><form method="post" action="/asesores/recursos"><div class="form">
<div><label>Categoría</label><select name="categoria">${CATEGORIAS.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>
<div><label>Título</label><input name="titulo" required maxlength="120"></div>
<div><label>Enlace (Drive, PDF, video, página…)</label><input name="url" type="url" placeholder="https://…" maxlength="600"></div></div>
<div style="margin-top:12px"><label>Mensaje para copiar (opcional, en vez de enlace)</label><textarea name="texto" rows="3" maxlength="2000"></textarea></div>
<div style="margin-top:12px"><label>Para qué sirve</label><input name="descripcion" maxlength="300"></div>
<button class="btn p" type="submit" style="margin-top:14px">Agregar recurso</button></form>
<p style="margin:10px 0 0;font-size:13px;color:var(--g)">Solo los administradores ven este formulario. Los asesores ven el recurso apenas lo agregas.</p></div>`;
  return cuerpo;
}

/* ---------- Acciones ---------- */
async function enviarAcceso(request, env) {
  const f = await request.formData();
  const email = String(f.get('email') || '').trim().toLowerCase();
  const p = persona(email);
  if (p && env.FIRMA_SEGUIMIENTO) {
    const t = await sellar(env, 'acc', p.email, 20 * 60e3);
    const enlace = `${SITIO}/asesores/acceso?t=${encodeURIComponent(t)}`;
    await brevo(env, {
      sender: { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER }, to: [{ email: p.email, name: p.nombre }],
      subject: 'Tu enlace para entrar al portal de asesores',
      htmlContent: plantilla({
        preheader: 'Entra al portal de asesores de Pulso Inversor. El enlace vale 20 minutos.',
        eyebrow: 'Portal de asesores', titulo: `Hola ${esc(p.nombre.split(' ')[0])}, aquí está tu acceso`,
        cuerpo: P('Toca el botón para entrar al portal de asesores. El enlace vale <strong>20 minutos</strong> y tu sesión queda abierta 30 días en este dispositivo.')
          + P('Si no pediste este enlace, ignora este correo.'),
        botones: boton('Entrar al portal', enlace),
        pie: 'Acceso interno del equipo de Pulso Inversor.',
      }),
      tags: ['portal-asesores'],
    }, p.email).catch((e) => console.error('acceso asesores', e.message));
  } else await new Promise((r) => setTimeout(r, 600));
  return pantallaLogin('Si tu correo está registrado, te enviamos un enlace para entrar. Revisa tu bandeja de entrada (y la de spam).');
}

async function acceso(env, url) {
  const p = await abrir(env, url.searchParams.get('t'), 'acc');
  if (!p) return pantallaLogin('El enlace venció o no es válido. Pide uno nuevo.', true);
  const ses = await sellar(env, 'ses', p.email, 30 * 864e5);
  return ir('/asesores', { 'set-cookie': `asesor_ses=${encodeURIComponent(ses)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}` });
}

async function confirmarDesdePortal(env, yo, url) {
  const rid = parseInt(url.searchParams.get('rid'), 10), r = url.searchParams.get('r') === 'no' ? 'no' : 'si';
  const rec = await env.DB.prepare('SELECT * FROM recordatorios WHERE id = ?').bind(rid).first();
  if (!rec || (yo.rol !== 'admin' && asesorDe(rec) !== yo.nombre)) return ir('/asesores?v=reuniones');
  const { firmar } = await import('./seguimiento.js');
  return ir(`/seguimiento/reunion?r=${r}&t=${encodeURIComponent(await firmar(env, { rid, f: Date.now() }))}`);
}

async function invirtio(request, env, yo) {
  const f = await request.formData();
  const id = parseInt(f.get('id'), 10);
  const s = await env.DB.prepare('SELECT id, grupo FROM simulaciones WHERE id = ?').bind(id).first();
  if (s && (yo.rol === 'admin' || Number(s.grupo) === yo.grupo)) {
    const { registrarInversion } = await import('./panel.js');
    await registrarInversion(env, id);
  }
  const volver = String(f.get('volver') || '');
  return ir(volver.startsWith('/asesores') ? volver : '/asesores?v=leads');
}

async function agregarRecurso(request, env, yo) {
  const f = await request.formData();
  const v = (k, n) => String(f.get(k) || '').trim().slice(0, n);
  const url = v('url', 600), texto = v('texto', 2000), titulo = v('titulo', 120);
  const categoria = CATEGORIAS.includes(v('categoria', 60)) ? v('categoria', 60) : 'Documentos';
  if (titulo && (texto || /^https?:\/\/\S+$/i.test(url))) {
    await recursosExtra(env);
    await env.DB.prepare('INSERT INTO recursos (creado, categoria, titulo, url, texto, descripcion, autor) VALUES (?,?,?,?,?,?,?)')
      .bind(new Date().toISOString(), categoria, titulo, /^https?:\/\//i.test(url) ? url : '', texto, v('descripcion', 300), yo.nombre).run();
  }
  return ir('/asesores?v=recursos');
}

/* ---------- Rutas ---------- */
export async function rutaAsesores(request, env, url) {
  const p = url.pathname, m = request.method;
  if (p === '/asesores/entrar' && m === 'POST') return enviarAcceso(request, env);
  if (p === '/asesores/acceso') return acceso(env, url);
  if (p === '/asesores/salir') return ir('/asesores', { 'set-cookie': 'asesor_ses=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' });
  const yo = await sesionAsesor(request, env);
  if (!yo) return pantallaLogin();
  if (p === '/asesores/reunion') return confirmarDesdePortal(env, yo, url);
  if (p === '/asesores/invirtio' && m === 'POST') return invirtio(request, env, yo);
  if (p === '/asesores/recursos' && m === 'POST' && yo.rol === 'admin') return agregarRecurso(request, env, yo);
  if (p === '/asesores/recursos/borrar' && m === 'POST' && yo.rol === 'admin') {
    const f = await request.formData();
    await env.DB.prepare('DELETE FROM recursos WHERE id = ?').bind(parseInt(f.get('id'), 10)).run().catch(() => {});
    return ir('/asesores?v=recursos');
  }
  if (p.startsWith('/asesores/noticias/') && yo.rol === 'admin') { const r = await rutaNoticiasAdmin(request, env, url, yo); if (r) return r; }
  const vistas = ['inicio', 'reuniones', 'leads', 'recursos', ...(yo.rol === 'admin' ? ['encuestas', 'noticias'] : [])];
  const vista = vistas.includes(url.searchParams.get('v')) ? url.searchParams.get('v') : 'inicio';
  const dias = [7, 30, 90, 365].includes(Number(url.searchParams.get('dias'))) ? Number(url.searchParams.get('dias')) : 30;
  // Un asesor solo se ve a sí mismo; un administrador elige (vacío = todo el equipo).
  const ver = yo.rol === 'asesor' ? yo : ASESORES_PORTAL.find((a) => a.email === url.searchParams.get('ver')) || null;
  const q = yo.rol === 'admin' && ver ? '&ver=' + encodeURIComponent(ver.email) : '';
  if (vista === 'recursos') return marco(yo, vista, await vistaRecursos(env, yo, ver), q);
  if (vista === 'noticias') return marco(yo, vista, await vistaNoticiasAdmin(env, yo, url), q);
  const datos = await cargar(env);
  const cuerpo = vista === 'reuniones' ? vistaReuniones(yo, ver, datos, dias, q) : vista === 'leads' ? vistaLeads(yo, ver, datos, dias, q) : vista === 'encuestas' ? vistaEncuestas(yo, ver, datos, dias, q) : vistaInicio(yo, ver, datos, dias, q);
  return marco(yo, vista, cuerpo, q + (dias !== 30 ? '&dias=' + dias : ''));
}
