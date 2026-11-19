// Informe semanal de Pulso Inversor: lunes a las 10:00 (hora de Chile), por Brevo, a INFORME_PARA.
// Junta la semana anterior (lunes a domingo) y la compara con la previa:
//  - Windsor.ai (secreto WINDSOR_API_KEY): Meta Ads, Google Analytics 4, Search Console, Instagram y cualquier
//    otra fuente de FUENTES. Entra toda cuenta cuyo nombre o ID diga "pulso" (o esté en CUENTAS_EXTRA), así que
//    una cuenta nueva agregada en Windsor se suma sola al informe.
//  - Datos propios del sitio (D1): simulaciones, agenda, reuniones de Brevo, encuestas.
// Se registra en la tabla informes para no enviarlo dos veces. Prueba manual: /panel/informe (con la clave del panel).
import { DEFAULT_SENDER, C, FUENTE, esc, clp, brevo, plantilla } from './comun.js';

export const INFORME_PARA = ['aorrego@grupomm.cl'];
const ZONA = 'America/Santiago';
const WINDSOR = 'https://connectors.windsor.ai';

// Cuentas de Pulso que no dicen "pulso" en el nombre (por ID).
const CUENTAS_EXTRA = ['497913538'];
const esDePulso = (r) => /pulso/i.test(`${r.account_name || ''} ${r.account_id || ''}`) || CUENTAS_EXTRA.includes(String(r.account_id || ''));

// ---------- Fechas ----------
function partesChile(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour) % 24, minuto: Number(p.minute), dia: p.weekday };
}
const sumarDias = (iso, n) => new Date(Date.parse(iso + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const corta = (iso) => `${Number(iso.slice(8))} ${MESES[Number(iso.slice(5, 7)) - 1]}`;

// Semana anterior completa (lunes a domingo) respecto de la fecha de Chile dada.
export function semanas(hoy = partesChile().fecha) {
  const dow = (new Date(hoy + 'T12:00:00Z').getUTCDay() + 6) % 7; // 0 = lunes
  const desde = sumarDias(hoy, -dow - 7), hasta = sumarDias(desde, 6);
  return { desde, hasta, antDesde: sumarDias(desde, -7), antHasta: sumarDias(desde, -1) };
}

// ---------- Windsor.ai ----------
async function windsor(env, conector, campos, desde, hasta) {
  const u = new URL(`${WINDSOR}/${conector}`);
  u.searchParams.set('api_key', env.WINDSOR_API_KEY);
  u.searchParams.set('date_from', desde);
  u.searchParams.set('date_to', hasta);
  u.searchParams.set('fields', ['account_name', 'account_id', ...campos].join(','));
  const r = await fetch(u, { headers: { accept: 'application/json' } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${conector} ${r.status}: ${t.slice(0, 160)}`);
  let j; try { j = JSON.parse(t); } catch (e) { throw new Error(`${conector}: respuesta no es JSON`); }
  const filas = Array.isArray(j) ? j : (j.data || j.result || []);
  return filas.filter(esDePulso);
}
const num = (v) => Number(v) || 0;
const suma = (filas, c) => filas.reduce((s, r) => s + num(r[c]), 0);
function agrupar(filas, clave, cols) {
  const m = new Map();
  for (const r of filas) {
    const k = r[clave] || '(sin nombre)';
    const a = m.get(k) || Object.fromEntries([[clave, k], ...cols.map((c) => [c, 0])]);
    for (const c of cols) a[c] += num(r[c]);
    m.set(k, a);
  }
  return [...m.values()];
}
const cuentasDe = (filas) => [...new Set(filas.map((r) => r.account_name || r.account_id).filter(Boolean))];

// Cada fuente: qué pedir y cómo resumirla. Una fuente sin cuentas de Pulso en Windsor no aparece.
const FUENTES = {
  meta: {
    nombre: 'Meta Ads', conector: 'facebook',
    campos: ['campaign', 'spend', 'impressions', 'reach', 'link_clicks', 'actions_onsite_conversion_messaging_conversation_started_7d', 'actions_offsite_conversion_fb_pixel_lead', 'actions_lead'],
  },
  ga4: { nombre: 'Google Analytics 4', conector: 'googleanalytics4', campos: ['session_default_channel_group', 'active_users', 'sessions', 'screen_page_views'] },
  ga4Eventos: { nombre: 'Google Analytics 4 · eventos', conector: 'googleanalytics4', campos: ['event_name', 'event_count'] },
  ga4Paginas: { nombre: 'Google Analytics 4 · páginas', conector: 'googleanalytics4', campos: ['page_path', 'screen_page_views'] },
  gsc: { nombre: 'Search Console', conector: 'searchconsole', campos: ['query', 'clicks', 'impressions', 'position'] },
  instagram: { nombre: 'Instagram', conector: 'instagram', campos: ['date', 'reach', 'profile_views', 'website_clicks', 'follower_count_1d'] },
};

async function traer(env, s) {
  const out = {}, errores = [];
  await Promise.all(Object.entries(FUENTES).map(async ([k, f]) => {
    try {
      const [a, b] = await Promise.all([windsor(env, f.conector, f.campos, s.desde, s.hasta), windsor(env, f.conector, f.campos, s.antDesde, s.antHasta)]);
      out[k] = { a, b };
    } catch (e) {
      out[k] = { a: [], b: [] };
      if (!/no .*account|not configured|No .* accounts/i.test(e.message)) errores.push(`${f.nombre}: ${e.message}`);
    }
  }));
  return { out, errores };
}

// ---------- Datos propios (D1) ----------
async function propios(env, s) {
  const rango = (d, h) => [`${d}T03:00:00.000Z`, `${sumarDias(h, 1)}T03:00:00.000Z`]; // Chile ≈ UTC−3
  const q = async (d, h) => {
    const [i, f] = rango(d, h);
    const sim = await env.DB.prepare(`SELECT COUNT(*) n, COALESCE(SUM(monto),0) monto, SUM(agenda_click IS NOT NULL) agenda, SUM(agendado IS NOT NULL) agendadas, SUM(contactado_click IS NOT NULL) contactados, SUM(encuesta IS NOT NULL) encuestas, AVG(satisfaccion) satisf FROM simulaciones WHERE creado >= ? AND creado < ?`).bind(i, f).first();
    const tipos = (await env.DB.prepare(`SELECT tipo, COUNT(*) n FROM simulaciones WHERE creado >= ? AND creado < ? GROUP BY tipo ORDER BY n DESC`).bind(i, f).all()).results || [];
    const asesores = (await env.DB.prepare(`SELECT COALESCE(asesor,'—') asesor, COUNT(*) n FROM simulaciones WHERE creado >= ? AND creado < ? GROUP BY asesor ORDER BY n DESC`).bind(i, f).all()).results || [];
    const reu = await env.DB.prepare(`SELECT SUM(evento='reservada') reservadas, SUM(evento='cancelada') canceladas, SUM(evento='iniciada') iniciadas FROM reuniones WHERE recibido >= ? AND recibido < ?`).bind(i, f).first();
    return { sim, tipos, asesores, reu };
  };
  return { a: await q(s.desde, s.hasta), b: await q(s.antDesde, s.antHasta) };
}

// ---------- HTML ----------
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('es-CL', { maximumFractionDigits: d, minimumFractionDigits: d });
function delta(a, b) {
  if (!b && !a) return `<span style="color:${C.gris}">—</span>`;
  if (!b) return `<span style="color:${C.verde2}">nuevo</span>`;
  const p = (a - b) / b * 100;
  const col = p > 0.5 ? '#1E7A46' : p < -0.5 ? '#B4442C' : C.gris;
  return `<span style="color:${col}">${p > 0 ? '▲' : p < 0 ? '▼' : '='} ${fmt(Math.abs(p))} %</span>`;
}
const H2 = (t, sub = '') => `<h2 style="margin:28px 0 4px;font-size:19px;color:${C.verde}">${esc(t)}</h2>${sub ? `<p style="margin:0 0 10px;font-size:13px;color:${C.gris}">${sub}</p>` : ''}`;
function tabla(cab, filas, alin) {
  const th = cab.map((c, i) => `<th align="${alin[i] || 'left'}" style="padding:8px 10px;font-size:12px;color:${C.gris};font-weight:bold;border-bottom:2px solid ${C.borde};text-transform:uppercase;letter-spacing:.5px">${esc(c)}</th>`).join('');
  const tr = filas.map((f) => `<tr>${f.map((v, i) => `<td align="${alin[i] || 'left'}" style="padding:8px 10px;font-size:14px;color:${C.texto};border-bottom:1px solid ${C.borde}">${v}</td>`).join('')}</tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:${FUENTE};margin:0 0 6px"><tr>${th}</tr>${tr}</table>`;
}
function tarjetas(items) {
  const celdas = items.map(([t, v, d]) => `<td width="33%" valign="top" style="padding:6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-radius:12px"><tr><td style="padding:14px 14px 12px;font-family:${FUENTE}"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.gris};font-weight:bold">${esc(t)}</div><div style="font-size:22px;font-weight:bold;color:${C.verde};margin:4px 0 2px">${v}</div><div style="font-size:12px">${d}</div></td></tr></table></td>`);
  let html = '';
  for (let i = 0; i < celdas.length; i += 3) html += `<tr>${celdas.slice(i, i + 3).join('')}</tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px -6px 4px">${html}</table>`;
}
const nada = (t) => `<p style="margin:0 0 6px;font-size:14px;color:${C.gris}">${t}</p>`;

export async function armarInforme(env, s = semanas()) {
  const { out, errores } = await traer(env, s);
  const own = await propios(env, s);
  const cuentas = {};
  const secciones = [];

  // Meta Ads
  const m = out.meta;
  const conv = (f) => suma(f, 'actions_onsite_conversion_messaging_conversation_started_7d');
  const leads = (f) => suma(f, 'actions_offsite_conversion_fb_pixel_lead') || suma(f, 'actions_lead');
  const gastoA = suma(m.a, 'spend'), gastoB = suma(m.b, 'spend');
  const resA = conv(m.a) + leads(m.a), resB = conv(m.b) + leads(m.b);
  if (m.a.length || m.b.length) {
    cuentas['Meta Ads'] = cuentasDe([...m.a, ...m.b]);
    const camp = agrupar(m.a, 'campaign', ['spend', 'impressions', 'link_clicks', 'actions_onsite_conversion_messaging_conversation_started_7d', 'actions_offsite_conversion_fb_pixel_lead', 'actions_lead']).sort((x, y) => y.spend - x.spend);
    secciones.push(H2('Meta Ads', 'Gasto, alcance y resultados por campaña.') + (camp.length ? tabla(['Campaña', 'Gasto', 'Clics', 'WhatsApp', 'Leads', 'Costo/res.'], camp.map((c) => {
      const r = c.actions_onsite_conversion_messaging_conversation_started_7d + (c.actions_offsite_conversion_fb_pixel_lead || c.actions_lead);
      return [esc(c.campaign), clp(c.spend), fmt(c.link_clicks), fmt(c.actions_onsite_conversion_messaging_conversation_started_7d), fmt(c.actions_offsite_conversion_fb_pixel_lead || c.actions_lead), r ? clp(c.spend / r) : '—'];
    }), ['left', 'right', 'right', 'right', 'right', 'right']) : nada('Sin campañas activas esta semana.')));
  }

  // GA4
  const g = out.ga4;
  const usA = suma(g.a, 'active_users'), usB = suma(g.b, 'active_users');
  if (g.a.length || g.b.length) {
    cuentas['Google Analytics 4'] = cuentasDe([...g.a, ...g.b]);
    const canales = agrupar(g.a, 'session_default_channel_group', ['sessions', 'active_users']).sort((x, y) => y.sessions - x.sessions).slice(0, 6);
    const ev = agrupar(out.ga4Eventos.a, 'event_name', ['event_count']);
    const evB = agrupar(out.ga4Eventos.b, 'event_name', ['event_count']);
    const NOMBRES = { generate_lead: 'Datos en simuladores (lead)', simulacion_enviada: 'Simulaciones enviadas', contacto_whatsapp: 'Clics a WhatsApp', chat_lorenzo: 'Chats con Lorenzo', agendar_reunion: 'Clics en Agendar', instalar_app: 'Instalaciones de la app' };
    const filasEv = Object.entries(NOMBRES).map(([k, n]) => { const a = (ev.find((e) => e.event_name === k) || {}).event_count || 0, b = (evB.find((e) => e.event_name === k) || {}).event_count || 0; return [n, fmt(a), delta(a, b)]; });
    const pags = agrupar(out.ga4Paginas.a, 'page_path', ['screen_page_views']).sort((x, y) => y.screen_page_views - x.screen_page_views).slice(0, 6);
    secciones.push(H2('Sitio web (Google Analytics)', `${fmt(usA)} usuarios · ${fmt(suma(g.a, 'sessions'))} sesiones · ${fmt(suma(g.a, 'screen_page_views'))} páginas vistas`)
      + tabla(['Acción en el sitio', 'Semana', 'vs. anterior'], filasEv, ['left', 'right', 'right'])
      + (canales.length ? `<p style="margin:14px 0 4px;font-size:13px;font-weight:bold;color:${C.verde}">De dónde llegan</p>` + tabla(['Canal', 'Sesiones', 'Usuarios'], canales.map((c) => [esc(c.session_default_channel_group), fmt(c.sessions), fmt(c.active_users)]), ['left', 'right', 'right']) : '')
      + (pags.length ? `<p style="margin:14px 0 4px;font-size:13px;font-weight:bold;color:${C.verde}">Páginas más vistas</p>` + tabla(['Página', 'Vistas'], pags.map((p) => [esc(p.page_path), fmt(p.screen_page_views)]), ['left', 'right']) : ''));
  }

  // Search Console
  const sc = out.gsc;
  if (sc.a.length || sc.b.length) {
    cuentas['Search Console'] = cuentasDe([...sc.a, ...sc.b]);
    const clA = suma(sc.a, 'clicks'), imA = suma(sc.a, 'impressions');
    const qs = agrupar(sc.a, 'query', ['clicks', 'impressions']).sort((x, y) => y.clicks - x.clicks || y.impressions - x.impressions).slice(0, 8);
    secciones.push(H2('Google (búsqueda orgánica)', `${fmt(clA)} clics ${delta(clA, suma(sc.b, 'clicks'))} · ${fmt(imA)} impresiones ${delta(imA, suma(sc.b, 'impressions'))}`)
      + (qs.length ? tabla(['Búsqueda', 'Clics', 'Impresiones'], qs.map((x) => [esc(x.query), fmt(x.clicks), fmt(x.impressions)]), ['left', 'right', 'right']) : nada('Aún sin búsquedas registradas.')));
  }

  // Instagram
  const ig = out.instagram;
  if (ig.a.length || ig.b.length) {
    cuentas.Instagram = cuentasDe([...ig.a, ...ig.b]);
    const f = (k) => [fmt(suma(ig.a, k)), delta(suma(ig.a, k), suma(ig.b, k))];
    secciones.push(H2('Instagram') + tabla(['Métrica', 'Semana', 'vs. anterior'], [['Alcance', ...f('reach')], ['Visitas al perfil', ...f('profile_views')], ['Clics al sitio', ...f('website_clicks')], ['Seguidores nuevos', ...f('follower_count_1d')]], ['left', 'right', 'right']));
  }

  // Datos propios del sitio
  const A = own.a, B = own.b;
  secciones.push(H2('Simulaciones y reuniones', 'Datos propios del sitio: simulaciones enviadas, agenda con asesores y encuestas.')
    + tabla(['Indicador', 'Semana', 'vs. anterior'], [
      ['Simulaciones enviadas', fmt(A.sim.n), delta(A.sim.n, B.sim.n)],
      ['Monto simulado', clp(A.sim.monto), delta(A.sim.monto, B.sim.monto)],
      ['Abrieron la agenda', fmt(A.sim.agenda), delta(A.sim.agenda, B.sim.agenda)],
      ['Reuniones agendadas (Brevo)', fmt(A.reu.reservadas), delta(A.reu.reservadas, B.reu.reservadas)],
      ['Reuniones canceladas', fmt(A.reu.canceladas), delta(A.reu.canceladas, B.reu.canceladas)],
      ['Reuniones realizadas', fmt(A.reu.iniciadas), delta(A.reu.iniciadas, B.reu.iniciadas)],
      ['Encuestas respondidas', fmt(A.sim.encuestas), delta(A.sim.encuestas, B.sim.encuestas)],
    ], ['left', 'right', 'right'])
    + (A.tipos.length ? `<p style="margin:14px 0 4px;font-size:13px;font-weight:bold;color:${C.verde}">Por simulador y asesor</p>` + tabla(['Simulador', 'N.º'], A.tipos.map((t) => [esc(t.tipo), fmt(t.n)]), ['left', 'right']) + tabla(['Asesor asignado', 'N.º'], A.asesores.map((t) => [esc(t.asesor), fmt(t.n)]), ['left', 'right']) : ''));

  // Resumen arriba
  const resumen = tarjetas([
    ['Inversión Meta', gastoA ? clp(gastoA) : '$0', delta(gastoA, gastoB)],
    ['Resultados Meta', fmt(resA), delta(resA, resB)],
    ['Costo por resultado', resA ? clp(gastoA / resA) : '—', resA && resB ? delta(gastoA / resA, gastoB / resB) : ''],
    ['Usuarios en el sitio', fmt(usA), delta(usA, usB)],
    ['Simulaciones', fmt(A.sim.n), delta(A.sim.n, B.sim.n)],
    ['Reuniones agendadas', fmt(A.reu.reservadas), delta(A.reu.reservadas, B.reu.reservadas)],
  ]);

  const listaCuentas = Object.keys(cuentas).length
    ? Object.entries(cuentas).map(([k, v]) => `<strong>${esc(k)}:</strong> ${esc(v.join(', '))}`).join('<br>')
    : 'Ninguna cuenta de Pulso en Windsor.ai todavía.';
  const avisos = errores.length ? `<p style="margin:10px 0 0;font-size:12px;color:#B4442C">No se pudo leer: ${esc(errores.join(' · '))}</p>` : '';
  const periodo = `${corta(s.desde)} al ${corta(s.hasta)} ${s.hasta.slice(0, 4)}`;
  const cuerpo = `<p style="margin:0 0 6px;font-size:15px;color:${C.gris}">Semana del ${esc(periodo)}, comparada con la semana anterior.</p>`
    + resumen + secciones.join('')
    + `<div style="margin:28px 0 0;padding:14px 16px;background:${C.fondo};border-radius:12px;font-size:12px;line-height:1.6;color:${C.gris}"><strong style="color:${C.verde}">Cuentas incluidas</strong> (toda cuenta de Windsor.ai cuyo nombre diga «Pulso» se suma sola):<br>${listaCuentas}${avisos}</div>`;
  const html = plantilla({
    preheader: `Inversión Meta ${gastoA ? clp(gastoA) : '$0'} · ${fmt(usA)} usuarios · ${fmt(A.sim.n)} simulaciones`,
    eyebrow: 'Informe semanal', titulo: `Pulso Inversor · ${esc(periodo)}`, cuerpo,
    pie: 'Informe automático de cada lunes a las 10:00.',
  });
  return { html, asunto: `Informe semanal Pulso Inversor · ${periodo}`, periodo, errores };
}

export async function enviarInforme(env, s = semanas(), para = INFORME_PARA) {
  const { html, asunto, errores } = await armarInforme(env, s);
  await brevo(env, { sender: { email: DEFAULT_SENDER, name: 'Pulso Inversor' }, to: para.map((email) => ({ email })), subject: asunto, htmlContent: html, tags: ['informe-semanal'] });
  return { asunto, errores };
}

// Llamado desde el cron cada minuto: envía una sola vez, el lunes desde las 10:00 de Chile.
export async function informeSemanal(env) {
  if (!env.WINDSOR_API_KEY) return { omitido: 'sin WINDSOR_API_KEY' };
  const ahora = partesChile();
  if (ahora.dia !== 'Mon' || ahora.hora < 10 || ahora.hora > 13) return null; // reintenta hasta las 13:59 si algo falla
  const s = semanas(ahora.fecha);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS informes (semana TEXT PRIMARY KEY, enviado TEXT, detalle TEXT)`).run();
  const ya = await env.DB.prepare(`SELECT enviado FROM informes WHERE semana = ?`).bind(s.desde).first();
  if (ya) return null;
  await env.DB.prepare(`INSERT INTO informes (semana, enviado, detalle) VALUES (?, ?, ?)`).bind(s.desde, new Date().toISOString(), 'enviando').run();
  try {
    const r = await enviarInforme(env, s);
    await env.DB.prepare(`UPDATE informes SET detalle = ? WHERE semana = ?`).bind(JSON.stringify(r), s.desde).run();
    return r;
  } catch (e) {
    await env.DB.prepare(`DELETE FROM informes WHERE semana = ?`).bind(s.desde).run(); // se reintenta el minuto siguiente
    throw e;
  }
}
