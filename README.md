# Pulso Inversor · Sitio web

Sitio estático (HTML, CSS y JS, sin dependencias) armado según el documento *Contenidos para la nueva web · Revisión 7* y el diseño de la versión anterior de pulsoinversor.cl.

## Estructura

| Página | Archivo |
|---|---|
| Inicio | `index.html` |
| Cómo invertir · Cómo funciona | `como-funciona.html` |
| Cómo invertir · Inversiones | `inversiones.html` |
| Cómo invertir · Garantías y documentos | `garantias-y-documentos.html` |
| Cómo invertir · Simuladores | `simuladores.html` |
| Conócenos · Nosotros | `nosotros.html` |
| Conócenos · Verifica a Pulso | `verifica-a-pulso.html` |
| Recursos · Mi primera inversión | `mi-primera-inversion.html` |
| Recursos · Ya tengo experiencia invirtiendo | `ya-tengo-experiencia.html` |
| Recursos · Preguntas frecuentes | `preguntas-frecuentes.html` |

- `assets/css/styles.css`: estilos compartidos.
- `assets/js/main.js`: menú desplegable y menú móvil.
- `assets/img`, `assets/media`: logos, favicon y video del inicio.
- `scripts/build.py`: genera las páginas HTML. El encabezado, el menú y el pie se definen una sola vez ahí.

## Cómo editar

1. Cambia los textos en `scripts/build.py`.
2. Ejecuta `python3 scripts/build.py` para regenerar los `.html`.
3. Para verlo en local: `python3 -m http.server` y abre http://localhost:8000.

Si editas un `.html` a mano, el cambio se pierde la próxima vez que ejecutes el script.

## Contenido pendiente

La información marcada en amarillo en el documento de contenidos **no se publica**. Queda como comentarios `<!-- PENDIENTE: ... -->` en el HTML y listada en [PENDIENTES.md](PENDIENTES.md).

## Publicación (Cloudflare)

Este es el **Prototipo 1** (rama `main`). Se publica en Cloudflare Workers con archivos estáticos, conectado a este repositorio: cada cambio que llega a `main` se publica solo.

- **Ver:** https://1.pulsoinversor.cl (única dirección; la de workers.dev está desactivada).
- `wrangler.jsonc`: proyecto `pulsoinversor`, dominio `1.pulsoinversor.cl` y carpeta publicada (la raíz).
- `.assetsignore`: lo que **no** se publica (`scripts/`, `.md`, configuración).

Probar con el mismo motor de Cloudflare: `npx wrangler dev` y abrir http://127.0.0.1:8787.

## Envío de simulaciones por correo

El botón "Enviar a mi correo" de los simuladores genera un PDF en el navegador y lo manda a `/api/enviar-simulacion` (`worker/index.js`). El Worker envía, con la API de Brevo:

1. al cliente, su simulación en PDF al correo que registró;
2. a Pulso, una notificación con sus datos y el mismo PDF.

**Para activarlo** (una vez, en Cloudflare: Workers & Pages > `pulsoinversor` > Settings > Variables and Secrets):

- `BREVO_API_KEY` (tipo *Secret*): clave de API de Brevo (Brevo > SMTP & API > API Keys).
- `SENDER_EMAIL` (opcional): remitente verificado en Brevo. Por defecto `contacto@pulsoinversor.cl`.
- `NOTIFY_EMAIL` (opcional): quién recibe las notificaciones. Por defecto `contacto@pulsoinversor.cl`.

Mientras no exista la clave, la ruta responde "correo no configurado" y el sitio muestra un aviso; los datos igual llegan a Pulso por Brevo (formulario) y por la planilla de Hipoteca Inteligente.

Otras ramas del repositorio con sitios aparte: `prototipo-2` (2.pulsoinversor.cl) y `sitio-provisorio` (pulsoinversor.cl).
