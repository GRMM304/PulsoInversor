# Sitio provisorio de Pulso Inversor

Versión corregida de la página que hoy está en pulsoinversor.cl, para usar mientras se termina el sitio nuevo (raíz de este repo). Es independiente: todo lo que necesita está en esta carpeta.

## Publicar en Cloudflare (proyecto aparte del sitio nuevo)

En la cuenta de Cloudflare de Pulso: **Workers & Pages → Create → Import a repository**.

- Repositorio: `GRMM304/PulsoInversor`
- Production branch: `sitio-provisorio`
- Root directory (en Advanced settings): `provisorio`
- Build command: vacío · Deploy command: `npx wrangler deploy`

El nombre del proyecto debe ser `pulsoinversor-provisorio` (es el de `wrangler.jsonc`). Queda en `pulsoinversor-provisorio.<cuenta>.workers.dev`.

Archivos de Cloudflare en esta carpeta: `wrangler.jsonc`, `.assetsignore` (no publica `.md` ni configuración) y `404.html`.

Probar en local: `npx wrangler dev` dentro de esta carpeta y abrir http://127.0.0.1:8787.

### Agregar el dominio pulsoinversor.cl

Hoy el DNS está en HostGator (ns20/ns21.hostgator.cl) y el correo en Google Workspace. Para usarlo como dominio propio del Worker:

1. Cloudflare → **Add a domain** → `pulsoinversor.cl` (plan Free) y revisar que el escaneo haya copiado **todos** estos registros antes de cambiar nada:
   - MX de Google: `ASPMX.L.GOOGLE.COM` (1), `ALT1/ALT2.ASPMX.L.GOOGLE.COM` (5), `ALT3/ALT4.ASPMX.L.GOOGLE.COM` (10)
   - TXT: `google-site-verification=…`, `brevo-code:…`, `v=spf1 include:_spf.google.com ~all`, y el TXT de HubSpot
   - CNAME DKIM: `brevo1._domainkey`, `brevo2._domainkey`, `hs1-46318643._domainkey`, `hs2-46318643._domainkey`
   - TXT `_dmarc`
2. En HostGator, cambiar los nameservers a los dos que entregue Cloudflare.
3. Cuando el dominio aparezca **Active**: Worker `pulsoinversor-provisorio` → **Settings → Domains & Routes → Add → Custom domain** → `pulsoinversor.cl` y otra vez `www.pulsoinversor.cl`.

Si falta un MX o un DKIM, se corta el correo de @pulsoinversor.cl o los envíos de Brevo/HubSpot caen en spam.

Alternativa sin Cloudflare: subir el contenido de esta carpeta (`index.html`, `privacidad.html`, `404.html` y `assets/`) a la raíz del hosting actual.

## Qué cambió respecto de la página actual

- Sin la Estrategia C (Colaborativa).
- Menú móvil funcionando (botón ☰).
- El monto del simulador se puede escribir; el mínimo se ajusta al salir del campo.
- "Simula rápido" lleva el monto elegido al simulador.
- A Brevo llega la simulación completa en el campo MENSAJE, más si acepta publicidad.
- Casilla obligatoria de Política de privacidad y casilla opcional de publicidad (sin marcar). Si la marca, se envía `OPT_IN=1`.
- Tras enviar, botón para mandar la simulación por WhatsApp (respaldo si Brevo falla).
- Página `privacidad.html`.
- Montos en formato chileno ($5.000.000), fuente Inter, favicon, etiquetas para compartir en redes, imágenes optimizadas (de 9 MB a 0,2 MB).
- Botones "Hablar con un asesor" unificados; email y redes del pie como enlaces.

## Pendiente

- IDs de Google Tag Manager/Analytics y píxel de Meta (ver comentario `MEDICIÓN` en `index.html`).
- Validar `privacidad.html` con el abogado y agregar razón social, RUT y domicilio.
- Revisar que el formulario de Brevo tenga el campo OPT_IN si se quiere separar a quienes aceptan publicidad.
- `/ws/` (UF e IPC) solo existe en el hosting actual: en Cloudflare el simulador usa UF $39.100 e IPC 4,5 % anual. Actualizar `uf` en `index.html` cada cierto tiempo o conectar una fuente de UF.
- Instagram y LinkedIn siguen apuntando a las cuentas de Grupo Matchmaking.
