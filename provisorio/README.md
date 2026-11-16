# Sitio provisorio de Pulso Inversor

Versión corregida de la página que hoy está en pulsoinversor.cl, para usar mientras se termina el sitio nuevo (raíz de este repo). Es independiente: todo lo que necesita está en esta carpeta.

## Publicar

Sube el **contenido** de esta carpeta (`index.html`, `privacidad.html` y `assets/`) a la raíz del hosting de pulsoinversor.cl. No requiere compilar nada.

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
- `/ws/` (UF e IPC) solo existe en el hosting actual; si no responde, el simulador usa UF $39.100 e IPC 4,5 % anual.
- Instagram y LinkedIn siguen apuntando a las cuentas de Grupo Matchmaking.
