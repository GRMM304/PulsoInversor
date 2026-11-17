# Prototipo 2

Contenido y estructura del sitio V5 (el borrador que estaba en newpulso.netlify.app: 14 páginas, simuladores, operación abierta y las dos landings) con el diseño del Prototipo 1 (rama `main`): cabecera blanca con logo a color, menú, tipografía Inter, colores, botones, tarjetas, héroes con degradado verde y pie.

- **Ver:** https://2.pulsoinversor.cl (única dirección; la de workers.dev está desactivada). No se indexa en Google.
- **Proyecto en Cloudflare:** Worker `pulsoinversor-prototipo2` (aparte del Prototipo 1).

## Carpetas

| Carpeta | Qué tiene |
|---|---|
| `_v5/` | Páginas y CSS/JS originales del V5, sin tocar |
| `_diseno/` | `prototipo1.css` (el diseño del Prototipo 1 aplicado sobre el V5), logo, foto de Santiago y retratos |
| `public/` | Lo que se publica. Se genera con el script; las imágenes y videos viven acá |
| `aplicar_diseno.py` | Toma `_v5/`, aplica colores, logo, fuente, datos de contacto, retratos y la foto del inicio, y escribe `public/` |

## Cambiar algo

1. Textos o estructura de una página: editar `_v5/<página>.html`.
2. Diseño: editar `_diseno/prototipo1.css`.
3. Regenerar y publicar:

```
python3 aplicar_diseno.py
npx wrangler deploy
```

## Qué se ajustó respecto del V5

- Los avisos `[REQUIERE: …]` no se muestran (siguen en el código como pendientes).
- WhatsApp +56 9 8355 4676 y contacto@pulsoinversor.cl donde el V5 tenía el dato pendiente; el número de WhatsApp de los formularios ya no es el de prueba.
- Retratos reales de Felipe Rojas, Iván Barboza, Pamela Herrera y Gloria Cepeda; Renato Vargas con iniciales (sin foto).
- Foto de Santiago bajo el filtro verde en la bienvenida, como en el Prototipo 1.

## Pendiente (viene del V5)

- Los formularios (simulador y landings) no guardan datos: al enviar, ofrecen continuar por WhatsApp. Falta conectarlos a Brevo o a una base.
- Operación abierta: faltan comuna, tipo de propiedad, tasación y demás datos de la ficha.
- Razón social, RUT, dirección, cargos del equipo, LinkedIn y Facebook.
