// respond.io → Brevo (CRM). respond.io avisa por webhook cuando se crea o cambia un contacto; el sitio lee el contacto
// completo con la API de respond.io y lo crea o actualiza en Brevo, en la lista "Leads Pulso Inversor (respond.io)".
// Secretos: RESPONDIO_TOKEN (API respond.io), BREVO_CRM_KEY (Brevo con permiso de contactos), WEBHOOK_RESPONDIO (clave de la URL).
import { json } from './comun.js';
import { telefonoChile } from './respondio.js';

export const LISTA_LEADS = 7;   // Brevo › Contactos › PULSO INVERSOR › "Leads Pulso Inversor (respond.io)"
const CANALES = { whatsapp_business: 'WhatsApp', whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Messenger', webchat: 'Chat del sitio', website_chat: 'Chat del sitio' };

const campo = (c, slug) => ((c.custom_fields || []).find((f) => f.name === slug) || {}).value;
const correoValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

async function contactoRespond(env, id) {
  const r = await fetch(`https://api.respond.io/v2/contact/id:${encodeURIComponent(id)}`, { headers: { Authorization: 'Bearer ' + env.RESPONDIO_TOKEN, accept: 'application/json' } });
  if (!r.ok) throw new Error('respond.io ' + r.status + ': ' + (await r.text()).slice(0, 150));
  return r.json();
}

async function brevoContacto(env, cuerpo) {
  const r = await fetch('https://api.brevo.com/v3/contacts', { method: 'POST', headers: { 'api-key': env.BREVO_CRM_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(cuerpo) });
  if (r.ok || r.status === 204) return { ok: true };
  return { ok: false, status: r.status, error: (await r.text()).slice(0, 200) };
}

// Pasa un contacto de respond.io a Brevo. Se identifica por correo si lo tiene; si no, por su ID de respond.io.
export async function sincronizarContacto(env, id, extra = {}) {
  const c = await contactoRespond(env, id);
  const fono = telefonoChile(c.phone);
  const asesor = c.assignee ? [c.assignee.firstName, c.assignee.lastName].filter(Boolean).join(' ') : '';
  const atributos = {
    NOMBRE: c.firstName || '', APELLIDOS: c.lastName || '',
    ORIGEN: 'respond.io', RESPONDIO_ID: String(c.id),
    ETAPA: c.lifecycle || '', ASESOR: asesor,
    ESTRATEGIA: campo(c, 'estrategia_pulso') || '', RANGO_EDAD: campo(c, 'rango_de_edad_pulso') || '',
  };
  const monto = Number(campo(c, 'monto_pulso')); if (monto) atributos.MONTO = monto;
  if (extra.canal) atributos.CANAL = CANALES[extra.canal] || extra.canal;
  if (fono) { atributos.SMS = fono; atributos.WHATSAPP = fono; }
  const cuerpo = { attributes: atributos, listIds: [LISTA_LEADS], updateEnabled: true, ext_id: 'rio-' + c.id };
  if (correoValido(c.email)) cuerpo.email = String(c.email).trim().toLowerCase();
  let r = await brevoContacto(env, cuerpo);
  // Brevo no acepta un teléfono que ya tiene otro contacto: se reintenta sin teléfono para no perder el lead.
  if (!r.ok && /SMS|WHATSAPP|duplicate/i.test(r.error || '')) {
    delete atributos.SMS; delete atributos.WHATSAPP;
    r = await brevoContacto(env, cuerpo);
  }
  const etapa = etapaDesdeRespond(c.lifecycle, asesor);
  const neg = etapa ? await avanzarNegocio(env, cuerpo.email ? { email: cuerpo.email } : { extId: 'rio-' + c.id }, etapa, { nombre: [c.firstName, c.lastName].filter(Boolean).join(' '), estrategia: atributos.ESTRATEGIA, monto: atributos.MONTO }) : null;
  return { ...r, id: c.id, conCorreo: !!cuerpo.email, negocio: neg };
}

// POST /api/respondio-webhook?token=...  (respond.io › Integraciones › Webhooks)
export async function recibirRespondio(request, env, url) {
  if (request.method !== 'POST') return json({ ok: false }, 405);
  if (!env.WEBHOOK_RESPONDIO || url.searchParams.get('token') !== env.WEBHOOK_RESPONDIO) return json({ ok: false, error: 'no_autorizado' }, 401);
  if (!env.RESPONDIO_TOKEN || !env.BREVO_CRM_KEY) return json({ ok: false, error: 'sin_configurar' }, 503);
  let d; try { d = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }
  // respond.io envía el contacto dentro del aviso; se toma su ID y se lee completo desde la API.
  const contacto = d.contact || (d.data && d.data.contact) || d;
  const id = contacto && (contacto.id || contacto.contactId) || d.contactId;
  // El canal llega en los avisos de conversación (y de mensajes): se busca cualquier "channel" con su tipo.
  const buscarCanal = (o, prof = 0) => {
    if (!o || typeof o !== 'object' || prof > 4) return '';
    for (const [k, v] of Object.entries(o)) {
      if (/channel/i.test(k) && v && typeof v === 'object' && (v.source || v.type)) return v.source || v.type;
      if (/channel.?(source|type)/i.test(k) && typeof v === 'string') return v;
    }
    for (const v of Object.values(o)) { const x = buscarCanal(v, prof + 1); if (x) return x; }
    return '';
  };
  const canal = buscarCanal(d);
  if (/conversation/i.test(String(d.event_type || d.event || ''))) console.log('respondio conversación · claves', Object.keys(d).join(','), '· canal', canal || '?');
  console.log('respondio webhook', d.event_type || d.event || d.type || '?', 'contacto', id || '?', 'canal', canal || '-');
  if (!id) return json({ ok: true, omitido: 'sin contacto' });
  try {
    const r = await sincronizarContacto(env, id, { canal });
    console.log('respondio → brevo', id, JSON.stringify(r));
    return json({ ok: true });
  } catch (e) {
    console.error('respondio → brevo', id, e.message);
    return json({ ok: false }, 200); // 200 para que respond.io no desactive el webhook por un error puntual
  }
}

// ---------- Reuniones → Brevo (CRM) ----------
// Cada cambio de una reunión deja: campos con el estado actual (REUNION_ESTADO, REUNION_FECHA, REUNION_ASESOR,
// REUNIONES_REALIZADAS) y una nota en el historial del contacto. Nunca lanza error.
const fechaChile = (iso) => new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false });

async function brevoApi(env, metodo, ruta, cuerpo) {
  const r = await fetch('https://api.brevo.com/v3' + ruta, { method: metodo, headers: { 'api-key': env.BREVO_CRM_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`Brevo ${metodo} ${ruta.split('?')[0]} ${r.status}: ${t.slice(0, 150)}`);
  try { return t ? JSON.parse(t) : {}; } catch (e) { return {}; }
}

export async function crmReunion(env, { email, nombre, estado, inicio, asesor, detalle, soloNota }) {
  if (!env.BREVO_CRM_KEY || !correoValido(email)) return { omitido: true };
  const correo = String(email).trim().toLowerCase();
  try {
    let previo = null;
    try { previo = await brevoApi(env, 'GET', '/contacts/' + encodeURIComponent(correo)); } catch (e) { /* contacto nuevo */ }
    const realizadas = Number((previo && previo.attributes && previo.attributes.REUNIONES_REALIZADAS) || 0) + (estado === 'Realizada' ? 1 : 0);
    const partes = String(nombre || '').trim().split(/\s+/);
    const attrs = { REUNION_ESTADO: estado, REUNION_ASESOR: asesor || '', REUNIONES_REALIZADAS: realizadas };
    if (inicio) attrs.REUNION_FECHA = new Date(inicio).toISOString().slice(0, 10);
    if (!previo && partes[0]) { attrs.NOMBRE = partes[0]; attrs.APELLIDOS = partes.slice(1).join(' '); }
    if (!soloNota) await brevoApi(env, 'POST', '/contacts', { email: correo, attributes: attrs, updateEnabled: true });
    const etapaNeg = { Agendada: 'Reunión agendada', Realizada: 'Reunión realizada' }[estado];
    if (etapaNeg) await avanzarNegocio(env, { email: correo }, etapaNeg, { nombre });
    const c = previo && previo.id ? previo : await brevoApi(env, 'GET', '/contacts/' + encodeURIComponent(correo));
    const icono = { Agendada: '📅', Cancelada: '✖️', Reagendada: '🔁', Realizada: '✅', 'No se presentó': '⚠️', 'Grabación': '🎥' }[estado] || '📅';
    const texto = `${icono} ${estado === 'Grabación' ? 'Grabación de la reunión' : 'Reunión ' + estado.toLowerCase()}${asesor ? ' con ' + asesor : ''}${inicio ? ' · ' + fechaChile(inicio) + ' h' : ''}${detalle ? ' · ' + detalle : ''}`;
    if (c && c.id) await brevoApi(env, 'POST', '/crm/notes', { text: texto, contactIds: [c.id] });
    return { ok: true };
  } catch (e) {
    console.error('crm reunion', estado, e.message);
    return { ok: false, error: e.message };
  }
}

// ---------- Embudo de negocios (Brevo CRM) ----------
// Un negocio por persona en el pipeline de Pulso Inversor. Avanza solo hacia adelante; las etapas manuales
// (Evaluando operación, No avanzó) las mueve el asesor en Brevo. Si alguien que "No avanzó" agenda otra reunión, se reactiva.
export const ETAPAS_EMBUDO = ['Nuevo lead', 'En conversación', 'Derivado a asesor', 'Reunión agendada', 'Reunión realizada', 'Evaluando operación', 'Invirtió', 'No avanzó'];
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
let cacheEmbudo = null;
async function embudo(env) {
  if (cacheEmbudo && Date.now() - cacheEmbudo.t < 10 * 60e3) return cacheEmbudo.v;
  const todos = await brevoApi(env, 'GET', '/crm/pipeline/details/all');
  const p = (Array.isArray(todos) ? todos : []).find((x) => (x.stages || []).some((s) => norm(s.name) === 'nuevo lead'));
  const v = p ? { id: p.pipeline, etapas: Object.fromEntries(ETAPAS_EMBUDO.map((n) => [n, ((p.stages || []).find((s) => norm(s.name) === norm(n)) || {}).id]).filter(([, id]) => id)) } : null;
  cacheEmbudo = { t: Date.now(), v };
  return v;
}

// Etapa de respond.io → etapa del embudo
export function etapaDesdeRespond(lifecycle, asesor) {
  const l = norm(lifecycle);
  if (/derivado/.test(l) || /renato|pamela/i.test(asesor || '')) return 'Derivado a asesor';
  if (/recopilacion|calificacion|conversacion/.test(l)) return 'En conversación';
  if (/consulta|nuevo|lead/.test(l)) return 'Nuevo lead';
  return null;
}

// Avanza (o crea) el negocio de una persona. persona = { email } o { extId }.
export async function avanzarNegocio(env, persona, etapa, { nombre, estrategia, monto } = {}) {
  if (!env.BREVO_CRM_KEY || !etapa) return { omitido: true };
  try {
    const e = await embudo(env);
    if (!e || !e.etapas[etapa]) return { omitido: 'sin embudo o etapa ' + etapa };
    // Contacto en Brevo
    let contacto = null;
    if (correoValido(persona.email)) {
      const correo = String(persona.email).trim().toLowerCase();
      try { contacto = await brevoApi(env, 'GET', '/contacts/' + encodeURIComponent(correo)); } catch (x) {
        const p = String(nombre || '').trim().split(/\s+/);
        await brevoApi(env, 'POST', '/contacts', { email: correo, attributes: { NOMBRE: p[0] || '', APELLIDOS: p.slice(1).join(' ') }, updateEnabled: true });
        contacto = await brevoApi(env, 'GET', '/contacts/' + encodeURIComponent(correo));
      }
    } else if (persona.extId) {
      try { contacto = await brevoApi(env, 'GET', '/contacts/' + encodeURIComponent(persona.extId) + '?identifierType=ext_id'); } catch (x) { contacto = null; }
    }
    if (!contacto || !contacto.id) return { omitido: 'sin contacto' };
    // Negocio existente de esa persona en el embudo
    const r = await brevoApi(env, 'GET', `/crm/deals?filters[linkedContactsIds]=${contacto.id}&limit=50`);
    const negocios = (r.items || []).filter((d) => d.attributes && d.attributes.pipeline === e.id);
    const actual = negocios[0];
    const idx = (n) => ETAPAS_EMBUDO.indexOf(n);
    const nombreEtapa = (id) => Object.keys(e.etapas).find((k) => e.etapas[k] === id);
    if (!actual) {
      const titulo = [nombre || [contacto.attributes && contacto.attributes.NOMBRE, contacto.attributes && contacto.attributes.APELLIDOS].filter(Boolean).join(' ') || contacto.email || 'Lead', estrategia].filter(Boolean).join(' · ');
      const attrs = { pipeline: e.id, deal_stage: e.etapas[etapa] };
      if (monto) attrs.amount = Math.round(monto);
      const n = await brevoApi(env, 'POST', '/crm/deals', { name: titulo.slice(0, 120), attributes: attrs });
      await brevoApi(env, 'PATCH', `/crm/deals/link-unlink/${n.id}`, { linkContactIds: [contacto.id] });
      return { ok: true, creado: etapa };
    }
    const ahora = nombreEtapa(actual.attributes.deal_stage);
    const reactivar = ahora === 'No avanzó' && idx(etapa) >= idx('Reunión agendada') && etapa !== 'No avanzó';
    if (ahora === 'Invirtió' || (!reactivar && idx(etapa) <= idx(ahora))) return { ok: true, sinCambio: ahora };
    const attrs = { deal_stage: e.etapas[etapa] };
    if (monto && !actual.attributes.amount) attrs.amount = Math.round(monto);
    await brevoApi(env, 'PATCH', `/crm/deals/${actual.id}`, { attributes: attrs });
    return { ok: true, de: ahora, a: etapa };
  } catch (x) {
    console.error('crm negocio', etapa, x.message);
    return { ok: false, error: x.message };
  }
}
