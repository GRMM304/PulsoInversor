// Correos transaccionales del Desayuno de Inversionistas.
// HTML con tablas y estilos en línea para que se vea bien en Gmail, Outlook y Apple Mail.
import { EVENTO, enlaceGoogleCalendar } from './evento.js';

const C = { verde: '#0E2C28', verde2: '#1E5746', lima: '#C7D95D', oro: '#ffc33f', texto: '#1F2523', gris: '#4E5A56', fondo: '#F3F5F2', borde: '#E3E8E1' };
const FUENTE = "Helvetica, Arial, sans-serif";

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const wa = (texto) => `https://wa.me/${EVENTO.whatsapp}?text=${encodeURIComponent(texto)}`;

function boton(texto, href, primario = true) {
  const bg = primario ? C.lima : '#ffffff';
  const borde = primario ? C.lima : C.borde;
  return `<a href="${esc(href)}" target="_blank" style="display:inline-block;background:${bg};border:1px solid ${borde};color:${C.verde};font-family:${FUENTE};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 22px;border-radius:999px;margin:4px 6px 4px 0">${esc(texto)}</a>`;
}

function bloqueDetalles() {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};border-radius:14px;margin:22px 0">
    <tr><td style="padding:18px 20px;font-family:${FUENTE};color:${C.texto};font-size:15px;line-height:1.5">
      <p style="margin:0 0 10px"><strong style="color:${C.verde}">📅 ${esc(EVENTO.fechaTexto)}</strong><br>${esc(EVENTO.horaTexto)}</p>
      <p style="margin:0"><strong style="color:${C.verde}">📍 ${esc(EVENTO.lugar)}</strong><br><a href="${EVENTO.mapa}" target="_blank" style="color:${C.verde2}">${esc(EVENTO.direccion)}</a></p>
    </td></tr>
  </table>`;
}

function plantilla({ preheader, eyebrow, titulo, cuerpo, botones = '', pie = '', urlCancelar }) {
  const cancelar = urlCancelar
    ? `<p style="margin:0 0 8px">¿No podrás asistir? <a href="${esc(urlCancelar)}" target="_blank" style="color:${C.lima}">Avísanos aquí</a> y liberamos tu cupo.</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(titulo)}</title></head>
<body style="margin:0;padding:0;background:${C.fondo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo}">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${C.borde}">
    <tr><td style="padding:22px 28px;border-bottom:3px solid ${C.lima}">
      <img src="${EVENTO.sitio}/assets/logo-pulso-gmm.png" width="300" alt="Pulso Inversor · Una empresa de Grupo Matchmaking" style="display:block;width:300px;max-width:100%;height:auto;border:0">
    </td></tr>
    <tr><td style="padding:30px 28px 8px;font-family:${FUENTE};color:${C.texto}">
      <p style="margin:0 0 10px;font-size:12px;letter-spacing:3px;font-weight:bold;color:${C.verde2};text-transform:uppercase">${esc(eyebrow)}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;color:${C.verde}">${titulo}</h1>
      <div style="font-size:16px;line-height:1.6;color:${C.texto}">${cuerpo}</div>
      ${bloqueDetalles()}
      <div style="margin:0 0 24px">${botones}</div>
      ${pie}
    </td></tr>
    <tr><td style="padding:20px 28px 26px;background:${C.verde};font-family:${FUENTE};font-size:13px;line-height:1.55;color:rgba(255,255,255,.78)">
      ${cancelar}
      <p style="margin:0 0 8px">¿Dudas? Escríbenos por <a href="${wa('Hola, tengo una consulta sobre el Desayuno de Inversionistas del 20 de noviembre')}" target="_blank" style="color:${C.lima}">WhatsApp ${esc(EVENTO.whatsappTexto)}</a> o llámanos al ${esc(EVENTO.telefono)}.</p>
      <p style="margin:0;color:rgba(255,255,255,.55);font-size:12px">Recibes este correo porque confirmaste tu asistencia al ${esc(EVENTO.titulo)}. Pulso Inversor · Una empresa de Grupo Matchmaking.</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

function botonesCalendario(urlIcs) {
  return boton('Agregar a Google Calendar', enlaceGoogleCalendar()) + boton('Otro calendario (.ics)', urlIcs, false) + boton('Cómo llegar', EVENTO.mapa, false);
}

// --- Correos al asistente ---------------------------------------------------

export function correoConfirmacion(a, urls) {
  const acomp = (a.acompanante ? `<p style="margin:0 0 12px">Registramos que vienes con <strong>${esc(a.acompanante)}</strong>.</p>` : '')
    + (a.estacionamiento ? `<p style="margin:0 0 12px">Registramos que necesitas estacionamiento para tu auto patente <strong>${esc(a.patente || '')}</strong>.</p>` : '');
  return {
    asunto: `Confirmado: te esperamos el ${EVENTO.fechaTexto.toLowerCase()} en el Desayuno de Inversionistas`,
    html: plantilla({
      preheader: `${EVENTO.fechaTexto}, ${EVENTO.horaTexto} · ${EVENTO.direccion}`,
      eyebrow: 'Asistencia confirmada',
      titulo: `¡Gracias, ${esc(a.nombre)}! Tu lugar está reservado`,
      cuerpo: `<p style="margin:0 0 12px">Confirmamos tu asistencia al <strong>${esc(EVENTO.titulo)}</strong>. ${esc(EVENTO.descripcion)}</p>${acomp}`,
      botones: botonesCalendario(urls.ics),
      urlCancelar: urls.cancelar,
    }),
  };
}

export function correoRecordatorio(tipo, a, urls) {
  // A quienes el equipo inscribió sin celular, el recordatorio de 2 días les pide celular, estacionamiento y patente.
  const faltanDatos = !a.telefono;
  const textos = {
    r2d: {
      asunto: 'Faltan 2 días para el Desayuno de Inversionistas Modelo IGR',
      eyebrow: 'Faltan 2 días',
      titulo: `${esc(a.nombre)}, nos vemos este viernes`,
      cuerpo: `<p style="margin:0 0 12px">Te recordamos que este <strong>viernes 20 de noviembre a las 09:30</strong> compartiremos el estado actual de Pulso Inversor, sus resultados y las nuevas oportunidades que vienen.</p>${faltanDatos ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7E0;border:1px solid ${C.oro};border-radius:14px;margin:4px 0 14px"><tr><td style="padding:16px 18px;font-family:${FUENTE};font-size:15px;line-height:1.5;color:${C.texto}"><strong style="color:${C.verde}">🚗 ¿Necesitas estacionamiento?</strong><br>Déjanos tu <strong>celular</strong> y, si vienes en auto, la <strong>patente</strong>, para tener tu estacionamiento listo.<br><a href="${esc(urls.datos)}" target="_blank" style="display:inline-block;margin-top:10px;background:${C.lima};color:${C.verde};font-weight:bold;text-decoration:none;padding:11px 20px;border-radius:999px">Completar mis datos</a></td></tr></table>` : ''}<p style="margin:0">Si aún no lo agregas a tu calendario, puedes hacerlo aquí abajo.</p>`,
      botones: botonesCalendario(urls.ics),
    },
    r12h: {
      asunto: 'Mañana a las 09:30: Desayuno de Inversionistas Modelo IGR',
      eyebrow: 'Mañana',
      titulo: `${esc(a.nombre)}, mañana te esperamos a las 09:30`,
      cuerpo: `<p style="margin:0 0 12px">Mañana nos encontramos en la oficina de Grupo Matchmaking para el desayuno. Te recomendamos llegar unos minutos antes para comenzar puntualmente.</p><p style="margin:0">La oficina está en <strong>${esc(EVENTO.direccion)}</strong>.</p>`,
      botones: boton('Cómo llegar', EVENTO.mapa) + boton('Agregar a Google Calendar', enlaceGoogleCalendar(), false),
    },
    rhoy: {
      asunto: 'Hoy es el Desayuno de Inversionistas: te esperamos a las 09:30',
      eyebrow: 'Hoy es el desayuno',
      titulo: `¡Buenos días, ${esc(a.nombre)}! Te estamos esperando`,
      cuerpo: `<p style="margin:0 0 12px">Hoy a las <strong>09:30</strong> comienza el ${esc(EVENTO.titulo)}. Ya está todo listo para recibirte.</p><p style="margin:0">Si vas en camino y necesitas algo, escríbenos por WhatsApp.</p>`,
      botones: boton('Cómo llegar', EVENTO.mapa) + boton('Escribir por WhatsApp', wa(`Hola, soy ${a.nombre} ${a.apellidos} y voy en camino al desayuno`), false),
    },
    gracias: {
      asunto: 'Gracias por acompañarnos en el Desayuno de Inversionistas',
      eyebrow: 'Gracias por venir',
      titulo: `${esc(a.nombre)}, gracias por acompañarnos`,
      cuerpo: `<p style="margin:0 0 12px">Fue un gusto compartir contigo el estado actual de Pulso Inversor y las oportunidades que vienen.</p><p style="margin:0">Si quieres profundizar en alguna estrategia o revisar una operación en detalle, agenda una conversación con un asesor.</p>`,
      botones: boton('Agendar con un asesor', wa(`Hola, soy ${a.nombre} ${a.apellidos}. Estuve en el desayuno y quiero agendar una conversación`)) + boton('Simular mi inversión', 'https://pulsoinversor.cl/#simulador', false),
      sinDetalles: true,
    },
    ausente: {
      asunto: 'Te echamos de menos en el Desayuno de Inversionistas',
      eyebrow: 'Te echamos de menos',
      titulo: `${esc(a.nombre)}, nos faltaste hoy`,
      cuerpo: `<p style="margin:0 0 12px">Esta mañana compartimos el estado actual de Pulso Inversor, sus resultados y las nuevas oportunidades que vienen, y nos habría gustado verte.</p><p style="margin:0">Podemos contarte lo principal en una conversación breve con un asesor, cuando te acomode.</p>`,
      botones: boton('Agendar con un asesor', wa(`Hola, soy ${a.nombre} ${a.apellidos}. No pude ir al desayuno y me gustaría que me contaran lo principal`)) + boton('Simular mi inversión', 'https://pulsoinversor.cl/#simulador', false),
      sinDetalles: true,
    },
  };
  const t = textos[tipo];
  let html = plantilla({
    preheader: t.asunto,
    eyebrow: t.eyebrow,
    titulo: t.titulo,
    cuerpo: t.cuerpo,
    botones: t.botones,
    urlCancelar: t.sinDetalles ? null : urls.cancelar,
  });
  if (t.sinDetalles) html = html.replace(bloqueDetalles(), '');
  return { asunto: t.asunto, html };
}

// --- Avisos al equipo ------------------------------------------------------

export function correoEquipo(evento, a, urls) {
  const filas = [
    ['Nombre', `${a.nombre} ${a.apellidos}`],
    ['Email', a.email],
    ['WhatsApp', a.telefono],
    ['Acompañante', a.acompanante || 'No'],
    ['Estacionamiento', a.estacionamiento ? `Sí · patente ${a.patente || ''}` : 'No'],
    ['Acepta publicidad', a.acepta_publicidad ? 'Sí' : 'No'],
  ].map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:${C.gris}">${esc(k)}</td><td style="padding:6px 0;font-weight:bold">${esc(v)}</td></tr>`).join('');
  const titulo = { cancelacion: 'Canceló su asistencia', actualizacion: 'Actualizó su registro' }[evento] || 'Nueva confirmación';
  return {
    asunto: `${titulo}: ${a.nombre} ${a.apellidos} · Desayuno IGR`,
    html: `<div style="font-family:${FUENTE};font-size:15px;color:${C.texto}">
      <h2 style="color:${C.verde};margin:0 0 6px">${titulo}</h2>
      <p style="margin:0 0 14px;color:${C.gris}">${esc(EVENTO.titulo)} · ${esc(EVENTO.fechaTexto)}</p>
      <table cellpadding="0" cellspacing="0">${filas}</table>
      <p style="margin:18px 0 0"><a href="${esc(urls.panel)}" style="color:${C.verde2}">Ver la lista completa en el panel</a></p>
    </div>`,
  };
}
