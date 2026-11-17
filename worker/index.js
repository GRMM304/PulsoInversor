// Pulso Inversor · Worker
// Sirve el sitio estático y atiende POST /api/enviar-simulacion:
//   1) envía al cliente su simulación en PDF (adjunto) al correo que registró;
//   2) envía a Pulso un correo de notificación con los datos y el mismo PDF.
// Los correos salen por la API transaccional de Brevo.
//
// Configuración en Cloudflare (Workers > pulsoinversor > Settings > Variables and Secrets):
//   BREVO_API_KEY  (secreto, obligatorio)  clave de API de Brevo (SMTP & API > API Keys)
//   SENDER_EMAIL   (opcional)  remitente verificado en Brevo. Por defecto: contacto@pulsoinversor.cl
//   NOTIFY_EMAIL   (opcional)  quién recibe las notificaciones. Por defecto: contacto@pulsoinversor.cl

const DEFAULT_SENDER = 'contacto@pulsoinversor.cl';
const DEFAULT_NOTIFY = 'contacto@pulsoinversor.cl';
const MAX_PDF_BYTES = 3 * 1024 * 1024;
const ORIGENES = ['https://1.pulsoinversor.cl', 'http://localhost:8787', 'http://127.0.0.1:8787'];
const TIPOS = {
  proyecta: 'Proyecta un Hogar',
  hipoteca: 'Hipoteca Inteligente',
  circular: 'Inversión Inmobiliaria Circular',
};

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function brevo(env, payload) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Brevo ' + r.status + ': ' + (await r.text()).slice(0, 300));
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
  const nombre = String(c.nombre || '').trim().slice(0, 120);
  const email = String(c.email || '').trim().slice(0, 160);
  const telefono = String(c.telefono || '').replace(/\D/g, '').slice(0, 15);
  if (!tipo || nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'datos_invalidos' }, 400);

  const pdf = String(d.pdfBase64 || '').replace(/^data:application\/pdf;[^,]*,/, '');
  if (!pdf || !/^[A-Za-z0-9+/=]+$/.test(pdf) || pdf.length * 0.75 > MAX_PDF_BYTES) return json({ ok: false, error: 'pdf_invalido' }, 400);
  const archivo = String(d.archivo || 'simulacion-pulso-inversor.pdf').replace(/[^\w.\-]/g, '_').slice(0, 80);
  const lineas = Array.isArray(d.resumen) ? d.resumen.slice(0, 30).map((l) => String(l).slice(0, 200)) : [];

  const sender = { name: 'Pulso Inversor', email: env.SENDER_EMAIL || DEFAULT_SENDER };
  const notify = env.NOTIFY_EMAIL || DEFAULT_NOTIFY;
  const adjunto = [{ content: pdf, name: archivo }];
  const primerNombre = esc(nombre.split(/\s+/)[0]);
  const lista = lineas.map((l) => '<li>' + esc(l) + '</li>').join('');

  // 1) Correo al cliente
  await brevo(env, {
    sender, to: [{ email, name: nombre }], replyTo: { email: notify, name: 'Pulso Inversor' },
    subject: 'Tu simulación de ' + tipo + ' · Pulso Inversor',
    htmlContent: '<div style="font-family:Arial,sans-serif;color:#1F2523;line-height:1.55;max-width:560px">'
      + '<p>Hola ' + primerNombre + ',</p>'
      + '<p>Te enviamos la simulación de <b>' + esc(tipo) + '</b> que hiciste en nuestro sitio. La encontrarás en el PDF adjunto.</p>'
      + (lista ? '<ul>' + lista + '</ul>' : '')
      + '<p>Los resultados son referenciales. Si quieres revisarlos con calma, responde este correo o escríbenos por WhatsApp al +56 9 8355 4676 y un asesor te acompaña.</p>'
      + '<p>Equipo Pulso Inversor<br><span style="color:#7B8783">Una empresa de Grupo Matchmaking</span></p></div>',
    attachment: adjunto,
  });

  // 2) Notificación a Pulso
  await brevo(env, {
    sender, to: [{ email: notify, name: 'Pulso Inversor' }], replyTo: { email, name: nombre },
    subject: 'Nueva simulación: ' + tipo + ' · ' + nombre,
    htmlContent: '<div style="font-family:Arial,sans-serif;color:#1F2523;line-height:1.5">'
      + '<p><b>Nueva simulación desde 1.pulsoinversor.cl</b></p>'
      + '<p><b>Simulador:</b> ' + esc(tipo) + '<br><b>Nombre:</b> ' + esc(nombre) + '<br><b>Correo:</b> ' + esc(email)
      + '<br><b>Teléfono:</b> +56 ' + esc(telefono) + '<br><b>Fecha:</b> ' + esc(new Date().toISOString()) + '</p>'
      + (lista ? '<p><b>Resumen</b></p><ul>' + lista + '</ul>' : '')
      + '<p>El PDF que recibió el cliente va adjunto.</p></div>',
    attachment: adjunto,
  });

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/enviar-simulacion') {
      if (request.method !== 'POST') return json({ ok: false, error: 'metodo_no_permitido' }, 405);
      try { return await enviarSimulacion(request, env); }
      catch (e) { console.error(e); return json({ ok: false, error: 'envio_fallido' }, 502); }
    }
    return env.ASSETS.fetch(request);
  },
};
