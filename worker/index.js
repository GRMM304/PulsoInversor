// Pulso Inversor · Worker
// Sirve el sitio estático y atiende POST /api/enviar-simulacion:
//   1) envía al inversionista su simulación en PDF (adjunto), con un correo de marca que le presenta a su asesor;
//   2) envía a todos los asesores y a la dirección comercial un aviso con los datos y el mismo PDF;
//      el asesor asignado según el monto va como destinatario principal.
// Los correos salen por la API transaccional de Brevo.
//
// Configuración en Cloudflare (Workers > pulsoinversor > Settings > Variables and Secrets):
//   BREVO_API_KEY  (secreto, obligatorio)  clave de API de Brevo
//   SENDER_EMAIL   (opcional)  remitente verificado en Brevo. Por defecto: contacto@pulsoinversor.cl
//   EQUIPO_EMAIL   (opcional)  quienes reciben copia de TODAS las simulaciones, separados por coma.
//   FIRMA_SEGUIMIENTO (secreto)  firma de los enlaces del correo de seguimiento (ver seguimiento.js).
//
// Además programa el correo de seguimiento a las 48 horas y atiende /seguimiento/agendar y /seguimiento/encuesta.

import { informeSemanal } from './informe.js';
import { esPrueba, DEFAULT_SENDER, EQUIPO, MAX_PDF_BYTES, ORIGENES, TIPOS, ASESORES, asesoresPara, json, esc, clp, brevo, plantilla, boton, bloqueResumen, P, C, WHATSAPP } from './comun.js';
import { programarSeguimiento, rutaSeguimiento, HORAS_SEGUIMIENTO } from './seguimiento.js';
import { rutaPanel } from './panel.js';
import { recibirReunion } from './reuniones.js';
import { procesarRecordatorios } from './recordatorios.js';


function correoInversionista({ tipo, nombre, lineas, personas }) {
  const primer = esc(nombre.split(/\s+/)[0]);
  const varios = personas.length > 1;
  const quien = personas.map((a) => a.nombre).join(' y ');
  const quienCorto = personas.map((a) => a.nombre.split(' ')[0]).join(' y ');
  const cargo = varios ? 'cofundadores de Pulso' : (personas[0].cargo.toLowerCase().startsWith('asesora') ? 'tu asesora' : 'tu asesor');
  const wa = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(`Hola, soy ${nombre}. Hice mi simulación de ${tipo} y me gustaría revisarla con ${quienCorto}.`);
  return plantilla({
    preheader: `Tu simulación de ${tipo} va adjunta en PDF.`,
    eyebrow: `Tu simulación · ${tipo}`,
    titulo: `Gracias, ${primer}. Aquí está tu simulación`,
    cuerpo: P(`Te adjuntamos en PDF la simulación de <strong>${esc(tipo)}</strong> que hiciste en nuestro sitio, para que la revises con calma, la compartas con tu familia o se la muestres a tu abogado.`)
      + bloqueResumen(lineas)
      + P(`<strong>${esc(quien)}</strong>, ${cargo}, ${varios ? 'te escribirán' : 'te escribirá'} en las próximas horas hábiles para resolver tus dudas y, si quieres, mostrarte una operación real con su propiedad, su tasación y el documento que quedaría a tu favor.`)
      + P('No te vamos a pedir que decidas en esa conversación. Puedes venir con tu abogado cuando quieras.')
      + `<p style="margin:0 0 14px;font-size:13px;color:${C.gris}">La simulación es referencial: las condiciones finales dependen de la evaluación y del contrato de cada operación.</p>`,
    botones: boton('Conversar por WhatsApp', wa),
    pie: 'Recibes este correo porque pediste tu simulación en nuestro sitio.',
  });
}

function correoEquipo({ tipo, nombre, email, telefono, monto, lineas, personas, publicidad, consentimiento }) {
  const waCliente = telefono ? 'https://wa.me/56' + telefono.replace(/^56/, '') + '?text=' + encodeURIComponent(`Hola ${nombre.split(/\s+/)[0]}, te escribo de Pulso Inversor por la simulación de ${tipo} que hiciste en nuestro sitio.`) : '';
  const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'long', timeStyle: 'short' });
  const asignado = personas.map((a) => a.nombre).join(' y ');
  return plantilla({
    preheader: `${nombre} simuló ${tipo}${monto ? ' por ' + clp(monto) : ''}. Asignado a ${asignado}.`,
    eyebrow: `Nueva simulación · ${tipo}`,
    titulo: `${esc(nombre)}${monto ? ' · ' + clp(monto) : ''}`,
    cuerpo: P(`Asesor asignado: <strong>${esc(asignado)}</strong>. Al inversionista le dijimos que ${esc(personas.map((a) => a.nombre.split(' ')[0]).join(' y '))} le escribirá en las próximas horas hábiles.`)
      + bloqueResumen([`Nombre: ${nombre}`, `Correo: ${email}`, `Teléfono: ${telefono ? '+56 ' + telefono : '—'}`, `Simulador: ${tipo}`, `Monto simulado: ${monto ? clp(monto) : '—'}`, `Fecha: ${fecha}`, `Acepta recibir publicidad: ${publicidad ? 'Sí' : 'No'}${consentimiento ? ' (' + new Date(consentimiento).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' }) + ')' : ''}`])
      + bloqueResumen(lineas)
      + P('El PDF que recibió va adjunto. Si respondes este correo, le escribes directamente.'),
    botones: waCliente ? boton('Escribirle por WhatsApp', waCliente) : '',
    pie: 'Aviso interno de los simuladores de pulsoinversor.cl.',
  });
}

async function enviarSimulacion(request, env) {
  const origin = request.headers.get('origin') || '';
  if (origin && !ORIGENES.includes(origin)) return json({ ok: false, error: 'origen_no_permitido' }, 403);
  if (!env.BREVO_API_KEY) return json({ ok: false, error: 'correo_no_configurado' }, 503);

  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: 'json_invalido' }, 400); }
  if (d.website) return json({ ok: true }); // trampa para bots

  const tipo = TIPOS[d.tipo];
  const c = d.cliente || {};
  const nombre = String(c.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const email = String(c.email || '').trim().slice(0, 160);
  const telefono = String(c.telefono || '').replace(/\D/g, '').slice(0, 15);
  const publicidad = c.publicidad === true;
  const consentimiento = String(c.consentimiento || '').slice(0, 40);
  if (!tipo || nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'datos_invalidos' }, 400);

  const pdf = String(d.pdfBase64 || '').replace(/^data:application\/pdf;[^,]*,/, '');
  if (!pdf || !/^[A-Za-z0-9+/=]+$/.test(pdf) || pdf.length * 0.75 > MAX_PDF_BYTES) return json({ ok: false, error: 'pdf_invalido' }, 400);
  const archivo = String(d.archivo || 'simulacion-pulso-inversor.pdf').replace(/[^\w.\-]/g, '_').slice(0, 80);
  const lineas = Array.isArray(d.resumen) ? d.resumen.slice(0, 30).map((l) => String(l).slice(0, 200)) : [];
  const monto = Math.max(0, Math.min(Number(d.monto) || 0, 1e12));

  const personas = asesoresPara(monto);
  const sender = { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER };
  const adjunto = [{ content: pdf, name: archivo }];
  const equipo = (env.EQUIPO_EMAIL ? env.EQUIPO_EMAIL.split(',') : EQUIPO).map((s) => s.trim().toLowerCase()).filter(Boolean);
  // Todos los asesores reciben el PDF para prepararse; el asignado va en "Para" y el resto en copia.
  const todosAsesores = ASESORES.flatMap((g) => g.personas.map((a) => a.email.toLowerCase()));
  const paraAsesores = personas.map((a) => a.email.toLowerCase());
  const copias = [...new Set([...todosAsesores, ...equipo])].filter((e) => !paraAsesores.includes(e));

  // 0) Registro en la base (para el panel). Si falla, igual se envían los correos.
  const grupo = ASESORES.findIndex((g) => g.personas === personas);
  let id = null;
  if (env.DB) {
    try {
      const r = await env.DB.prepare('INSERT INTO simulaciones (creado, nombre, email, telefono, tipo, monto, grupo, asesor, publicidad) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id')
        .bind(new Date().toISOString(), nombre, email, telefono, tipo, Math.round(monto), grupo, personas.map((a) => a.nombre).join(' y '), publicidad ? 1 : 0).first();
      id = r && r.id;
    } catch (e) { console.error('db insert', e); }
  }

  // 1) Correo al inversionista (responde directo a su asesor)
  await brevo(env, {
    sender, to: [{ email, name: nombre }],
    replyTo: { email: personas[0].email, name: personas[0].nombre },
    subject: `Tu simulación de ${tipo} · Pulso Inversor`,
    htmlContent: correoInversionista({ tipo, nombre, lineas, personas }),
    attachment: adjunto,
    tags: ['simulacion', d.tipo],
  }, email);

  // 2) Aviso al asesor asignado, con copia a la dirección comercial
  await brevo(env, {
    sender,
    to: personas.map((a) => ({ email: a.email, name: a.nombre })),
    cc: copias.length ? copias.map((e) => ({ email: e })) : undefined,
    replyTo: { email, name: nombre },
    subject: `Nueva simulación ${tipo}${monto ? ' · ' + clp(monto) : ''} · ${nombre}`,
    htmlContent: correoEquipo({ tipo, nombre, email, telefono, monto, lineas, personas, publicidad, consentimiento }),
    attachment: adjunto,
    tags: ['simulacion-equipo', d.tipo],
  }, email);

  // 3) Correo de seguimiento programado a las 48 horas (si falla, no afecta lo anterior)
  let seguimiento = 'no';
  try {
    seguimiento = await programarSeguimiento(env, { id, nombre, email, telefono, tipo, monto, grupo });
  } catch (e) { console.error('seguimiento', e); seguimiento = 'error: ' + String(e.message || e).slice(0, 150); }
  console.log('simulacion', d.tipo, id, 'seguimiento', seguimiento);
  if (env.DB && id) {
    const ok = !/^(error|sin_firma)/.test(seguimiento);
    await env.DB.prepare('UPDATE simulaciones SET seguimiento_estado = ?, seguimiento_para = ? WHERE id = ?')
      .bind(ok ? 'programado' : seguimiento, ok ? new Date(Date.now() + (esPrueba(email) ? 3 * 60e3 : HORAS_SEGUIMIENTO * 3600e3)).toISOString() : null, id).run().catch((e) => console.error('db seg', e));
  }

  return json({ ok: true, asesor: personas.map((a) => a.nombre).join(' y ') });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // El sitio vive en www.pulsoinversor.cl. pulsoinversor.cl redirige siempre; 1.pulsoinversor.cl redirige las páginas
    // pero sigue atendiendo /api, /seguimiento y /panel (webhooks de Brevo y enlaces de correos ya enviados).
    const interno = /^\/(api|seguimiento|panel)(\/|$)/.test(url.pathname);
    if (url.hostname === 'pulsoinversor.cl' || (url.hostname === '1.pulsoinversor.cl' && !interno && request.method === 'GET')) {
      return Response.redirect('https://www.pulsoinversor.cl' + url.pathname + url.search, 301);
    }
    // Una sola dirección por página (SEO): /nosotros.html → /nosotros y /index.html → / con 301.
    const html = url.pathname.match(/^\/(?:([a-z0-9-]+)\.html|index)$/);
    if (html && request.method === 'GET' && !/^\/simuladores-equipo/.test(url.pathname)) {
      const limpio = html[1] && html[1] !== 'index' ? '/' + html[1] : '/';
      return Response.redirect(url.origin + limpio + url.search, 301);
    }
    if (url.pathname === '/api/enviar-simulacion') {
      if (request.method !== 'POST') return json({ ok: false, error: 'metodo_no_permitido' }, 405);
      try { return await enviarSimulacion(request, env); }
      catch (e) { console.error(e); return json({ ok: false, error: 'envio_fallido' }, 502); }
    }
    // Los simuladores asistidos solo se ven en /panel/simuladores, con la clave del equipo.
    if (/^\/simuladores-equipo(\.html)?\/?$/.test(url.pathname)) return new Response('No encontrado', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    if (url.pathname.startsWith('/api/brevo-reuniones/')) return recibirReunion(request, env, url);
    if (url.pathname === '/panel' || url.pathname.startsWith('/panel/')) return rutaPanel(request, env, url);
    if (url.pathname.startsWith('/seguimiento/')) {
      try { const r = await rutaSeguimiento(request, env, url); if (r) return r; }
      catch (e) { console.error(e); return new Response('No pudimos procesar tu solicitud. Escríbenos por WhatsApp al +56 9 5879 2038.', { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
    }
    return env.ASSETS.fetch(request);
  },
  // Cron cada minuto: recordatorios de reuniones (24 h, 1 h y 1 minuto antes).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(procesarRecordatorios(env).then((r) => { if (r.enviados) console.log('recordatorios', JSON.stringify(r)); }).catch((e) => console.error('recordatorios', e)));
    // Informe semanal: lunes 10:00 (Chile), una vez por semana.
    ctx.waitUntil(informeSemanal(env).then((r) => { if (r) console.log('informe', JSON.stringify(r)); }).catch((e) => console.error('informe', e)));
  },
};

