// API de conversiones de Meta (servidor → píxel Sitio_Pulso_Inversor).
// Secreto META_CAPI_TOKEN. Opcional META_TEST_CODE: si existe, los eventos van como prueba (pestaña "Probar eventos"
// del Administrador de eventos) y no cuentan para las campañas.
// Eventos: Schedule (reunión reservada en Brevo), ReunionRealizada (reunión iniciada) y Purchase (el equipo marca
// "Invirtió" en el panel). Con la configuración básica de Meta, lo que más importa es el nombre del evento.
export const PIXEL_ID = '4384764601785320';
const VERSION = 'v21.0';

async function sha256(texto) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Datos de la persona normalizados y cifrados (SHA-256), como pide Meta.
async function datosPersona({ email, telefono, nombre }) {
  const ud = { country: [await sha256('cl')] };
  const em = String(email || '').trim().toLowerCase();
  if (em) { ud.em = [await sha256(em)]; ud.external_id = [await sha256(em)]; }
  let ph = String(telefono || '').replace(/\D/g, '');
  if (ph.length === 9) ph = '56' + ph;
  if (ph.length >= 10) ud.ph = [await sha256(ph)];
  const partes = String(nombre || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (partes[0]) ud.fn = [await sha256(partes[0])];
  if (partes.length > 1) ud.ln = [await sha256(partes[partes.length - 1])];
  return ud;
}

// Envía un evento. eventoId evita duplicados si Brevo repite el aviso. Nunca lanza error: solo lo registra.
export async function eventoMeta(env, { nombreEvento, eventoId, persona, datos, cuando }) {
  if (!env.META_CAPI_TOKEN) return { omitido: 'sin token' };
  try {
    const cuerpo = {
      data: [{
        event_name: nombreEvento,
        event_time: Math.floor((cuando ? Date.parse(cuando) : Date.now()) / 1000),
        event_id: eventoId,
        action_source: 'system_generated',
        user_data: await datosPersona(persona || {}),
        custom_data: datos || undefined,
      }],
      access_token: env.META_CAPI_TOKEN,
    };
    if (env.META_TEST_CODE) cuerpo.test_event_code = env.META_TEST_CODE;
    const r = await fetch(`https://graph.facebook.com/${VERSION}/${PIXEL_ID}/events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
    const t = await r.text();
    if (!r.ok) { console.error('meta', nombreEvento, r.status, t.replace(/EAA\w+/g, '[token]').slice(0, 300)); return { ok: false }; }
    return { ok: true };
  } catch (e) {
    console.error('meta', nombreEvento, String(e).slice(0, 200));
    return { ok: false };
  }
}
