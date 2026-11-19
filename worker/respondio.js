// WhatsApp de Pulso Inversor (respond.io): al enviar una simulación, Lorenzo le escribe al inversionista con la
// plantilla aprobada "simulacion_enviada", y el contacto queda en respond.io con su rango de edad, estrategia y monto
// (campos que usan Lorenzo y los flujos para derivar a Renato o Pamela). Secreto: RESPONDIO_TOKEN.
// Nunca lanza error: si algo falla, lo registra y el correo de la simulación sigue su curso.
import { edadMin } from './comun.js';
const API = 'https://api.respond.io/v2';
export const CANAL_WHATSAPP = 580663;           // WhatsApp Business +56 9 5879 2038
export const USUARIO_LORENZO = 76268113;        // agente Lorenzo en respond.io
const PLANTILLA = { name: 'simulacion_enviada', languageCode: 'es_CL' };

async function llamar(env, metodo, ruta, cuerpo) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { Authorization: 'Bearer ' + env.RESPONDIO_TOKEN, 'content-type': 'application/json', accept: 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${ruta.split('/').slice(0, 3).join('/')} ${r.status}: ${t.slice(0, 200)}`);
  try { return JSON.parse(t); } catch (e) { return {}; }
}

// Teléfono chileno en formato internacional (+569XXXXXXXX). Devuelve null si no parece un celular válido.
export function telefonoChile(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.startsWith('56')) d = d.slice(2);
  if (d.length === 8) d = '9' + d;
  return /^9\d{8}$/.test(d) ? '+56' + d : null;
}

export async function whatsappSimulacion(env, { nombre, email, telefono, edad, tipo, monto, asesor }) {
  if (!env.RESPONDIO_TOKEN) return { omitido: 'sin token' };
  const fono = telefonoChile(telefono);
  if (!fono) return { omitido: 'teléfono no válido' };
  const id = encodeURIComponent('phone:' + fono);
  const partes = String(nombre || '').trim().split(/\s+/);
  const pasos = [];
  try {
    // 1) Contacto con sus datos (crea o actualiza).
    const campos = [{ name: 'estrategia_pulso', value: tipo }];
    if (edad) campos.push({ name: 'rango_de_edad_pulso', value: edadMin(edad) >= 40 ? '41 y más' : 'Hasta 40' });
    if (monto) campos.push({ name: 'monto_pulso', value: Math.round(monto) });
    await llamar(env, 'POST', `/contact/create_or_update/${id}`, {
      firstName: partes[0] || '', lastName: partes.slice(1).join(' '), phone: fono, email: email || undefined, language: 'es', countryCode: 'CL', custom_fields: campos,
    });
    pasos.push('contacto');
    // 2) Mensaje de Lorenzo con la plantilla aprobada.
    await llamar(env, 'POST', `/contact/${id}/message`, {
      channelId: CANAL_WHATSAPP,
      message: {
        type: 'whatsapp_template',
        template: {
          ...PLANTILLA,
          components: [{ type: 'body', parameters: [
            { type: 'text', text: partes[0] || 'Hola' },
            { type: 'text', text: tipo },
            { type: 'text', text: asesor },
          ] }],
        },
      },
    });
    pasos.push('mensaje');
    // 3) La conversación queda con Lorenzo, que responde y deriva al asesor según el rango de edad.
    await llamar(env, 'POST', `/contact/${id}/conversation/assignee`, { assignee: USUARIO_LORENZO }).then(() => pasos.push('asignado'), (e) => console.error('respondio asignar', e.message));
    return { ok: true, pasos };
  } catch (e) {
    console.error('respondio', pasos.join('>'), e.message);
    return { ok: false, pasos, error: e.message.slice(0, 200) };
  }
}

// ---------- Plantillas de WhatsApp para el flujo de reuniones ----------
// Se envía una plantilla solo si está APROBADA en respond.io (se revisa cada 10 minutos). Así se pueden ir creando de a poco.
let cachePlantillas = null;
async function plantillasAprobadas(env) {
  if (cachePlantillas && Date.now() - cachePlantillas.t < 10 * 60e3) return cachePlantillas.v;
  const d = await llamar(env, 'GET', `/space/channel/${CANAL_WHATSAPP}/template`);
  const v = new Map((d.items || []).filter((t) => t.status === 'approved').map((t) => [t.name, t.languageCode || 'es_CL']));
  cachePlantillas = { t: Date.now(), v };
  return v;
}

export async function whatsappPlantilla(env, { telefono, nombre, email, plantilla, variables }) {
  if (!env.RESPONDIO_TOKEN) return { omitido: 'sin token' };
  const fono = telefonoChile(telefono);
  if (!fono) return { omitido: 'sin teléfono válido' };
  try {
    const aprobadas = await plantillasAprobadas(env);
    if (!aprobadas.has(plantilla)) return { omitido: 'plantilla no aprobada: ' + plantilla };
    const id = encodeURIComponent('phone:' + fono);
    const partes = String(nombre || '').trim().split(/\s+/);
    await llamar(env, 'POST', `/contact/create_or_update/${id}`, { firstName: partes[0] || '', lastName: partes.slice(1).join(' '), phone: fono, email: email || undefined, language: 'es', countryCode: 'CL' });
    await llamar(env, 'POST', `/contact/${id}/message`, {
      channelId: CANAL_WHATSAPP,
      message: { type: 'whatsapp_template', template: { name: plantilla, languageCode: aprobadas.get(plantilla), components: [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: String(v || '-').slice(0, 900) })) }] } },
    });
    return { ok: true };
  } catch (e) {
    console.error('whatsapp', plantilla, e.message);
    return { ok: false, error: e.message.slice(0, 200) };
  }
}
