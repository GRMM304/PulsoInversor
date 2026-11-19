// Pulso Inversor · Avisos de Brevo Meetings (webhooks)
// Brevo no ofrece una API para listar reuniones; en cambio avisa cada reserva o cancelación a una URL.
// Configurar en Brevo dos webhooks de Meetings:
//   "Meeting booked"    → https://1.pulsoinversor.cl/api/brevo-reuniones/reservada?token=WEBHOOK_BREVO
//   "Meeting cancelled" → https://1.pulsoinversor.cl/api/brevo-reuniones/cancelada?token=WEBHOOK_BREVO
//   "Meeting started"   → https://1.pulsoinversor.cl/api/brevo-reuniones/iniciada?token=WEBHOOK_BREVO
// (o el token como "Bearer" en la autenticación del webhook). Secreto en Cloudflare: WEBHOOK_BREVO.

import { json } from './comun.js';
import { guardarReserva, cancelarReserva } from './recordatorios.js';
import { eventoMeta } from './meta.js';
import { crmReunion } from './crm.js';

const EVENTOS = { reservada: 'reservada', cancelada: 'cancelada', iniciada: 'iniciada' };

function tokenValido(request, env, url) {
  if (!env.WEBHOOK_BREVO) return false;
  const auth = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return url.searchParams.get('token') === env.WEBHOOK_BREVO || auth === env.WEBHOOK_BREVO;
}

export async function recibirReunion(request, env, url) {
  if (request.method !== 'POST') return json({ ok: false, error: 'metodo_no_permitido' }, 405);
  if (!tokenValido(request, env, url)) return json({ ok: false, error: 'no_autorizado' }, 401);
  const evento = EVENTOS[url.pathname.split('/').pop()];
  if (!evento) return json({ ok: false, error: 'evento_desconocido' }, 404);
  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }
  const lista = Array.isArray(d) ? d : [d];
  if (!env.DB) return json({ ok: false, error: 'sin_base' }, 503);
  for (const m of lista.slice(0, 20)) {
    const p = (Array.isArray(m.event_participants) ? m.event_participants : [])[0] || {};
    await env.DB.prepare('INSERT INTO reuniones (recibido, evento, email, nombre, inicio, fin, reunion, cuenta, datos) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(new Date().toISOString(), evento, String(p.EMAIL || '').trim().toLowerCase(), [p.FIRSTNAME, p.LASTNAME].filter(Boolean).join(' '),
        m.meeting_start_timestamp || null, m.meeting_end_timestamp || null, m.meeting_name || null, m.account_email || null, JSON.stringify(m).slice(0, 8000))
      .run();
    try {
      if (evento === 'reservada') await guardarReserva(env, m);
      if (evento === 'cancelada') await cancelarReserva(env, m);
    } catch (e) { console.error('recordatorios', e); }
    // CRM (Brevo): estado de la reunión en la ficha del contacto + nota en su historial.
    if (evento === 'reservada' || evento === 'cancelada') {
      const r = await crmReunion(env, { email: String(p.EMAIL || ''), nombre: [p.FIRSTNAME, p.LASTNAME].filter(Boolean).join(' '), estado: evento === 'reservada' ? 'Agendada' : 'Cancelada', inicio: m.meeting_start_timestamp, asesor: m.meeting_name || '', detalle: evento === 'reservada' && m.meeting_url ? 'videollamada' : '' });
      if (!r.ok && !r.omitido) console.error('crm reunion', r.error);
    }
    // Meta (API de conversiones): reunión reservada de verdad = Schedule. ReunionRealizada sale de la confirmación del asesor.
    if (evento === 'reservada') {
      const email = String(p.EMAIL || '').trim().toLowerCase();
      const clave = [evento, email, m.meeting_start_timestamp || '', m.reschedule_cancel_url || ''].join('|');
      await eventoMeta(env, {
        nombreEvento: 'Schedule',
        eventoId: 'reunion-' + clave.slice(0, 180),
        persona: { email, nombre: [p.FIRSTNAME, p.LASTNAME].filter(Boolean).join(' '), telefono: p.SMS || p.PHONE || p.WHATSAPP || '' },
        datos: { content_name: m.meeting_name || 'Reunión' },
      });
    }
  }
  console.log('brevo reunion', evento, lista.length);
  return json({ ok: true });
}

// Última reunión (reservada o cancelada) de cada correo, para cruzar con las simulaciones en el panel.
export async function reunionesPorEmail(env) {
  const mapa = {};
  try {
    const { results } = await env.DB.prepare('SELECT * FROM reuniones ORDER BY recibido ASC').all();
    for (const r of results) if (r.email) mapa[r.email] = r;
    const rec = await env.DB.prepare('SELECT * FROM recordatorios ORDER BY creado ASC').all();
    for (const r of rec.results) if (mapa[r.email]) mapa[r.email]._rec = r;
  } catch (e) { console.error('reuniones', e); }
  return mapa;
}
