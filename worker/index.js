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
import { eventoMeta, datosWeb } from './meta.js';
import { whatsappSimulacion, telefonoChile } from './respondio.js';
import { recibirRespondio, avanzarNegocio } from './crm.js';
import { avisoWhatsapp, esPrueba, DEFAULT_SENDER, EQUIPO, MAX_PDF_BYTES, ORIGENES, TIPOS, ASESORES, asesoresPara, json, esc, clp, brevo, plantilla, boton, bloqueResumen, P, C, WHATSAPP } from './comun.js';
import { programarSeguimiento, rutaSeguimiento, HORAS_SEGUIMIENTO } from './seguimiento.js';
import { rutaPanel } from './panel.js';
import { rutaAsesores } from './asesores.js';
import { recibirReunion } from './reuniones.js';
import { procesarRecordatorios } from './recordatorios.js';


function correoInversionista({ tipo, nombre, lineas, personas, conWhatsapp }) {
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
      + P(`<strong>${esc(quien)}</strong>, ${cargo}, ${varios ? 'se contactarán contigo' : 'se contactará contigo'} en las próximas horas hábiles para resolver tus dudas y, si quieres, mostrarte una operación real con su propiedad, su tasación y el documento que quedaría a tu favor.`)
      + (conWhatsapp ? P('También te escribirá <strong>Lorenzo</strong>, de nuestro equipo, por WhatsApp para saber si tienes dudas.') : '')
      + `<p style="margin:0 0 14px;font-size:13px;color:${C.gris}">La simulación es referencial: las condiciones finales dependen de la evaluación y del contrato de cada operación.</p>`,
    botones: boton('Conversar por WhatsApp', wa),
    pie: 'Recibes este correo porque pediste tu simulación en nuestro sitio.',
  });
}

function correoEquipo({ tipo, nombre, email, telefono, monto, edad, lineas, personas, publicidad, consentimiento }) {
  const fecha = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'long', timeStyle: 'short' });
  const asignado = personas.map((a) => a.nombre).join(' y ');
  return plantilla({
    preheader: `${nombre} simuló ${tipo}${monto ? ' por ' + clp(monto) : ''}. Asignado a ${asignado}.`,
    eyebrow: `Nueva simulación · ${tipo}`,
    titulo: `${esc(nombre)}${monto ? ' · ' + clp(monto) : ''}`,
    cuerpo: P(`Asesor asignado: <strong>${esc(asignado)}</strong>. Al inversionista le dijimos que ${esc(personas.map((a) => a.nombre.split(' ')[0]).join(' y '))} le escribirá en las próximas horas hábiles.`)
      + bloqueResumen([`Nombre: ${nombre}`, `Correo: ${email}`, `Teléfono: ${telefono ? '+56 ' + telefono : '—'}`, `Edad: ${edad || '—'}`, `Simulador: ${tipo}`, `Monto simulado: ${monto ? clp(monto) : '—'}`, `Fecha: ${fecha}`, `Acepta recibir publicidad: ${publicidad ? 'Sí' : 'No'}${consentimiento ? ' (' + new Date(consentimiento).toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' }) + ')' : ''}`])
      + bloqueResumen(lineas)
      + avisoWhatsapp(telefono)
      + P('El PDF que recibió va adjunto. Si respondes este correo, le escribes directamente.'),
    botones: '',
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
  const edad = String(c.edad ?? '').trim().slice(0, 20) || null;   // rango de edad; define el asesor (menos de 40 → Renato; 40 o más → Pamela)
  if (!tipo || nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'datos_invalidos' }, 400);

  const pdf = String(d.pdfBase64 || '').replace(/^data:application\/pdf;[^,]*,/, '');
  if (!pdf || !/^[A-Za-z0-9+/=]+$/.test(pdf) || pdf.length * 0.75 > MAX_PDF_BYTES) return json({ ok: false, error: 'pdf_invalido' }, 400);
  const archivo = String(d.archivo || 'simulacion-pulso-inversor.pdf').replace(/[^\w.\-]/g, '_').slice(0, 80);
  const lineas = Array.isArray(d.resumen) ? d.resumen.slice(0, 30).map((l) => String(l).slice(0, 200)) : [];
  const monto = Math.max(0, Math.min(Number(d.monto) || 0, 1e12));

  const personas = asesoresPara(edad);
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
      const r = await env.DB.prepare('INSERT INTO simulaciones (creado, nombre, email, telefono, tipo, monto, grupo, asesor, publicidad, edad) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id')
        .bind(new Date().toISOString(), nombre, email, telefono, tipo, Math.round(monto), grupo, personas.map((a) => a.nombre).join(' y '), publicidad ? 1 : 0, edad).first();
      id = r && r.id;
    } catch (e) { console.error('db insert', e); }
  }

  // 1) Correo al inversionista (responde directo a su asesor)
  await brevo(env, {
    sender, to: [{ email, name: nombre }],
    replyTo: { email: personas[0].email, name: personas[0].nombre },
    subject: `Tu simulación de ${tipo} · Pulso Inversor`,
    htmlContent: correoInversionista({ tipo, nombre, lineas, personas, conWhatsapp: !d.equipo && !!telefonoChile(telefono) && !!env.RESPONDIO_TOKEN }),
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
    htmlContent: correoEquipo({ tipo, nombre, email, telefono, monto, edad, lineas, personas, publicidad, consentimiento }),
    attachment: adjunto,
    tags: ['simulacion-equipo', d.tipo],
  }, email);

  // 3) Correo de seguimiento programado a las 48 horas (si falla, no afecta lo anterior)
  let seguimiento = 'no';
  try {
    seguimiento = await programarSeguimiento(env);
  } catch (e) { console.error('seguimiento', e); seguimiento = 'error: ' + String(e.message || e).slice(0, 150); }
  console.log('simulacion', d.tipo, id, 'seguimiento', seguimiento);
  if (env.DB && id) {
    const ok = !/^(error|sin_firma)/.test(seguimiento);
    await env.DB.prepare('UPDATE simulaciones SET seguimiento_estado = ?, seguimiento_para = ? WHERE id = ?')
      .bind(ok ? 'pendiente' : seguimiento, ok ? new Date(Date.now() + (esPrueba(email) ? 3 * 60e3 : HORAS_SEGUIMIENTO * 3600e3)).toISOString() : null, id).run().catch((e) => console.error('db seg', e));
  }

  // 4) WhatsApp (respond.io): Lorenzo le escribe al inversionista con la plantilla aprobada y lo deja en respond.io
  //    con rango de edad, estrategia y monto. No se envía desde los simuladores asistidos del equipo.
  if (!d.equipo) {
    const wa = await whatsappSimulacion(env, { nombre, email, telefono, edad, tipo, monto, asesor: personas.map((a) => a.nombre).join(' y ') });
    console.log('whatsapp simulacion', id, JSON.stringify(wa));
    if (env.DB && id) await env.DB.prepare('UPDATE simulaciones SET whatsapp = ? WHERE id = ?').bind(wa.ok ? 'enviado ' + new Date().toISOString() : (wa.omitido ? 'omitido: ' + wa.omitido : 'error: ' + (wa.error || '')).slice(0, 200), id).run().catch(() => {});
  }

  // 5) CRM (Brevo): negocio en el embudo de Pulso Inversor ("Nuevo lead"), salvo pruebas y simuladores del equipo.
  if (!d.equipo && !esPrueba(email)) {
    const neg = await avanzarNegocio(env, { email }, 'Nuevo lead', { nombre, estrategia: tipo, monto });
    if (neg && neg.ok === false) console.error('crm simulacion', neg.error);
  }

  // 6) Meta (API de conversiones): el mismo SubmitApplication que envió el navegador, con el mismo ID para no duplicarlo.
  //    Llega aunque la persona tenga bloqueador de anuncios. No se envía en pruebas ni desde los simuladores del equipo.
  const metaId = String(d.metaEventId || '').slice(0, 80);
  if (metaId && !esPrueba(email)) {
    await eventoMeta(env, {
      nombreEvento: 'SubmitApplication', eventoId: metaId, web: datosWeb(request, d.pageUrl),
      persona: { email, telefono, nombre }, datos: monto ? { value: monto, currency: 'CLP', content_name: tipo } : { content_name: tipo },
    });
  }

  return json({ ok: true, asesor: personas.map((a) => a.nombre).join(' y ') });
}

// Lead del formulario de acceso a los simuladores, también desde el servidor (mismo ID que el del navegador).
async function metaLead(request, env) {
  const origin = request.headers.get('origin') || '';
  if (origin && !ORIGENES.includes(origin)) return json({ ok: false }, 403);
  let d; try { d = await request.json(); } catch (e) { return json({ ok: false }, 400); }
  const email = String(d.email || '').trim().slice(0, 160);
  const eventoId = String(d.eventId || '').slice(0, 80);
  if (d.website || !eventoId || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || esPrueba(email)) return json({ ok: true });
  await eventoMeta(env, {
    nombreEvento: 'Lead', eventoId, web: datosWeb(request, d.pageUrl),
    persona: { email, telefono: String(d.telefono || '').replace(/\D/g, '').slice(0, 15), nombre: String(d.nombre || '').slice(0, 120) },
    datos: { content_name: 'Desbloqueó simuladores' },
  });
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Presentación comercial: solo en presentacion.pulsoinversor.cl (no enlazada ni indexada). En los otros dominios no existe.
    if (url.hostname === 'presentacion.pulsoinversor.cl') {
      if (url.pathname === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
      // / = la presentación; /simuladores = los tres simuladores sin pedir clave ni datos (la vista del equipo).
      // /assets y /api siguen su curso normal; cualquier otra ruta va al sitio en www.
      const pagina = url.pathname === '/' ? '/presentacion/' : /^\/simuladores\/?$/.test(url.pathname) ? '/simuladores-equipo' : null;
      if (pagina) {
        let r = await env.ASSETS.fetch(new Request(new URL(pagina, url)));
        // En los simuladores de la presentación no va el menú del sitio (ni barra inferior, pie ni chat): solo el logo, que vuelve a la presentación.
        if (pagina === '/simuladores-equipo') r = new HTMLRewriter()
          .on('head', { element: (e) => e.append('<style>.header nav,.header .nav-actions,.header .mobile-toggle,.tabbar,.footer{display:none!important}</style>', { html: true }) })
          .on('script[src*="lorenzo.js"]', { element: (e) => e.remove() })
          .transform(r);
        return new Response(r.body, { status: r.status, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'no-cache' } });
      }
      if (!/^\/(assets\/|api\/|manifest\.webmanifest$)/.test(url.pathname)) return Response.redirect('https://www.pulsoinversor.cl' + url.pathname + url.search, 301);
    }
    if (/^\/presentacion(\/|$)/.test(url.pathname)) {
      const r = await env.ASSETS.fetch(new Request(new URL('/404', url)));
      return new Response(r.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
    }
    // El sitio vive en www.pulsoinversor.cl. pulsoinversor.cl redirige siempre; 1.pulsoinversor.cl redirige las páginas
    // pero sigue atendiendo /api, /seguimiento y /panel (webhooks de Brevo y enlaces de correos ya enviados).
    const interno = /^\/(api|seguimiento|panel)(\/|$)/.test(url.pathname);
    // Páginas en etapa de prueba (stage): solo se ven en 1.pulsoinversor.cl; en www no existen.
    const enStage = /^\/inversion-circular(\.html)?\/?$/.test(url.pathname);
    if (enStage && url.hostname !== '1.pulsoinversor.cl') {
      const r = await env.ASSETS.fetch(new Request(new URL('/404', url)));
      return new Response(r.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
    }
    if (url.hostname === 'pulsoinversor.cl' || (url.hostname === '1.pulsoinversor.cl' && !interno && !enStage && request.method === 'GET')) {
      return Response.redirect('https://www.pulsoinversor.cl' + url.pathname + url.search, 301);
    }
    // Una sola dirección por página (SEO): /nosotros.html → /nosotros y /index.html → / con 301.
    const html = url.pathname.match(/^\/(?:([a-z0-9-]+)\.html|index)$/);
    if (html && request.method === 'GET' && !/^\/simuladores-equipo/.test(url.pathname)) {
      const limpio = html[1] && html[1] !== 'index' ? '/' + html[1] : '/';
      return Response.redirect(url.origin + limpio + url.search, 301);
    }
    if (url.pathname === '/api/respondio-webhook') return recibirRespondio(request, env, url);
    if (url.pathname === '/api/meta-lead') {
      if (request.method !== 'POST') return json({ ok: false, error: 'metodo_no_permitido' }, 405);
      try { return await metaLead(request, env); } catch (e) { console.error('meta-lead', e); return json({ ok: false }, 500); }
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
    if (url.pathname === '/asesores' || url.pathname.startsWith('/asesores/')) {
      try { return await rutaAsesores(request, env, url); }
      catch (e) { console.error('asesores', e); return new Response('No pudimos cargar el portal. Intenta de nuevo en un momento.', { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
    }
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

