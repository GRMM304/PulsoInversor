// Landing de diagnóstico · diagnostico.pulsoinversor.cl (QR del video FFW)
// - Sirve la página (carpeta public/).
// - POST /api/diagnostico: recalcula el diagnóstico con la misma lógica de la página, lo guarda en D1 y devuelve el folio.
// - POST /api/whatsapp: marca que la persona abrió WhatsApp desde el resultado (y la duda que escribió).
// - /panel: lista de diagnósticos para el equipo (estado, asignado y nota editables). Usuario: pulso, clave: secreto CLAVE_PANEL.
// - /panel/diagnosticos.csv: descarga completa.
import { CAPITALES, PREGUNTAS, SOLUCIONES, diagnosticar } from '../public/assets/js/logica.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const corta = (v, n) => String(v ?? '').trim().slice(0, n);

const CONSENTIMIENTO_TEXTO = 'Autorizo a Pulso Inversor y a las empresas de Grupo MatchMaking a guardar mis respuestas para darme este diagnóstico y atenderme si los contacto, según la Política de Privacidad.';
const ESTADOS = ['Nuevo', 'Escribió por WhatsApp', 'Reunión agendada', 'Oportunidad', 'Cerrado', 'Descartado'];
const IDS = PREGUNTAS.map((p) => p.id);

async function guardar(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'Datos inválidos' }, 400); }
  if (b.sitio) return json({ ok: true }); // trampa para robots
  const r = { capital: b.capital };
  IDS.forEach((id) => { r[id] = b[id]; });
  const diag = diagnosticar(r);
  const nombre = corta(b.nombre, 120);
  const edad = parseInt(b.edad, 10);
  if (!diag || nombre.length < 2 || !(edad >= 18 && edad <= 99) || b.consentimiento !== 'Sí') return json({ ok: false, error: 'Faltan datos' }, 400);

  const fila = {
    nombre, edad, capital: r.capital, ...Object.fromEntries(IDS.map((id) => [id, r[id]])),
    perfil: diag.perfil, puntaje: diag.puntaje, resultado: diag.estado,
    solucion: diag.principal ? SOLUCIONES[diag.principal].nombre : '',
    alternativa: diag.alternativa ? SOLUCIONES[diag.alternativa].nombre : '',
    alertas: diag.alertas.join(' | '),
    asesor_sugerido: edad <= 40 ? 'Renato Vargas' : 'Pamela Herrera',
    consentimiento: 'Sí', consentimiento_texto: CONSENTIMIENTO_TEXTO, consentimiento_fecha: new Date().toISOString(),
    acepta_publicidad: b.acepta_publicidad === 'Sí' ? 'Sí' : 'No',
    utm_source: corta(b.utm_source, 120), utm_medium: corta(b.utm_medium, 120), utm_campaign: corta(b.utm_campaign, 160), utm_content: corta(b.utm_content, 160), utm_term: corta(b.utm_term, 160),
    pagina: corta(b.pagina, 400), ip_pais: request.cf?.country || '',
  };
  const cols = Object.keys(fila);
  const res = await env.DB.prepare(`INSERT INTO diagnosticos (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).bind(...cols.map((c) => fila[c])).run();
  return json({ ok: true, folio: res.meta.last_row_id });
}

async function marcarWhatsApp(request, env) {
  let b;
  try { b = JSON.parse(await request.text()); } catch { return json({ ok: false }, 400); }
  const folio = parseInt(b.folio, 10);
  if (!(folio > 0)) return json({ ok: false }, 400);
  await env.DB.prepare(`UPDATE diagnosticos SET whatsapp_clic = COALESCE(whatsapp_clic, ?), duda = CASE WHEN ? <> '' THEN ? ELSE duda END,
      estado = CASE WHEN estado = 'Nuevo' THEN 'Escribió por WhatsApp' ELSE estado END WHERE id = ?`)
    .bind(new Date().toISOString(), corta(b.duda, 400), corta(b.duda, 400), folio).run();
  return json({ ok: true });
}

// ---------- Panel ----------
function autorizado(request, env) {
  const h = request.headers.get('authorization') || '';
  if (!env.CLAVE_PANEL || !h.startsWith('Basic ')) return false;
  let txt = '';
  try { txt = atob(h.slice(6)); } catch { return false; }
  const i = txt.indexOf(':');
  return txt.slice(0, i) === 'pulso' && txt.slice(i + 1) === env.CLAVE_PANEL;
}
const pedirClave = () => new Response('Acceso restringido', { status: 401, headers: { 'www-authenticate': 'Basic realm="Panel Pulso Diagnostico", charset="UTF-8"', 'cache-control': 'no-store' } });

const COLS = ['id', 'creado', 'nombre', 'edad', 'capital', ...IDS, 'perfil', 'puntaje', 'resultado', 'solucion', 'alternativa', 'alertas', 'asesor_sugerido',
  'whatsapp_clic', 'duda', 'estado', 'asignado', 'nota', 'actualizado', 'consentimiento_fecha', 'acepta_publicidad', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

async function csv(env) {
  const { results } = await env.DB.prepare(`SELECT ${COLS.join(',')} FROM diagnosticos ORDER BY id DESC`).all();
  const cel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const cuerpo = '﻿' + [COLS.join(';'), ...results.map((r) => COLS.map((c) => cel(r[c])).join(';'))].join('\r\n');
  return new Response(cuerpo, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="diagnosticos-pulso.csv"', 'cache-control': 'no-store' } });
}

async function actualizar(request, env) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: 'Datos inválidos' }, 400); }
  const id = parseInt(b.id, 10);
  const estado = ESTADOS.includes(b.estado) ? b.estado : '';
  if (!(id > 0) || !estado) return json({ ok: false, error: 'Datos inválidos' }, 400);
  const actualizado = new Date().toISOString();
  const r = await env.DB.prepare('UPDATE diagnosticos SET estado = ?, asignado = ?, nota = ?, actualizado = ? WHERE id = ?')
    .bind(estado, corta(b.asignado, 80), corta(b.nota, 1000), actualizado, id).run();
  if (!r.meta.changes) return json({ ok: false, error: 'No existe' }, 404);
  return json({ ok: true, actualizado });
}

async function panel(request, env) {
  const url = new URL(request.url);
  const fEstado = ESTADOS.includes(url.searchParams.get('estado')) ? url.searchParams.get('estado') : '';
  const { results: todos } = await env.DB.prepare(`SELECT ${COLS.join(',')} FROM diagnosticos ORDER BY id DESC LIMIT 2000`).all();
  const lista = todos.filter((r) => !fEstado || r.estado === fEstado);
  const cuenta = (fn) => todos.filter(fn).length;
  const fecha = (v) => (v ? new Date(v).toLocaleString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
  const chip = (txt, n, est) => `<a class="chip${fEstado === est ? ' on' : ''}" href="/panel${est ? '?estado=' + encodeURIComponent(est) : ''}">${esc(txt)} <b>${n}</b></a>`;
  const filas = lista.map((r) => `<tr data-id="${r.id}">
<td><b>#${r.id}</b><br><small>${esc(fecha(r.creado))}</small></td>
<td><b>${esc(r.nombre)}</b><br><small>${esc(r.edad)} años · ${esc(r.asesor_sugerido)}</small></td>
<td>${esc(r.capital)}</td>
<td><b>${esc(r.perfil)}</b> <small>(${esc(r.puntaje)} pts)</small></td>
<td>${r.solucion ? `<b>${esc(r.solucion)}</b>${r.alternativa ? `<br><small>Alt.: ${esc(r.alternativa)}</small>` : ''}` : `<span class="no">${r.resultado === 'bajo-minimo' ? 'Bajo el mínimo' : 'No recomendado (plazo)'}</span>`}</td>
<td class="det"><details><summary>Ver respuestas</summary>${IDS.map((id) => `<div><small>${esc(PREGUNTAS.find((p) => p.id === id).corto)}:</small> ${esc(r[id])}</div>`).join('')}${r.alertas ? `<div class="al">${esc(r.alertas)}</div>` : ''}</details></td>
<td>${r.whatsapp_clic ? `<span class="si">Abrió WhatsApp</span><br><small>${esc(fecha(r.whatsapp_clic))}</small>` : '<small>No</small>'}${r.duda ? `<div class="duda">«${esc(r.duda)}»</div>` : ''}</td>
<td><select name="estado" aria-label="Estado">${ESTADOS.map((e) => `<option${e === r.estado ? ' selected' : ''}>${e}</option>`).join('')}</select></td>
<td><input name="asignado" value="${esc(r.asignado)}" placeholder="Quién lo toma" aria-label="Asignado" maxlength="80"></td>
<td><textarea name="nota" rows="2" placeholder="Nota" aria-label="Nota" maxlength="1000">${esc(r.nota)}</textarea></td>
<td><button type="button" class="guardar">Guardar</button><small class="msg">${r.actualizado ? 'Act. ' + esc(fecha(r.actualizado)) : ''}</small></td>
</tr>`).join('');

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Panel · Diagnósticos Pulso</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#f4f6f2;color:#0E2C28}
header{background:#0E2C28;color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
header b{color:#C7D95D;font-size:18px}
a.btn{background:#C7D95D;color:#0E2C28;padding:10px 16px;border-radius:999px;font-weight:700;text-decoration:none}
.kpis{display:flex;gap:10px;flex-wrap:wrap;padding:16px 22px 0}
.kpi{background:#fff;border-radius:12px;padding:12px 16px;min-width:120px;border:1px solid #dfe5dc}.kpi b{display:block;font-size:24px}.kpi span{font-size:12px;color:#5b6b62;text-transform:uppercase}
.filtros{padding:14px 22px;display:flex;gap:8px;flex-wrap:wrap}
.chip{background:#fff;border:1px solid #cdd6cf;border-radius:999px;padding:6px 12px;color:#0E2C28;text-decoration:none;font-size:14px}.chip.on{background:#0E2C28;color:#fff;border-color:#0E2C28}
main{padding:0 22px 30px;overflow-x:auto}
table{border-collapse:collapse;background:#fff;width:100%;font-size:14px;min-width:1350px}
th,td{padding:9px 10px;border-bottom:1px solid #e3e8e2;text-align:left;vertical-align:top}
th{background:#123D35;color:#fff;font-size:12px;text-transform:uppercase;position:sticky;top:0}
td small{color:#5b6b62}
.si{color:#1b7a3d;font-weight:700}.no{color:#9a5b00;font-weight:700}
.det{max-width:300px}.det summary{cursor:pointer;color:#1d5248;font-weight:600}.det div{margin-top:4px}.al{color:#9a5b00;font-size:13px}
.duda{margin-top:6px;font-style:italic;max-width:220px}
select,input,textarea{font:inherit;font-size:13px;padding:6px;border:1px solid #c9d3cb;border-radius:8px;width:100%;min-width:120px}
textarea{min-width:170px}
button.guardar{background:#0E2C28;color:#fff;border:0;border-radius:999px;padding:8px 14px;font-weight:700;cursor:pointer}
.msg{display:block;margin-top:4px}
</style></head>
<body><header><div><b>Diagnósticos · diagnostico.pulsoinversor.cl</b><br><small>${todos.length} diagnósticos · ${cuenta((r) => r.whatsapp_clic)} abrieron WhatsApp</small></div><a class="btn" href="/panel/diagnosticos.csv">Descargar CSV</a></header>
<div class="kpis">
${['Renta de Capital', 'Hipoteca Inteligente', 'Arquitectura de Capital'].map((s) => `<div class="kpi"><b>${cuenta((r) => r.solucion === s)}</b><span>${s}</span></div>`).join('')}
<div class="kpi"><b>${cuenta((r) => !r.solucion)}</b><span>Sin solución hoy</span></div>
${CAPITALES.slice(2).map((c) => `<div class="kpi"><b>${cuenta((r) => r.capital === c)}</b><span>${esc(c)}</span></div>`).join('')}
</div>
<div class="filtros">${chip('Todos', todos.length, '')}${ESTADOS.map((e) => chip(e, cuenta((r) => r.estado === e), e)).join('')}</div>
<main><table><thead><tr><th>Folio</th><th>Persona</th><th>Capital</th><th>Perfil</th><th>Solución</th><th>Respuestas</th><th>WhatsApp</th><th>Estado</th><th>Asignado</th><th>Nota</th><th></th></tr></thead>
<tbody>${filas || '<tr><td colspan="11">No hay diagnósticos con este filtro.</td></tr>'}</tbody></table></main>
<script>
document.querySelectorAll('button.guardar').forEach(function(b){b.addEventListener('click',function(){
  var tr=b.closest('tr'),msg=tr.querySelector('.msg');
  var d={id:tr.getAttribute('data-id'),estado:tr.querySelector('[name=estado]').value,asignado:tr.querySelector('[name=asignado]').value,nota:tr.querySelector('[name=nota]').value};
  b.disabled=true;msg.textContent='Guardando…';
  fetch('/panel/actualizar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d),credentials:'same-origin'})
   .then(function(r){return r.json()}).then(function(j){if(!j.ok)throw 0;msg.textContent='Guardado';})
   .catch(function(){msg.textContent='No se pudo guardar'}).finally(function(){b.disabled=false});
});});
</script></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ruta = url.pathname.replace(/\/+$/, '') || '/';
    if (ruta === '/api/diagnostico') return request.method === 'POST' ? guardar(request, env) : json({ ok: false }, 405);
    if (ruta === '/api/whatsapp') return request.method === 'POST' ? marcarWhatsApp(request, env) : json({ ok: false }, 405);
    if (ruta === '/panel' || ruta.startsWith('/panel/')) {
      if (!autorizado(request, env)) return pedirClave();
      if (ruta === '/panel') return panel(request, env);
      if (ruta === '/panel/diagnosticos.csv') return csv(env);
      if (ruta === '/panel/actualizar' && request.method === 'POST') return actualizar(request, env);
      return new Response('No encontrado', { status: 404, headers: { 'cache-control': 'no-store' } });
    }
    return env.ASSETS.fetch(request);
  },
};
