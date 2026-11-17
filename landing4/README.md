# Landing de campaña · Invierte con Respaldo Inmobiliario

Publicada en **https://3.pulsoinversor.cl** (Worker `pulso-landing-respaldo`, cuenta de Cloudflare de Grupo MM). Sin URL workers.dev. `noindex` mientras tenga datos por completar.

- Contenido: guion Flash Fan Webinar (Modelo IGR) + Estrategia 360 (bajada "Míralo antes de firmar", 3 videos, operación abierta) + Genoma de Marketing (frase única CMF).
- Diseño: el mismo de las landings del Prototipo 2 (`assets/css/landing.css` + `prototipo1.css`) más `assets/css/campana.css`.
- Formulario: guarda en D1 `pulso-landing-respaldo` (tabla `interesados`), avisa al equipo (`AVISO_EQUIPO_EMAIL`) y envía confirmación al interesado por Brevo. Consentimiento obligatorio + casilla de publicidad opcional sin marcar.
- El mensaje de WhatsApp de la pantalla final cambia según `utm_content` (felipe, gonzalo o ivan).
- Eventos para Google Tag Manager en `dataLayer`: `lead`, `contact_whatsapp`, `video_play`.
- Panel: `/panel` (usuario `pulso`, clave = secreto `CLAVE_PANEL`) y `/panel/interesados.csv`.

Lo marcado en amarillo "Completar:" falta antes de lanzar.

Publicar: `npx wrangler deploy` · Secretos: `npx wrangler secret put BREVO_API_KEY` y `CLAVE_PANEL`.
