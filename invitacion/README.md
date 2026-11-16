# Invitación · Desayuno de Inversionistas Modelo IGR

Invitación interactiva con confirmación de asistencia, correos automáticos y base de asistentes, todo en Cloudflare.

- **Invitación:** https://invitacion.pulsoinversor.cl (para abrir directo el formulario: `?confirmar=1`; para saber de dónde llegó cada persona: `?origen=whatsapp`, `?origen=mailing`, etc.)
- **Panel de asistencia:** https://invitacion.pulsoinversor.cl/panel (clave del equipo)
- **Evento:** viernes 20 de noviembre de 2026, 09:30 a 11:00 · Oficina Grupo Matchmaking, Los Militares 5890, oficina 304, Las Condes

## Cómo funciona

| Pieza | Servicio de Cloudflare | Qué hace |
|---|---|---|
| Página y formulario | Worker `pulso-invitacion-desayuno` (archivos en `public/`) | Muestra la invitación. El botón "Confirmar asistencia" de la imagen abre el formulario. |
| Base de asistentes | D1 `pulso-invitacion-desayuno` | Guarda cada confirmación, cancelación, llegada y correo enviado. |
| Envíos automáticos | Cron Trigger cada 5 minutos | Revisa qué correos corresponden y los envía. |
| Correo | API de Brevo (cuenta de Pulso, dominio pulsoinversor.cl ya autenticado) | Entrega los correos. Remitente: contacto@pulsoinversor.cl. |

## Correos

| Correo | Cuándo (hora de Chile) | A quién |
|---|---|---|
| Confirmación (con archivo de calendario .ics) | Al confirmar | La persona que confirma |
| Faltan 2 días | Miércoles 18, 09:30 | Confirmados antes de esa hora |
| Mañana a las 09:30 | Jueves 19, 21:30 (12 h antes) | Confirmados antes de esa hora |
| Hoy es el desayuno | Viernes 20, 07:30 | Confirmados antes de esa hora |
| Gracias por acompañarnos | Viernes 20, 16:00 | Marcados como "Llegó" en el panel |
| Te echamos de menos | Viernes 20, 16:00 | Confirmados que no fueron marcados |
| Aviso al equipo | Al confirmar, actualizar o cancelar | contacto@pulsoinversor.cl |

Reglas:
- Quien cancela deja de recibir correos.
- Quien confirma después de un recordatorio no lo recibe tarde (ya recibió la confirmación); queda como "—" en el panel.
- Cada recordatorio tiene una ventana: si por algún motivo no salió a tiempo, no se envía tarde.
- El seguimiento de las 16:00 **solo sale si se marcó al menos una llegada** en el panel, para no enviar "te echamos de menos" a todos por error. Si se marca después de las 16:00, sale en la siguiente revisión (hasta el domingo 22).
- Si un correo falla (o falta la clave de Brevo), la confirmación se reintenta cada 5 minutos y el panel muestra ⚠.
- El enlace "¿No podrás asistir?" pide confirmar con un botón, para que los antivirus de correo no cancelen al abrir el enlace.

Textos de los correos: `src/emails.js`. Fechas y horarios: `src/evento.js`.

## Base de datos (tabla `asistentes`)

| Columna | Qué guarda |
|---|---|
| `id` | Número interno |
| `token` | Código privado del enlace de cancelación |
| `nombre`, `apellidos` | Datos del asistente |
| `email` | Único: si alguien confirma dos veces con el mismo email, se actualiza su registro |
| `telefono` | WhatsApp con código de país |
| `acompanante` | Nombre del acompañante, vacío si viene solo |
| `acepta_privacidad` | 1 = aceptó la Política de privacidad (obligatorio para confirmar) |
| `acepta_publicidad` | 1 = aceptó recibir publicidad (opcional, viene sin marcar) |
| `estado` | `confirmado` o `cancelado` |
| `origen` | De dónde llegó (parámetro `?origen=` del enlace) |
| `creado`, `actualizado`, `cancelado` | Fechas (UTC) |
| `asistio`, `llegada` | Marcado de llegada desde el panel y su hora |
| `enviado_confirmacion`, `enviado_r2d`, `enviado_r12h`, `enviado_rhoy`, `enviado_post` | Fecha de cada correo; `omitido` si no correspondía; vacío si está pendiente |
| `ultimo_error` | Último error de envío, si hubo |

Estructura completa: `schema.sql`.

## Panel de asistencia

- Totales: registros, personas (con acompañantes), llegadas y cancelaciones.
- Lista con buscador, estado de cada correo y botón **Marcar llegada** para usar en la puerta el día del evento (funciona en el celular).
- **Descargar Excel (CSV)** con toda la base.

Consultas directas a la base (requiere acceso a la cuenta de Cloudflare):

```
npx wrangler d1 execute pulso-invitacion-desayuno --remote --command "SELECT nombre, apellidos, email, estado, asistio FROM asistentes"
```

## Configuración

`wrangler.jsonc`:
- `CUPOS`: límite de personas (cada acompañante suma 1). `0` = sin límite. Al llenarse, el formulario avisa que no quedan cupos.
- `REMITENTE_EMAIL`, `RESPONDER_A`, `AVISO_EQUIPO_EMAIL`: correos de envío, respuesta y avisos internos.

Secretos (no están en el repositorio):
- `BREVO_API_KEY`: clave de API de Brevo de Pulso.
- `CLAVE_PANEL`: clave del panel.

```
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put CLAVE_PANEL
```

## Publicar cambios

```
cd invitacion
npx wrangler deploy
```

## Probar en local (sin enviar correos reales)

```
npx wrangler d1 execute pulso-invitacion-desayuno --local --file schema.sql
npx wrangler dev --test-scheduled --var BREVO_API_KEY:prueba --var BREVO_API_URL:http://127.0.0.1:8899/ --var CLAVE_PANEL:prueba --var URL_BASE:http://127.0.0.1:8787 --var AHORA_PRUEBA:2026-11-18T12:35:00Z
```

`AHORA_PRUEBA` simula la hora (UTC) para probar cada recordatorio; `/__scheduled` ejecuta la revisión de envíos. `BREVO_API_URL` apunta a un servidor local que solo registra los correos.

## Después del evento

Exportar la base desde el panel. Para dejar de ejecutar el cron, quitar `triggers` de `wrangler.jsonc` y publicar, o borrar el Worker desde Cloudflare.
