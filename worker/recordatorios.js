// Pulso Inversor · Recordatorios de reuniones de Brevo Meetings
// Cuando Brevo avisa una reserva (webhook), se guarda la reunión. Un cron cada minuto envía:
//   · 24 horas antes  · 1 hora antes  · 1 minuto antes
// Cada correo trae el enlace a la videollamada y el enlace oficial de Brevo para reagendar o cancelar
// (al cancelar, Brevo libera el cupo y nos avisa: los recordatorios pendientes se detienen).

import { DEFAULT_SENDER, ASESORES, WHATSAPP, C, P, esc, brevo, boton, bloqueResumen, plantilla } from './comun.js';

const ETAPAS = [
  { col: 'r24', antes: 24 * 60, margenMin: 60 },   // si reservó con menos de ~25 h, no se envía el de 24 h
  { col: 'r1h', antes: 60, margenMin: 10 },
  { col: 'r1m', antes: 1, margenMin: 0 },
];

const fechaLarga = (iso) => new Date(iso).toLocaleString('es-CL', { timeZone: 'America/Santiago', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false });
const hora = (iso) => new Date(iso).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });

export async function guardarReserva(env, m) {
  const p = (m.event_participants || [])[0] || {};
  const email = String(p.EMAIL || '').trim().toLowerCase();
  if (!email || !m.meeting_start_timestamp) return;
  if (Date.parse(m.meeting_start_timestamp) < Date.now()) return;
  // Si ya existe la misma reunión (mismo correo e inicio), no se duplica.
  // Reagendamiento: si Brevo avisa una nueva hora con el mismo enlace de cambio, se anula la hora anterior.
  if (m.reschedule_cancel_url) {
    await env.DB.prepare('UPDATE recordatorios SET cancelada = ? WHERE url_cambio = ? AND email = ? AND inicio <> ? AND cancelada IS NULL').bind('reagendada ' + new Date().toISOString(), m.reschedule_cancel_url, email, m.meeting_start_timestamp).run();
  }
  const ya = await env.DB.prepare('SELECT id FROM recordatorios WHERE email = ? AND inicio = ? AND cancelada IS NULL').bind(email, m.meeting_start_timestamp).first();
  if (ya) return;
  await env.DB.prepare('INSERT INTO recordatorios (creado, email, nombre, asesor, inicio, fin, url_video, url_cambio, lugar) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(new Date().toISOString(), email, [p.FIRSTNAME, p.LASTNAME].filter(Boolean).join(' '), m.meeting_name || '', m.meeting_start_timestamp, m.meeting_end_timestamp || null,
      m.meeting_url || null, m.reschedule_cancel_url || null, [m.meeting_location, m.meeting_address].filter((x) => x && x !== 'Sendinblue video').join(' · ') || null)
    .run();
}

export async function cancelarReserva(env, m) {
  const p = (m.event_participants || [])[0] || {};
  const email = String(p.EMAIL || '').trim().toLowerCase();
  if (!email || !m.meeting_start_timestamp) return;
  await env.DB.prepare('UPDATE recordatorios SET cancelada = ? WHERE email = ? AND inicio = ? AND cancelada IS NULL').bind(new Date().toISOString(), email, m.meeting_start_timestamp).run();
}

function asesorPorNombre(nombre) {
  for (const g of ASESORES) for (const a of g.personas) if (a.nombre === nombre) return a;
  return null;
}

function correo(r, col) {
  const primer = esc((r.nombre || '').split(' ')[0] || 'Hola');
  const quien = esc(r.asesor || 'tu asesor de Pulso');
  const cuando = fechaLarga(r.inicio);
  const video = r.url_video ? boton(col === 'r1m' ? 'Entrar a la reunión ahora' : 'Enlace de la videollamada', r.url_video) : '';
  const cambiar = r.url_cambio ? boton('Reagendar o cancelar', r.url_cambio, false) : '';
  const datos = bloqueResumen([`Fecha: ${cuando} h`, `Con: ${r.asesor || 'Pulso Inversor'}`, `Modalidad: ${r.url_video ? 'Videollamada' : (r.lugar || 'Por confirmar')}`].concat(r.lugar && r.url_video ? [`Lugar: ${r.lugar}`] : []));
  const liberar = P(`¿Te surgió algo? No hay problema: <strong>reagenda o cancela con un clic</strong> y así liberamos el cupo para otra persona.`);
  if (col === 'r24') return {
    asunto: `Mañana a las ${hora(r.inicio)}: tu reunión con ${r.asesor || 'Pulso Inversor'}`,
    html: plantilla({
      preheader: `Te esperamos ${cuando} h. Si no puedes, reagenda con un clic.`,
      eyebrow: 'Recordatorio · mañana', titulo: `${primer}, mañana conversamos`,
      cuerpo: P(`Te recordamos tu reunión con <strong>${quien}</strong>. Será una conversación tranquila para revisar tus números y resolver tus dudas. No te vamos a pedir que decidas en la reunión.`)
        + datos + P('Si quieres, ten a mano tu simulación y anota las preguntas que tengas. Puedes sumar a tu pareja, tu socio o tu abogado.') + liberar,
      botones: video + cambiar,
      pie: 'Recibes este correo porque agendaste una reunión con Pulso Inversor.',
    }),
  };
  if (col === 'r1h') return {
    asunto: `En 1 hora: tu reunión con ${r.asesor || 'Pulso Inversor'} (${hora(r.inicio)} h)`,
    html: plantilla({
      preheader: `Hoy a las ${hora(r.inicio)} h. Aquí tienes el enlace.`,
      eyebrow: 'Recordatorio · en 1 hora', titulo: `${primer}, nos vemos en una hora`,
      cuerpo: P(`${quien} te espera hoy a las <strong>${hora(r.inicio)} h</strong>.${r.url_video ? ' Te dejamos el enlace para que entres directo a la videollamada.' : ''}`) + datos + liberar,
      botones: video + cambiar,
      pie: 'Recibes este correo porque agendaste una reunión con Pulso Inversor.',
    }),
  };
  return {
    asunto: `Tu reunión con ${r.asesor || 'Pulso Inversor'} empieza ahora`,
    html: plantilla({
      preheader: `${r.asesor || 'Tu asesor'} ya te está esperando.`,
      eyebrow: 'Empieza ahora', titulo: `${primer}, ${quien} ya te está esperando`,
      cuerpo: P(r.url_video ? 'Tu reunión comienza en un minuto. Entra con el botón de abajo.' : 'Tu reunión comienza en un minuto.')
        + P(`¿Tienes algún problema para entrar? Escríbenos por <a href="https://wa.me/${WHATSAPP}" style="color:${C.verde2}">WhatsApp +56 9 8355 4676</a> y te ayudamos.`),
      botones: video + cambiar,
      pie: 'Recibes este correo porque agendaste una reunión con Pulso Inversor.',
    }),
  };
}

// Llamado por el cron cada minuto.
export async function procesarRecordatorios(env) {
  if (!env.DB || !env.BREVO_API_KEY) return { ok: false };
  const ahora = Date.now();
  const hasta = new Date(ahora + 24 * 3600e3 + 5 * 60e3).toISOString();
  const desde = new Date(ahora - 10 * 60e3).toISOString();
  const { results } = await env.DB.prepare('SELECT * FROM recordatorios WHERE cancelada IS NULL AND inicio BETWEEN ? AND ? AND (r24 IS NULL OR r1h IS NULL OR r1m IS NULL)').bind(desde, hasta).all();
  const sender = { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER };
  let enviados = 0;
  for (const r of results) {
    const inicio = Date.parse(r.inicio), creado = Date.parse(r.creado);
    for (const e of ETAPAS) {
      if (r[e.col]) continue;
      const momento = inicio - e.antes * 60e3;
      if (ahora < momento) continue;                       // todavía no toca
      // Omitir si reservó demasiado cerca (el recordatorio ya no aporta) o si ya pasó la reunión.
      const omitir = creado > momento - e.margenMin * 60e3 || ahora > inicio + 2 * 60e3 || (e.col !== 'r1m' && ahora > inicio - 2 * 60e3);
      let estado = 'omitido';
      if (!omitir) {
        try {
          const c = correo(r, e.col);
          const a = asesorPorNombre(r.asesor);
          await brevo(env, { sender, to: [{ email: r.email, name: r.nombre || undefined }], replyTo: a ? { email: a.email, name: a.nombre } : undefined, subject: c.asunto, htmlContent: c.html, tags: ['reunion-recordatorio', e.col] }, r.email);
          estado = new Date().toISOString(); enviados++;
        } catch (x) { estado = 'error: ' + String(x.message || x).slice(0, 150); }
      }
      await env.DB.prepare(`UPDATE recordatorios SET ${e.col} = ? WHERE id = ?`).bind(estado, r.id).run();
      r[e.col] = estado;
    }
  }
  return { ok: true, revisadas: results.length, enviados };
}
