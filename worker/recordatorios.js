// Pulso Inversor · Recordatorios y seguimiento de reuniones de Brevo Meetings
// Cuando Brevo avisa una reserva (webhook), se guarda la reunión. Un cron cada minuto envía:
//   · 24 horas antes  · 1 hora antes  · 1 minuto antes
//   · al terminar: correo al ASESOR "¿se realizó la reunión?" (Sí / No se presentó)
//   · 1 hora después de terminada, SOLO si el asesor confirmó "Sí": agradecimiento + encuesta
//   · 48 horas después de terminada, SOLO si se realizó: seguimiento para volver a agendar (remarketing)
//   · si el asesor marca "No se presentó": correo a la persona para reagendar
// (El aviso "reunión iniciada" de Brevo no sirve para esto: llega apenas alguien abre el enlace de la sala.)
// Cada correo trae el enlace a la videollamada y el enlace oficial de Brevo para reagendar o cancelar
// (al cancelar, Brevo libera el cupo y nos avisa: los recordatorios pendientes se detienen).

import { RESENAS_GOOGLE, asesorDeReunion, DEFAULT_SENDER, ASESORES, SITIO, WHATSAPP, WHATSAPP_TXT, C, P, esc, brevo, boton, bloqueResumen, plantilla } from './comun.js';
import { firmar, procesarSeguimientos } from './seguimiento.js';
import { whatsappPlantilla, telefonoChile } from './respondio.js';

// WhatsApp del flujo de reuniones (respond.io): mismo momento que cada correo. Plantilla por etapa.
const WA_PLANTILLAS = { conf: 'pulso_reunion_agendada', r24: 'pulso_reunion_24h', r1h: 'pulso_reunion_1h', r1m: 'pulso_reunion_ahora', p1h: 'pulso_reunion_gracias', noshow: 'pulso_reunion_reagendar', p48: 'pulso_reunion_seguimiento' };
async function waReunion(env, r, etapa, enlace) {
  const a = asesorDeReunion(r.asesor);
  const asesor = a ? a.asesor.nombre : (r.asesor || 'nuestro equipo');
  const primer = String(r.nombre || '').trim().split(/\s+/)[0] || 'Hola';
  let tel = r.telefono;
  if (!tel) { const s = await env.DB.prepare('SELECT telefono FROM simulaciones WHERE lower(email) = ? AND telefono IS NOT NULL ORDER BY creado DESC LIMIT 1').bind(r.email).first().catch(() => null); tel = s && s.telefono; }
  const cuando = fechaLarga(r.inicio) + ' h';
  const vars = {
    conf: [primer, asesor, cuando],
    r24: [primer, asesor, cuando],
    r1h: [primer, asesor, hora(r.inicio) + ' h', r.url_video || 'el enlace que te enviamos por correo'],
    r1m: [primer, asesor, r.url_video || 'el enlace que te enviamos por correo'],
    p1h: [primer, asesor, enlace || SITIO],
    noshow: [primer, asesor, enlace || r.url_cambio || SITIO],
    p48: [primer, asesor],
  }[etapa];
  const res = await whatsappPlantilla(env, { telefono: tel, nombre: r.nombre, email: r.email, plantilla: WA_PLANTILLAS[etapa], variables: vars });
  if (!res.ok) console.log('whatsapp reunion', etapa, r.id, JSON.stringify(res));
  return res;
}

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
  const ids = m.identifiers || {};
  const telefono = telefonoChile(ids.whatsapp_id || ids.phone_id || p.SMS || p.WHATSAPP || '') || null;
  const ins = await env.DB.prepare('INSERT INTO recordatorios (creado, email, nombre, asesor, inicio, fin, url_video, url_cambio, lugar, telefono) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING *')
    .bind(new Date().toISOString(), email, [p.FIRSTNAME, p.LASTNAME].filter(Boolean).join(' '), m.meeting_name || '', m.meeting_start_timestamp, m.meeting_end_timestamp || null,
      m.meeting_url || null, m.reschedule_cancel_url || null, [m.meeting_location, m.meeting_address].filter((x) => x && x !== 'Sendinblue video').join(' · ') || null, telefono)
    .first();
  if (ins) await waReunion(env, ins, 'conf');   // WhatsApp: "tu reunión quedó agendada"
}

export async function cancelarReserva(env, m) {
  const p = (m.event_participants || [])[0] || {};
  const email = String(p.EMAIL || '').trim().toLowerCase();
  if (!email || !m.meeting_start_timestamp) return;
  await env.DB.prepare('UPDATE recordatorios SET cancelada = ? WHERE email = ? AND inicio = ? AND cancelada IS NULL').bind(new Date().toISOString(), email, m.meeting_start_timestamp).run();
}

function asesorPorNombre(nombre) {
  const x = asesorDeReunion(nombre);
  return x ? x.asesor : null;
}

function correo(r, col) {
  const rec = asesorDeReunion(r.asesor);
  if (rec) r = { ...r, asesor: rec.asesor.nombre };
  const primer = esc((r.nombre || '').split(' ')[0] || 'Hola');
  const quien = esc(r.asesor || 'tu asesor de Pulso Inversor');
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
        + P(`¿Tienes algún problema para entrar? Escríbenos por <a href="https://wa.me/${WHATSAPP}" style="color:${C.verde2}">WhatsApp ${WHATSAPP_TXT}</a> y te ayudamos.`),
      botones: video + cambiar,
      pie: 'Recibes este correo porque agendaste una reunión con Pulso Inversor.',
    }),
  };
}

/* ---------- Después de la reunión ---------- */

async function correoPosterior(env, r, col) {
  // Si la persona viene de un simulador, se enlaza con su simulación (panel y encuesta quedan en su fila).
  const sim = await env.DB.prepare('SELECT * FROM simulaciones WHERE lower(email) = ? ORDER BY creado DESC LIMIT 1').bind(r.email).first().catch(() => null);
  // El asesor sale del nombre de la reunión en Brevo; si no se reconoce, se usa el de su simulación.
  const x = asesorDeReunion(r.asesor);
  const g = x ? x.grupo : (sim && sim.grupo != null ? sim.grupo : 0);
  const asesor = x ? x.asesor : ASESORES[g].personas[0];
  const nombre = r.nombre || (sim && sim.nombre) || '';
  const primer = esc(nombre.split(' ')[0] || 'Hola');
  const quien = esc(asesor.nombre.split(' ')[0]);
  const t = await firmar(env, { a: asesor.nombre, i: sim ? sim.id : null, n: nombre || r.email, e: r.email, p: sim ? sim.telefono : '', s: sim ? sim.tipo : 'Reunión con Pulso Inversor', m: sim ? sim.monto : 0, g, f: Date.now() });
  const wa = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(`Hola, soy ${nombre || r.email}. Conversé con ${asesor.nombre} y quiero seguir avanzando.`);
  if (col === 'p1h') return {
    asunto: `Gracias por conversar con ${asesor.nombre}`,
    replyTo: asesor,
    html: plantilla({
      preheader: `¿Cómo te fue en la reunión? Cuéntanos en un minuto.`,
      eyebrow: 'Gracias por tu tiempo', titulo: `${primer}, gracias por la reunión`,
      cuerpo: P(`Gracias por darte el tiempo de conversar con <strong>${esc(asesor.nombre)}</strong>. Sabemos que tu tiempo vale, y esperamos haberte ayudado a ver con más claridad tus opciones.`)
        + P(`Si te quedó alguna pregunta o quieres revisar algo de lo que conversaron, <strong>responde este correo</strong> y le llega directo a ${quien}.`)
        + P('¿Nos ayudas con tu opinión? Son seis preguntas rápidas y nos sirven mucho para acompañar mejor a cada persona.'),
      botones: boton('Contarnos cómo te fue', `${SITIO}/seguimiento/encuesta?t=${t}`) + boton("Escribirnos por WhatsApp", wa, false)
        + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:1px solid ${C.borde}"><tr><td style="padding-top:18px;font-size:15px;line-height:1.6;color:${C.texto}">`
        + `<strong>¿Te gustó la conversación?</strong> Una reseña en Google ayuda a otras personas a conocernos y a decidir con más información.</td></tr></table>`
        + boton('★ Déjanos tu reseña en Google', RESENAS_GOOGLE, false),
      pie: 'Recibes este correo porque tuviste una reunión con Pulso Inversor.',
    }),
  };
  return {
    asunto: `${nombre.split(' ')[0] || 'Hola'}, ¿pudiste pensar en lo que conversamos?`,
    replyTo: asesor,
    html: plantilla({
      preheader: `Si quieres ver otra operación o resolver una duda nueva, ${quien} te acompaña.`,
      eyebrow: 'Seguimiento', titulo: `${primer}, ¿pudiste pensar en lo que conversamos?`,
      cuerpo: P(`Hace dos días conversaste con <strong>${esc(asesor.nombre)}</strong>. Una decisión así se toma con calma, y queremos asegurarnos de que tengas todo lo que necesitas.`)
        + P(`Si quieres ver otra operación, revisar los documentos con tu abogado o resolver una duda nueva, agenda otra conversación cuando te acomode. Y si ya quieres avanzar, escríbenos y lo coordinamos.`),
      botones: boton(`Agendar otra reunión con ${quien}`, `${SITIO}/seguimiento/agendar?t=${t}`) + boton('Quiero avanzar', wa, false)
        + (sim && sim.encuesta ? '' : `<p style="margin:18px 0 0;font-size:14px;color:${C.gris}">¿Aún no nos cuentas cómo te fue? <a href="${SITIO}/seguimiento/encuesta?t=${t}" style="color:${C.verde2}">Responde la encuesta</a>.</p>`),
      pie: 'Recibes este correo porque tuviste una reunión con Pulso Inversor.',
    }),
  };
}

const POSTERIORES = [
  { col: 'p1h', despues: 60, limite: 72 * 60 },        // si el asesor confirma tarde, se envía igual dentro de 3 días
  { col: 'p48', despues: 48 * 60, limite: 54 * 60 },
];

// Correo al asesor al terminar la reunión: ¿se realizó?
async function avisoAsesor(env, r, sender) {
  const x = asesorDeReunion(r.asesor);
  const sim = await env.DB.prepare('SELECT grupo FROM simulaciones WHERE lower(email) = ? ORDER BY creado DESC LIMIT 1').bind(r.email).first().catch(() => null);
  const asesores = x ? [x.asesor] : ASESORES[sim && sim.grupo != null ? sim.grupo : 0].personas;
  const t = await firmar(env, { rid: r.id, f: Date.now() });
  const nombre = r.nombre || r.email;
  const html = plantilla({
    preheader: `Confírmanos si la reunión con ${nombre} se realizó. Con eso le enviamos el correo que corresponde.`,
    eyebrow: 'Reunión terminada', titulo: `¿Se realizó la reunión con ${esc(nombre)}?`,
    cuerpo: P(`La reunión de las <strong>${hora(r.inicio)} h</strong> ya terminó. Confírmanos con un clic:`)
      + bloqueResumen([`Persona: ${nombre}`, `Correo: ${r.email}`, `Hora: ${fechaLarga(r.inicio)} h`])
      + P(`<strong>Sí, se realizó:</strong> en una hora le llega el agradecimiento con la encuesta y la invitación a dejar una reseña, y en 48 horas el seguimiento. En la misma página puedes pegar el <strong>enlace de la grabación</strong> para enviársela a Iván y Felipe.<br><strong>No se presentó:</strong> le llega una invitación para reagendar. No recibe el agradecimiento.`)
      + `<p style="margin:0 0 14px;font-size:13px;color:${C.gris}">Si no respondes, no se le envía nada después de la reunión.</p>`,
    botones: boton('Sí, se realizó', `${SITIO}/seguimiento/reunion?r=si&t=${t}`) + boton('No se presentó', `${SITIO}/seguimiento/reunion?r=no&t=${t}`, false),
    pie: 'Aviso interno de reuniones de pulsoinversor.cl.',
  });
  await brevo(env, { sender, to: asesores.map((a) => ({ email: a.email, name: a.nombre })), subject: `¿Se realizó la reunión con ${nombre}?`, htmlContent: html, tags: ['reunion-confirmar'] }, r.email);
}

// Correo a la persona que no se presentó: invitación a reagendar.
async function correoNoShow(env, r) {
  const x = asesorDeReunion(r.asesor);
  const asesor = x ? x.asesor : null;
  const primer = esc((r.nombre || '').split(' ')[0] || 'Hola');
  const quien = asesor ? esc(asesor.nombre.split(' ')[0]) : 'nuestro equipo';
  const sim = await env.DB.prepare('SELECT * FROM simulaciones WHERE lower(email) = ? ORDER BY creado DESC LIMIT 1').bind(r.email).first().catch(() => null);
  const t = await firmar(env, { a: asesor ? asesor.nombre : undefined, i: sim ? sim.id : null, n: r.nombre || r.email, e: r.email, p: sim ? sim.telefono : '', s: sim ? sim.tipo : 'Reunión con Pulso Inversor', m: sim ? sim.monto : 0, g: x ? x.grupo : (sim && sim.grupo != null ? sim.grupo : 0), f: Date.now() });
  const enlace = r.url_cambio || `${SITIO}/seguimiento/agendar?t=${t}`;
  return {
    asunto: `${(r.nombre || '').split(' ')[0] || 'Hola'}, ¿buscamos otro horario?`,
    replyTo: asesor,
    html: plantilla({
      preheader: 'No pudimos conectarnos hoy. Elige otro horario cuando te acomode.',
      eyebrow: 'Reagendar', titulo: `${primer}, ¿buscamos otro horario?`,
      cuerpo: P(`Te esperábamos hoy a las <strong>${hora(r.inicio)} h</strong>${asesor ? ` con <strong>${esc(asesor.nombre)}</strong>` : ''} y no pudimos conectarnos. Entendemos que a veces surgen imprevistos.`)
        + P(`Si sigues interesado en revisar tu inversión, elige otro día y hora con un clic. ${quien === 'nuestro equipo' ? 'Te esperamos.' : quien + ' te espera.'}`),
      botones: boton('Elegir otro horario', enlace) + boton('Escribirnos por WhatsApp', 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent('Hola, no pude conectarme a la reunión y quiero reagendar.'), false),
      pie: 'Recibes este correo porque agendaste una reunión con Pulso Inversor.',
    }),
  };
}

// Llamado por el cron cada minuto.
export async function procesarRecordatorios(env) {
  if (!env.DB || !env.BREVO_API_KEY) return { ok: false };
  const ahora = Date.now();
  const hasta = new Date(ahora + 24 * 3600e3 + 5 * 60e3).toISOString();
  const desde = new Date(ahora - 4 * 864e5).toISOString();
  const { results } = await env.DB.prepare("SELECT * FROM recordatorios WHERE cancelada IS NULL AND inicio BETWEEN ? AND ? AND (r24 IS NULL OR r1h IS NULL OR r1m IS NULL OR p1h IS NULL OR p48 IS NULL OR aviso_asesor IS NULL OR (realizada = 'no' AND noshow IS NULL))").bind(desde, hasta).all();
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
          await waReunion(env, r, e.col);
          await brevo(env, { sender, to: [{ email: r.email, name: r.nombre || undefined }], replyTo: a ? { email: a.email, name: a.nombre } : undefined, subject: c.asunto, htmlContent: c.html, tags: ['reunion-recordatorio', e.col] }, r.email);
          estado = new Date().toISOString(); enviados++;
        } catch (x) { estado = 'error: ' + String(x.message || x).slice(0, 150); }
      }
      await env.DB.prepare(`UPDATE recordatorios SET ${e.col} = ? WHERE id = ?`).bind(estado, r.id).run();
      r[e.col] = estado;
    }
    // Después de la reunión (se cuenta desde la hora de término; si no viene, 1 hora después del inicio).
    const fin = r.fin ? Date.parse(r.fin) : inicio + 3600e3;
    // 1) Al terminar: pregunta al asesor si se realizó.
    if (!r.aviso_asesor && ahora >= fin) {
      let estado = 'omitido';
      if (ahora < fin + 24 * 3600e3 && env.FIRMA_SEGUIMIENTO) {
        try { await avisoAsesor(env, r, sender); estado = new Date().toISOString(); enviados++; } catch (x) { estado = 'error: ' + String(x.message || x).slice(0, 150); }
      }
      await env.DB.prepare('UPDATE recordatorios SET aviso_asesor = ? WHERE id = ?').bind(estado, r.id).run();
      r.aviso_asesor = estado;
    }
    // 2) No se presentó: invitación a reagendar (una vez).
    if (r.realizada === 'no' && !r.noshow) {
      let estado;
      try {
        const c = await correoNoShow(env, r);
        await waReunion(env, r, 'noshow', (c.html.match(/href="([^"]+)"[^>]*>Elegir otro horario/) || [])[1]);
        await brevo(env, { sender, to: [{ email: r.email, name: r.nombre || undefined }], replyTo: c.replyTo ? { email: c.replyTo.email, name: c.replyTo.nombre } : undefined, subject: c.asunto, htmlContent: c.html, tags: ['reunion-noshow'] }, r.email);
        estado = new Date().toISOString(); enviados++;
      } catch (x) { estado = 'error: ' + String(x.message || x).slice(0, 150); }
      await env.DB.prepare('UPDATE recordatorios SET noshow = ?, p1h = COALESCE(p1h, ?), p48 = COALESCE(p48, ?) WHERE id = ?').bind(estado, 'omitido: no se presentó', 'omitido: no se presentó', r.id).run();
      continue;
    }
    // 3) Agradecimiento y seguimiento: solo si el asesor confirmó que se realizó.
    for (const e of POSTERIORES) {
      if (r[e.col]) continue;
      const momento = fin + e.despues * 60e3;
      if (ahora < momento) continue;
      if (r.realizada !== 'si') {
        if (ahora > fin + e.limite * 60e3) {   // nadie confirmó: no se envía nada
          await env.DB.prepare(`UPDATE recordatorios SET ${e.col} = ? WHERE id = ?`).bind('omitido: sin confirmar', r.id).run();
          r[e.col] = 'omitido: sin confirmar';
        }
        continue;
      }
      let estado = 'omitido';
      if (ahora < fin + e.limite * 60e3 && env.FIRMA_SEGUIMIENTO) {
        try {
          const c = await correoPosterior(env, r, e.col);
          await waReunion(env, r, e.col, ((c.html.match(/(https?:[^"]+\/seguimiento\/encuesta\?t=[^"&]+)/) || [])[1]));
          await brevo(env, { sender, to: [{ email: r.email, name: r.nombre || undefined }], replyTo: { email: c.replyTo.email, name: c.replyTo.nombre }, subject: c.asunto, htmlContent: c.html, tags: ['reunion-posterior', e.col] }, r.email);
          estado = new Date().toISOString(); enviados++;
        } catch (x) { estado = 'error: ' + String(x.message || x).slice(0, 150); }
      }
      await env.DB.prepare(`UPDATE recordatorios SET ${e.col} = ? WHERE id = ?`).bind(estado, r.id).run();
      r[e.col] = estado;
    }
  }
  // Correos de 48 h de las simulaciones (solo a quienes aún no agendan ni fueron contactados).
  const seg = await procesarSeguimientos(env).catch((e) => { console.error('seguimientos', e); return { enviados: 0 }; });
  return { ok: true, revisadas: results.length, enviados: enviados + seg.enviados };
}
