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
  return { ...r, id: c.id, conCorreo: !!cuerpo.email };
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
  const canal = (d.channel && (d.channel.source || d.channel.type)) || (d.message && d.message.channel && d.message.channel.source) || '';
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
