# Landing campaña Red Capital · doble ruta (5.pulsoinversor.cl)

**Estado: construida y probada en local. NO publicada.** No hay base D1 remota ni dominio conectado.

## Qué hace

- Página única con dos caminos: **"Quiero hacer crecer mi capital"** (inversión) y **"Necesito liquidez con mi propiedad"** (leaseback).
- Los correos de la campaña enlazan así:
  `https://5.pulsoinversor.cl/?ruta=inversion&utm_source=brevo&utm_medium=email&utm_campaign=red-capital&utm_content=e1-inversion#n={{ contact.NOMBRE }}&e={{ contact.EMAIL }}`
  - `ruta` preselecciona el camino y baja al formulario.
  - El fragmento `#n=…&e=…` prellena nombre y correo. No viaja al servidor ni a la analítica y se borra de la barra apenas se lee.
- El formulario cambia sus campos según la ruta. Tiene una casilla de autorización **obligatoria** (texto en `src/worker.js`, `CONSENTIMIENTO_TEXTO`) y una casilla de publicidad **opcional, sin marcar**.
- `POST /api/registro`:
  1. Valida y guarda en D1 (`registros`) con el texto y la fecha del consentimiento.
  2. Clasifica:
     - Inversión: asesor sugerido por edad (hasta 40 años → Renato Vargas, 41 o más → Pamela Herrera). Prioridad Alta si el monto es de $25 MM o más; "Nutrición" si es menos de $5 MM.
     - Financiamiento: prioridad Alta si es "Este mes" y tiene propiedad. Si es "Detener un remate o embargo", se marca **Derivar a Plan de Salida**.
  3. Avisa al equipo según la ruta (`AVISO_EQUIPO_INVERSION` / `AVISO_EQUIPO_FINANCIAMIENTO`) y envía la confirmación al interesado (Brevo transaccional).
  4. Crea o actualiza el contacto en Brevo con los atributos `NOMBRE`, `WHATSAPP`, `CONSENT_TEXTO`, `CONSENT_FECHA`, `OPT_IN`, `RC_RUTA` y `RC_ETAPA=Formulario`, y lo agrega a la lista `BREVO_LISTA_FORMULARIO`. **Esa lista es la que saca al contacto de la automatización de activación.** Si `RC_RUTA` o `RC_ETAPA` no existen en Brevo, reintenta sin ellos y lo anota en `brevo_sync`.
- `/panel` (usuario `pulso`, clave `CLAVE_PANEL`) **reemplaza el Excel del equipo comercial**:
  - Contadores por estado y filtros por ruta y estado.
  - Estado, asignado y nota editables por fila, con botón Guardar (`POST /panel/actualizar`).
  - En rojo, los registros que siguen en "Nuevo" después de 24 horas.
  - `/panel/registros.csv` descarga todo (separador `;`, con BOM para Excel).
- WhatsApp: todos los botones van a +56 9 5879 2038, donde Lorenzo precalifica. Ningún enlace va a la agenda de Brevo.

## Publicar (cuando se apruebe)

Siempre con la cuenta Cloudflare de **Grupo MM**: `XDG_CONFIG_HOME=~/.config/pulso-wrangler`. **Nunca** con la de mesawow, que es el login por defecto de wrangler.

```bash
cd landing5
npm install
export XDG_CONFIG_HOME=~/.config/pulso-wrangler
npx wrangler whoami                      # confirmar que es la cuenta de Grupo MM
npx wrangler d1 create pulso-landing-red-capital
#   → copiar el database_id a wrangler.jsonc (hoy dice PENDIENTE-crear-con-wrangler-d1-create)
npx wrangler d1 execute pulso-landing-red-capital --remote --file=schema.sql
npx wrangler secret put BREVO_API_KEY    # la clave de Brevo de Pulso
npx wrangler secret put CLAVE_PANEL      # guardar copia en ~/.config/pulso-landing5-clave-panel.txt
npx wrangler deploy                      # conecta 5.pulsoinversor.cl como dominio propio
```

## Probar en local

```bash
npm install
echo 'CLAVE_PANEL=prueba' > .dev.vars
npx wrangler d1 execute pulso-landing-red-capital --local --file=schema.sql
npx wrangler dev --local
# http://localhost:8787/?ruta=financiamiento#n=María&e=maria%40example.com
# http://localhost:8787/panel  (pulso / prueba)
```

Sin `BREVO_API_KEY`, los envíos quedan registrados como "sin clave Brevo".

## Falta confirmar antes de publicar

1. **Responsable de la ruta financiamiento**: a quién llega el aviso (`AVISO_EQUIPO_FINANCIAMIENTO`, hoy es la misma lista que inversión) y quién aparece como asesor sugerido.
2. **ID de la lista de Brevo "RC · Formulario"** → `BREVO_LISTA_FORMULARIO`. Crear también los atributos `RC_RUTA` (texto) y `RC_ETAPA` (texto) en Brevo.
3. **Destinatarios del aviso de inversión**: es la lista copiada de landing3 (Iván y Felipe incluidos). Ajustar si ahora solo deben recibirlo Renato y Pamela.
4. **Derivación a Plan de Salida**: hoy solo se marca en el panel y en el aviso. Confirmar si además se debe enviar un correo a su equipo.
5. **Tasas de las operaciones en la página** (0,9% y 1,0% + UF, portafolio de noviembre): confirmar que se pueden mostrar en esta pieza y actualizarlas cada mes.
6. **Política de privacidad propia** (`public/privacidad.html`): revisión legal. Menciona la Ley 21.719 y el traspaso a empresas de Grupo MatchMaking.
7. **Origen de la base**: el correo debería decir por qué le escribimos a la persona. Eso depende del acuerdo con Red Capital y va en los correos, no en esta página.
