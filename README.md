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

El sitio se publica en Cloudflare Workers con archivos estáticos, conectado a este repositorio: cada cambio que llega a `main` se publica solo.

- `wrangler.jsonc`: nombre del proyecto (`pulsoinversor`) y carpeta publicada (la raíz).
- `.assetsignore`: lo que **no** se publica (`scripts/`, `.md`, configuración).

Probar con el mismo motor de Cloudflare: `npx wrangler dev` y abrir http://127.0.0.1:8787.
