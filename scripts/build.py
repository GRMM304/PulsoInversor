import os, urllib.parse
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMAIL = 'contacto@pulsoinversor.cl'

def mail(subject=None):
    # PENDIENTE (global): confirmar si el CTA usará este correo o un formulario/WhatsApp comercial.
    return f'mailto:{EMAIL}' + (('?subject=' + urllib.parse.quote(subject)) if subject else '')

def P(text):
    """Marcador interno: no se muestra en el sitio."""
    return f'<!-- PENDIENTE: {text} -->'

NAV = [
    ('Cómo invertir', [('como-funciona.html', 'Cómo funciona'), ('inversiones.html', 'Inversiones'),
                       ('garantias-y-documentos.html', 'Garantías y documentos'), ('simuladores.html', 'Simuladores')]),
    ('Conócenos', [('nosotros.html', 'Nosotros'), ('verifica-a-pulso.html', 'Verifica a Pulso')]),
    ('Recursos', [('mi-primera-inversion.html', 'Mi primera inversión'),
                  ('ya-tengo-experiencia.html', 'Ya tengo experiencia invirtiendo'),
                  ('preguntas-frecuentes.html', 'Preguntas frecuentes')]),
]

def header(slug):
    items = [f'<li class="{"active" if slug=="index.html" else ""}"><a href="index.html"{" aria-current=page" if slug=="index.html" else ""}>Inicio</a></li>']
    for i, (label, subs) in enumerate(NAV):
        active = any(s == slug for s, _ in subs)
        links = ''.join(f'<li><a href="{s}"{" aria-current=page" if s==slug else ""}>{t}</a></li>' for s, t in subs)
        items.append(f'<li class="has-sub{" active" if active else ""}"><button type="button" aria-expanded="false" aria-controls="sub{i}">{label}</button><ul class="submenu" id="sub{i}">{links}</ul></li>')
    items.append(f'<li class="nav-cta-item" hidden-desktop><a href="{mail("Conversemos")}">Conversemos</a></li>')
    return f'''<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="header">
  <div class="container nav">
    <a class="logo" href="index.html" aria-label="Pulso Inversor, ir al inicio"><img src="assets/img/logo-pulso-gmm.webp" alt="Pulso Inversor · Una empresa de Grupo Matchmaking" width="560" height="62"></a>
    <nav aria-label="Principal">
      <ul class="menu" id="menu">{''.join(items)}</ul>
    </nav>
    <div class="nav-actions"><a class="btn nav-cta" href="{mail("Conversemos")}">Conversemos</a></div>
    <button class="mobile-toggle" type="button" aria-controls="menu" aria-expanded="false" aria-label="Abrir menú">☰</button>
  </div>
</header>'''

def footer():
    cols = ''.join(f'<div><h4>{label}</h4><ul>' + ''.join(f'<li><a href="{s}">{t}</a></li>' for s, t in subs) + '</ul></div>' for label, subs in NAV)
    return f'''<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img class="logo-foot" src="assets/img/logo-pulso-blanco.webp" alt="Pulso Inversor" width="300" height="100">
        <p>Inversiones privadas vinculadas a bienes raíces mediante el modelo IGR, Inversión con Garantía Real.</p>
        <p><strong>Pulso Inversor SpA</strong><br><a href="mailto:{EMAIL}">{EMAIL}</a></p>
        {P("RUT, domicilio, teléfono y demás canales oficiales.")}
        <img class="logo-gmm" src="assets/img/logo-gmm-blanco.webp" alt="Una empresa de Grupo Matchmaking" width="380" height="100">
      </div>
      {cols}
    </div>
    <div class="footer-bottom">
      <span>© <span id="year">2026</span> Pulso Inversor SpA. Todos los derechos reservados.</span>
      <span>La información de este sitio es referencial y no constituye una oferta ni asegura rentabilidad.</span>
    </div>
  </div>
</footer>'''

def page(slug, title, desc, body):
    full = 'Pulso Inversor · Inversiones con garantía real' if slug == 'index.html' else f'{title} · Pulso Inversor'
    html = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{full}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/media/hero-poster.jpg">
<meta name="theme-color" content="#0E2C28">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
{header(slug)}
<main id="contenido">
{body}
</main>
{footer()}
<script src="assets/js/main.js"></script>
</body>
</html>
'''
    html = html.replace(' hidden-desktop', ' data-mobile-only')
    open(os.path.join(R, slug), 'w').write(html)

def hero(crumb, h1, p, eyebrow=None):
    eb = f'<span class="eyebrow dark">{eyebrow}</span>' if eyebrow else ''
    return f'''<section class="page-hero"><div class="container">
<div class="breadcrumb"><a href="index.html">Inicio</a> / {crumb}</div>{eb}
<h1>{h1}</h1><p>{p}</p></div></section>'''

def cta(h, p, label, subject):
    return f'''<section class="section"><div class="container"><div class="cta-band">
<div><h2>{h}</h2><p>{p}</p></div>
<a class="btn btn-primary" href="{mail(subject)}">{label}</a></div></div></section>'''

PRODUCTS = [
    ('Proyecta un Hogar', 'Invierte con sentido y contribuye a dar una nueva oportunidad a familias que enfrentan un remate.', 'proyecta-un-hogar'),
    ('Hipoteca Inteligente', 'Activa tu capacidad de financiamiento para generar retorno y construir patrimonio inmobiliario.', 'hipoteca-inteligente'),
    ('Configuración Patrimonial', 'Organiza tus recursos, activos y estructuras en torno a tus objetivos de patrimonio y legado.', 'configuracion-patrimonial'),
    ('Inversión Inmobiliaria Circular', 'Transforma el capital de tu propiedad en nuevas oportunidades de inversión.', 'inversion-circular'),
]

# ---------------- 1. Inicio ----------------
cards = ''.join(f'''<article class="card product-card"><div class="card-num">0{i+1}</div><h3>{t}</h3><p>{d}</p>
<a class="link-arrow" href="inversiones.html#{a}">Conocer alternativa</a></article>''' for i, (t, d, a) in enumerate(PRODUCTS))
page('index.html', 'Inicio',
     'Explora alternativas de inversión vinculadas al mercado inmobiliario y encuentra un punto de partida para tus objetivos.', f'''
<section class="hero">
  <video autoplay muted loop playsinline poster="assets/media/hero-poster.jpg" aria-hidden="true"><source src="assets/media/hero-loop.mp4" type="video/mp4"></video>
  <div class="container"><div class="hero-content">
    <span class="eyebrow dark">Inversión con Garantía Real</span>
    <h1>Tu próxima inversión comienza con claridad</h1>
    <p>Explora alternativas vinculadas al mercado inmobiliario y encuentra un punto de partida para tus objetivos.</p>
    <div class="actions">
      <a class="btn btn-primary" href="inversiones.html">Encuentra tu alternativa</a>
      <a class="btn btn-secondary" href="como-funciona.html">Conoce cómo funciona</a>
    </div>
  </div></div>
</section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Tu punto de partida</span><h2>¿Desde dónde quieres comenzar?</h2></div>
  <div class="grid-2">
    <article class="card profile-card"><div class="card-icon">🌱</div><h3>Estoy pensando en mi primera inversión</h3>
      <p>Quiero conocer los conceptos y dar mi primer paso con orientación.</p>
      <a class="btn btn-dark" href="mi-primera-inversion.html">Quiero empezar</a></article>
    <article class="card profile-card"><div class="card-icon">📈</div><h3>Ya tengo experiencia invirtiendo</h3>
      <p>Busco nuevas alternativas para diversificar mi patrimonio.</p>
      <a class="btn btn-dark" href="ya-tengo-experiencia.html">Quiero profundizar</a></article>
  </div>
</div></section>

<section class="section section-dark"><div class="container split">
  <div><span class="eyebrow dark">El modelo</span><h2>Conoce qué hay detrás de tu inversión</h2>
    <p class="lead">Descubre cómo te acompañamos y qué información tendrás para evaluar tu alternativa.</p>
    <div class="actions"><a class="btn btn-primary" href="como-funciona.html">Así funciona Pulso</a></div></div>
  <ol class="steps two">
    <li><strong>Cuéntanos qué buscas</strong><span>Conversemos sobre tus objetivos.</span></li>
    <li><strong>Conoce tu alternativa</strong><span>Revisa una propuesta y sus condiciones.</span></li>
    <li><strong>Decide con claridad</strong><span>Evalúa tus documentos y resuelve tus preguntas.</span></li>
    <li><strong>Invierte acompañado</strong><span>Formaliza tu inversión y mantén el contacto con el equipo.</span></li>
  </ol>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title center"><span class="eyebrow">Experiencias</span><h2>Conoce la experiencia de quienes ya dieron el paso</h2>
    <p class="lead">Escucha sus historias y revisa sus opiniones sobre Pulso.</p></div>
  {P("INCORPORAR hasta tres reseñas auténticas de Google (texto original, autor, fecha y enlace) y el enlace al perfil oficial de Pulso. Botón: Ver opiniones en Google.")}
  {P("INCORPORAR video autorizado de un cliente, nombre y una frase breve, sin atribuirle resultados no verificados. Botón: Ver testimonio.")}
  <p class="disclaimer" style="text-align:center">Las experiencias corresponden a casos particulares y no aseguran resultados futuros.</p>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Formas de invertir</span><h2>Explora nuestras alternativas</h2></div>
  <div class="grid-4">{cards}</div>
  <div class="actions" style="justify-content:center"><a class="btn btn-outline" href="inversiones.html#comparar">Comparar alternativas</a></div>
</div></section>
''' + cta('Conversemos sobre lo que quieres construir', 'Cuéntanos tus objetivos y revisemos por dónde comenzar.', 'Conversar con el equipo', 'Quiero conversar con el equipo'))

# ---------------- 2.1 Cómo funciona ----------------
page('como-funciona.html', 'Cómo funciona',
     'Estructuramos inversiones privadas vinculadas a bienes raíces mediante el modelo IGR, Inversión con Garantía Real.',
     hero('Cómo invertir / Cómo funciona', 'Porque invertir también puede generar impacto',
          'Estructuramos inversiones privadas vinculadas a bienes raíces mediante el modelo IGR, Inversión con Garantía Real. Conectamos objetivos de inversión con soluciones de liquidez para propietarios, a través de una relación directa con cada inversionista.', 'Modelo IGR') + f'''
{P("VALIDAR INTERNAMENTE: compromisos de entrega de documentos antes de firmar, acompañamiento y atención expresados en esta página; confirmar que coinciden con la práctica real.")}
<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">Antes de invertir</span><h2>Lo que debes conocer antes de invertir</h2></div>
  <div class="grid-3">
    <article class="card"><div class="card-icon">🛡️</div><h3>Tu respaldo</h3><p>Conoce qué documentos corresponden a tu inversión y qué derechos establecen a tu favor.</p></article>
    <article class="card"><div class="card-icon">💼</div><h3>Tus condiciones económicas</h3><p>Revisa el aporte, los pagos previstos y los costos para planificar con una visión completa.</p></article>
    <article class="card"><div class="card-icon">⏳</div><h3>Tu plazo</h3><p>Elige un horizonte compatible con tus planes y conoce las condiciones para recuperar tus recursos.</p></article>
  </div>
  <p class="note" style="margin-top:24px">También te explicamos los riesgos de la alternativa y las medidas aplicables para abordarlos. <a href="verifica-a-pulso.html#riesgos">Conoce cómo se gestionan los riesgos</a></p>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Paso a paso</span><h2>Así es tu camino con Pulso</h2></div>
  <ol class="steps">
    <li><strong>Cuéntanos qué buscas</strong><span>Conversemos sobre tus objetivos.</span></li>
    <li><strong>Conoce tu alternativa</strong><span>Revisa una propuesta y sus condiciones.</span></li>
    <li><strong>Decide con claridad</strong><span>Evalúa tus documentos y resuelve tus preguntas.</span></li>
    <li><strong>Invierte acompañado</strong><span>Formaliza tu inversión y mantén el contacto con el equipo.</span></li>
  </ol>
</div></section>

<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">Nuestro compromiso</span><h2>Lo que sí hacemos y lo que no hacemos</h2></div>
  <div class="yesno">
    <div class="card"><h3>Lo que sí hacemos</h3><ul class="yes">
      <li>Te entregamos antecedentes y documentos antes de firmar.</li>
      <li>Te explicamos las condiciones, el respaldo y los riesgos.</li>
      <li>Mantenemos una relación directa con cada inversionista.</li></ul></div>
    <div class="card"><h3>Lo que no hacemos</h3><ul class="no">
      <li>Pedirte que decidas en la primera reunión.</li>
      <li>Ofrecerte una rentabilidad sin explicarte qué hay detrás.</li>
      <li>Operar como una plataforma de crowdfunding o financiamiento colectivo.</li></ul></div>
  </div>
  <div class="actions"><a class="btn btn-dark" href="inversiones.html#comparar">Comparar inversiones</a></div>
</div></section>
''' + cta('Conversemos sobre lo que quieres construir', 'Cuéntanos tus objetivos y revisemos por dónde comenzar.', 'Conversar con el equipo', 'Quiero conversar con el equipo'))

# ---------------- 2.2 Inversiones ----------------
def product(anchor, num, title, text, extra=''):
    return f'''<article class="card product-card" id="{anchor}"><div class="card-num">{num}</div><h3>{title}</h3><p>{text}</p>{extra}
<a class="btn btn-outline" href="{mail('Consulta: ' + title)}">Consultar esta alternativa</a></article>'''

page('inversiones.html', 'Inversiones',
     'Conoce a quién se dirige cada alternativa de Pulso Inversor y compara sus condiciones principales.',
     hero('Cómo invertir / Inversiones', 'Encuentra una alternativa para tus objetivos',
          'Conoce a quién se dirige cada opción y compara sus condiciones principales.', 'Inversiones') + f'''
<section class="section"><div class="container"><div class="grid-2">
{product('proyecta-un-hogar', '01', 'Proyecta un Hogar', 'Para quienes quieren rentabilizar capital disponible con un propósito social. En alianza con Plan de Salida, el modelo busca contribuir a soluciones que permitan a familias enfrentar el riesgo de remate y dar continuidad a su hogar.')}
{product('hipoteca-inteligente', '02', 'Hipoteca Inteligente', 'Para quienes cuentan con capacidad de crédito hipotecario y quieren utilizarla para generar retorno y construir patrimonio. La alternativa contempla adquirir una propiedad mediante financiamiento bancario, sujeto a evaluación y aprobación del crédito.')}
{product('configuracion-patrimonial', '03', 'Configuración Patrimonial', 'Una estrategia integral para quienes buscan ordenar, invertir y proyectar su patrimonio. Combina recursos, activos, financiamiento y estructuras jurídicas según objetivos de protección, eficiencia, continuidad y legado.')}
{product('inversion-circular', '04', 'Inversión Inmobiliaria Circular', 'Para propietarios que quieren transformar el capital de su inmueble en nuevas oportunidades de inversión y reducir la gestión cotidiana de un arriendo. Permite evaluar la venta, destinar el capital neto a una alternativa de Pulso y, de manera opcional, explorar otra propiedad según disponibilidad y capacidad de financiamiento.')}
</div></div></section>

<section class="section section-soft" id="comparar"><div class="container">
  <div class="title"><span class="eyebrow">Tabla comparativa</span><h2>Compáralas de un vistazo</h2></div>
  <div class="table-wrap compare"><table>
    <thead><tr><th>Solución</th><th>Desde</th><th>Qué queda a tu favor</th><th>Plazos</th></tr></thead>
    <tbody>
      <tr><td>Proyecta un Hogar</td>
        <td>Según la modalidad contractual elegida. {P("CONFIRMAR cuáles modalidades de Renta de Capital se ofrecen bajo este nombre. Mínimos confirmados: pagaré $5 millones; hipoteca $25 millones; título $100 millones.")}</td>
        <td>Documentación según la modalidad elegida. {P("CONFIRMAR si incluye pagaré/mutuo, hipoteca y título, o solo alguna.")}</td>
        <td>Según la modalidad elegida. {P("ASIGNAR: 12, 18 o 24 meses en pagaré; 15, 21 o 27 en hipoteca/título, si pertenecen a Proyecta un Hogar.")}</td></tr>
      <tr><td>Hipoteca Inteligente</td><td>Capacidad de crédito hipotecario desde 2.000 UF, sujeta a aprobación bancaria.</td>
        <td>Propiedad adquirida mediante crédito; hipoteca a favor del banco y condiciones contractuales de la operación.</td><td>2 a 5 años, según la operación.</td></tr>
      <tr><td>Configuración Patrimonial</td><td>Recursos disponibles: capital, financiamiento, activos y estructuras existentes.</td>
        <td>Estructura y documentación diseñadas según los objetivos patrimoniales.</td><td>Según el diseño personalizado.</td></tr>
      <tr><td>Inversión Inmobiliaria Circular</td><td>Capital neto disponible tras vender la propiedad y resolver la deuda, si existe; sujeto al mínimo de la modalidad elegida.</td>
        <td>Documentos de la venta y de la inversión posterior, según la estructura contratada. {P("COMPLETAR instrumentos específicos que se formalizan.")}</td>
        <td>Según la venta y el plazo contratado para la inversión posterior. {P("COMPLETAR plazo comercial aplicable.")}</td></tr>
    </tbody></table></div>
</div></section>

<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">En detalle</span><h2>Condiciones de cada alternativa</h2></div>
  <details><summary>Proyecta un Hogar</summary><div class="details-body">
    <p>El documento y los pagos dependen de la modalidad contractual.</p>
    {P("COMPLETAR correspondencia con modalidades A/H/T, costos y requisitos. Precisar si 'retiros trimestrales' es pago de intereses, retiro de capital o ambos.")}
  </div></details>
  <details><summary>Hipoteca Inteligente</summary><div class="details-body">
    <p>Requiere capacidad de financiamiento y aprobación bancaria. La adquisición contempla una deuda hipotecaria a nombre del comprador; la operación debe detallar los pagos a cargo de cada parte y las condiciones de cierre.</p>
    <p>La proyección considera ingresos, dividendos, administración y otros costos de la configuración elegida. El resultado depende de la propiedad, el financiamiento y la opción de cierre.</p>
    {P("COMPLETAR obligaciones contractuales de cada parte, costos de entrada y condiciones de recompra o conservación. No incorporar la promesa general de que Pulso paga todos los dividendos.")}
  </div></details>
  <details><summary>Configuración Patrimonial</summary><div class="details-body">
    <p>Contempla diseño societario, coordinación jurídica y financiera, administración y planificación de continuidad o legado, según la situación del cliente.</p>
    {P("COMPLETAR alcance contratado, honorarios, entregables y condiciones del acompañamiento.")}
  </div></details>
  <details><summary>Inversión Inmobiliaria Circular</summary><div class="details-body">
    <p>La propuesta se adapta al punto de partida del propietario:</p>
    <ul><li><strong>Con deuda:</strong> se considera el prepago del crédito para determinar el capital neto disponible.</li>
      <li><strong>Sin deuda:</strong> se evalúa el capital disponible después de la venta y sus gastos.</li>
      <li><strong>Nueva propiedad, opcional:</strong> se puede evaluar una adquisición adicional según disponibilidad y aprobación bancaria.</li></ul>
    <p>Las condiciones de venta, inversión y eventuales retiros se establecen en la propuesta y el contrato de cada cliente.</p>
    {P("COMPLETAR costos de venta, prepago y gestión; política de retiros y plazos de aviso.")}
  </div></details>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Orientación</span><h2>¿Cuál me conviene más?</h2>
    <p class="lead">Identifica el momento en el que estás y encuentra una opción para comenzar a explorar.</p></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Me identifico con…</th><th>Punto de partida</th></tr></thead>
    <tbody>
      <tr><td>Tengo capital disponible y busco invertir con sentido</td><td>Conoce <a href="#proyecta-un-hogar">Proyecta un Hogar</a> y las condiciones de participación que se definan para tu caso.</td></tr>
      <tr><td>Tengo capacidad de crédito y quiero construir patrimonio</td><td>Explora <a href="#hipoteca-inteligente">Hipoteca Inteligente</a>.</td></tr>
      <tr><td>Quiero organizar mis activos pensando en continuidad y legado</td><td>Conoce <a href="#configuracion-patrimonial">Configuración Patrimonial</a>.</td></tr>
      <tr><td>Tengo una propiedad y quiero activar su capital con menos gestión cotidiana</td><td>Explora <a href="#inversion-circular">Inversión Inmobiliaria Circular</a>, tanto si tu inmueble tiene deuda como si está pagado.</td></tr>
    </tbody></table></div>
</div></section>
''' + cta('¿Te identificas con más de una opción?', 'Revisemos juntos tu situación.', 'Ayúdenme a encontrar mi alternativa', 'Ayúdenme a encontrar mi alternativa'))

# ---------------- 2.3 Garantías ----------------
page('garantias-y-documentos.html', 'Garantías y documentos',
     'Conoce el respaldo que acompaña tu inversión: qué aporta cada documento y qué antecedentes puedes revisar.',
     hero('Cómo invertir / Garantías y documentos', 'Conoce el respaldo que acompaña tu inversión',
          'Cada documento cumple una función. Aquí puedes entender qué aporta y qué antecedentes revisar.', 'Respaldo') + f'''
<section class="section"><div class="container">
  <div class="table-wrap"><table>
    <thead><tr><th>Documento</th><th>Qué aporta</th><th>Qué puedes comprobar</th></tr></thead>
    <tbody>
      <tr><td>Contrato de mutuo</td><td>Establece las obligaciones del préstamo y las condiciones de restitución acordadas.</td><td>Partes, monto, plazo y condiciones pactadas.</td></tr>
      <tr><td>Pagaré</td><td>Documenta el compromiso de pago conforme a sus términos y requisitos legales.</td><td>Quién debe pagar, monto y vencimiento.</td></tr>
      <tr><td>Hipoteca</td><td>Constituye una garantía real sobre un inmueble a favor del acreedor identificado en la inscripción.</td><td>Propiedad, beneficiario, inscripción y prioridad.</td></tr>
      <tr><td>Título e inscripción de dominio</td><td>Permiten acreditar la adquisición y verificar la propiedad inscrita.</td><td>Titularidad y antecedentes registrales.</td></tr>
    </tbody></table></div>
  <p class="note" style="margin-top:24px">Los documentos aplicables y su alcance se especifican en cada alternativa. En una inversión con hipoteca a tu favor actúas como acreedor; en una compra con crédito hipotecario, la hipoteca se constituye a favor del banco. El pagaré documenta una deuda y no constituye por sí solo una garantía real sobre un inmueble.</p>
</div></section>

<section class="section section-soft"><div class="container">
  <details open><summary>Antecedentes que complementan el respaldo</summary><div class="details-body">
    <ul><li><strong>Dominio vigente:</strong> permite revisar quién figura como propietario.</li>
      <li><strong>Gravámenes y prohibiciones:</strong> informa cargas y restricciones del inmueble.</li>
      <li><strong>Tasación:</strong> aporta una estimación de valor, con fecha y metodología.</li>
      <li><strong>Estudio de títulos:</strong> reúne la revisión jurídica que corresponda a la operación.</li></ul>
    <p style="margin-top:14px">El material comercial contempla fichas de propiedades y acceso a tasaciones.</p>
  </div></details>
  {P("COMPLETAR listado definitivo de antecedentes entregables por modalidad y momento de entrega. Confirmar seguros contra incendio y sismo (pólizas, inmuebles, beneficiarios, vigencia, exclusiones) antes de incorporarlos.")}
  <div class="actions"><a class="btn btn-dark" href="verifica-a-pulso.html#operacion-abierta">Ver una operación real</a></div>
</div></section>
''' + cta('Si algo no está claro, conversemos', 'Pregúntanos por los antecedentes que necesitas para evaluar tu inversión.', 'Quiero resolver una duda', 'Consulta sobre garantías y documentos'))

# ---------------- 2.4 Simuladores ----------------
SOON = '<span class="pill soon">Próximamente</span>'
page('simuladores.html', 'Simuladores',
     'Explora los números de tu inversión con los simuladores de Pulso Inversor.',
     hero('Cómo invertir / Simuladores', 'Explora los números de tu inversión',
          'Elige una herramienta y despliega la información necesaria para comenzar.', 'Simuladores') + f'''
<section class="section"><div class="container"><div class="grid-3">

  <article class="card"><div class="card-num">01 · {SOON}</div><h3>Proyección de inversión de capital</h3>
    {P("CONFIRMAR nombre, alternativa asociada y enlace del simulador de capital.")}
    <p><strong>Qué permite explorar:</strong> la relación entre capital, plazo y retorno estimado.</p>
    <details><summary>Cómo leer tu simulación</summary><div class="details-body"><ul>
      <li><strong>Capital:</strong> monto que aportas a la inversión.</li>
      <li><strong>Retorno estimado:</strong> interés proyectado bajo las condiciones del cálculo; revisa si se expresa en pesos o con reajuste en UF.</li>
      <li><strong>Total y pagos:</strong> distingue la devolución de capital del interés y revisa cuándo se prevé recibir cada uno.</li></ul></div></details>
    {P("COMPLETAR campos reales, costos incluidos y modalidad de pagos del simulador definitivo.")}
    <a class="btn btn-outline" href="#" aria-disabled="true">Abrir simulador</a></article>

  <article class="card"><div class="card-num">02 · {SOON}</div><h3>Hipoteca Inteligente</h3>
    <p>Explora cómo tu capacidad de financiamiento puede relacionarse con retorno, costos y construcción de patrimonio.</p>
    <p><strong>Datos de entrada:</strong> nombre, teléfono, correo y capacidad financiera declarada por crédito. Luego seleccionas propiedad, plazo y las opciones disponibles para la configuración.</p>
    <details><summary>Cómo leer tu simulación</summary><div class="details-body"><ul>
      <li><strong>Capacidad financiera:</strong> es una referencia declarada para evaluar cada propiedad; no equivale a una aprobación bancaria.</li>
      <li><strong>Retorno proyectado:</strong> identifica el resultado estimado de la propiedad seleccionada y el período del cálculo.</li>
      <li><strong>Flujo y costos:</strong> revisa ingresos, dividendos, administración y gastos considerados. Un flujo negativo representa recursos que deben cubrirse en ese escenario.</li>
      <li><strong>Patrimonio y cierre:</strong> distingue el retorno disponible de la amortización de deuda y compara las opciones de conservar o activar recompra, cuando correspondan.</li></ul>
      <p style="margin-top:12px"><strong>Criterio de lectura:</strong> en un ejemplo de recompra, el resultado al cierre suma el retorno disponible y la amortización mostrada. Son componentes distintos y deben leerse según la configuración elegida.</p></div></details>
    {P("ENLACE EN REVISIÓN: https://simuladorpulsoinversor.netlify.app/ — activar el botón (quitar aria-disabled y poner el href) cuando el simulador esté alineado con la presentación vigente y se retire la regla divergente de reparto de amortización.")}
    <a class="btn btn-outline" href="#" aria-disabled="true">Abrir simulador</a></article>

  <article class="card"><div class="card-num">03 · {SOON}</div><h3>Nueva herramienta</h3>
    {P("COMPLETAR identidad de la tercera herramienta, alternativa asociada, enlace, datos requeridos y su desplegable 'Cómo leer tu simulación' (tres resultados principales, moneda, horizonte, costos y supuestos).")}
    <p>Estamos preparando una tercera herramienta para explorar otra de nuestras alternativas.</p>
    <a class="btn btn-outline" href="#" aria-disabled="true">Abrir simulador</a></article>

</div>
<p class="disclaimer">Los resultados son referenciales y dependen de los datos y supuestos utilizados. Las condiciones de una operación se revisan en su documentación; la simulación no asegura rentabilidad.</p>
</div></section>
''' + cta('¿Prefieres revisar tus números con el equipo?', 'Cuéntanos tus objetivos y revisemos por dónde comenzar.', 'Conversar con el equipo', 'Consulta sobre simuladores'))

# ---------------- 3.1 Nosotros ----------------
page('nosotros.html', 'Nosotros',
     'Conoce la historia, el enfoque, los pilares y el equipo de Pulso Inversor, parte de Grupo Matchmaking.',
     hero('Conócenos / Nosotros', 'Una trayectoria que evoluciona con nuevas oportunidades',
          'Facilitamos el acceso a inversiones alternativas vinculadas al mercado inmobiliario.', 'Nuestra historia') + f'''
<section class="section"><div class="container split">
  <div><span class="eyebrow">Nuestra historia</span><h2>Desde 2016 conectando inversión y patrimonio</h2>
    <p class="muted">Este desarrollo impulsó posteriormente la creación de Grupo Matchmaking, el ecosistema empresarial del que hoy formamos parte.</p></div>
  <ol class="timeline">
    <li><strong>2016 · Nuestros orígenes</strong><span class="muted">Bajo el alero de Partners &amp; Advisers y la gestión de Iván Barboza, nace el modelo Inversión Remate Seguro (IRS), vinculado a oportunidades de remates judiciales.</span></li>
    <li><strong>2016–2023 · Experiencia y especialización</strong><span class="muted">Ampliamos nuestra experiencia en evaluación comercial, análisis jurídico y gestión inmobiliaria, abriendo camino hacia el financiamiento privado.</span></li>
    <li><strong>2023 · Nace Pulso Inversor SpA</strong><span class="muted">A fines de ese año se constituye la empresa y el modelo evoluciona hacia la Inversión con Garantía Real (IGR).</span></li>
  </ol>
</div></section>

<section class="section section-dark"><div class="container">
  <div class="title"><span class="eyebrow dark">Nuestro enfoque</span><h2>Conectamos inversión y oportunidades para el patrimonio</h2>
    <p class="lead">Facilitamos el acceso a inversiones alternativas vinculadas al mercado inmobiliario, conectando a quienes buscan soluciones de liquidez con personas que quieren diversificar y hacer crecer su patrimonio. Buscamos combinar retornos atractivos con soluciones que ayuden a propietarios a reorganizar sus finanzas.</p></div>
  <div class="grid-4">
    <article class="card"><div class="card-num">01</div><h3>Transparencia y simplicidad</h3><p>Condiciones comprensibles y acuerdos documentados desde el inicio.</p></article>
    <article class="card"><div class="card-num">02</div><h3>Seguridad y respaldo</h3><p>Formalización y derechos definidos mediante garantías inmobiliarias o instrumentos contractuales, según la alternativa.</p></article>
    <article class="card"><div class="card-num">03</div><h3>Rentabilidad</h3><p>Búsqueda de retornos atractivos, considerando el plazo y las condiciones de cada operación.</p></article>
    <article class="card"><div class="card-num">04</div><h3>Inversión con sentido</h3><p>Soluciones que conectan objetivos de inversión con nuevas posibilidades para el patrimonio de los propietarios.</p></article>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">Nuestro equipo</span><h2>Experiencia inmobiliaria y visión financiera</h2></div>
  {P("INCORPORAR fotografías aprobadas de Iván y Felipe (reemplazar el círculo con iniciales por <img class='avatar'>) y nombres, cargos, fotos y biografías de los demás integrantes.")}
  <div class="grid-2">
    <article class="card person"><div class="avatar" aria-hidden="true">IB</div><div><h3>Iván Barboza</h3><div class="role">Cofundador y experto inmobiliario</div>
      <p>Aporta experiencia en el desarrollo de modelos de inversión y conocimiento del mercado inmobiliario, con foco en la evaluación de oportunidades, la gestión profesional y el respaldo contractual.</p></div></article>
    <article class="card person"><div class="avatar" aria-hidden="true">FR</div><div><h3>Felipe Rojas</h3><div class="role">Cofundador y estratega financiero</div>
      <p>Con 16 años de trayectoria en finanzas y control de gestión en compañías como LATAM, Iansa y Transbank, aporta visión corporativa y rigor analítico al diseño financiero de las alternativas de Pulso. Su vínculo con el proyecto comenzó como cliente e inversionista.</p></div></article>
  </div>
</div></section>
''' + cta('Conversemos sobre lo que quieres construir', 'Cuéntanos tus objetivos y revisemos por dónde comenzar.', 'Conversar con el equipo', 'Quiero conversar con el equipo'))

# ---------------- 3.2 Verifica ----------------
page('verifica-a-pulso.html', 'Verifica a Pulso',
     'Situación regulatoria, operación abierta, riesgos y cómo verificar a Pulso Inversor con fuentes independientes.',
     hero('Conócenos / Verifica a Pulso', '¿Por qué no estamos en la CMF?',
          'Aquí puedes conocer los documentos de una operación y encontrar información para revisar sus antecedentes por tu cuenta.', 'Verifica a Pulso') + f'''
<section class="section"><div class="container split">
  <div><span class="eyebrow">Situación regulatoria</span><h2>¿Pulso Inversor requiere certificación CMF?</h2></div>
  <div><p class="lead">No bajo esta estructura privada, contractual y personalizada. No opera como banco, corredora, administradora de fondos ni plataforma de financiamiento colectivo regulada.</p></div>
</div></section>

<section class="section section-soft" id="operacion-abierta"><div class="container">
  <div class="title"><span class="eyebrow">Operación abierta</span><h2>Mira cómo se documenta una operación real</h2>
    <p class="lead">Conoce un caso, revisa sus documentos y observa la información disponible para seguir sus etapas.</p></div>
  {P("Caso candidato: Fundo Alhué, Curacaví (tasación 12.580 UF; inversión 3.034,6 UF según portafolio de octubre). CONFIRMAR autorización y estado. COMPLETAR partes, antecedentes reales anonimizados y seguimiento (hitos, fecha, pagos previstos y realizados) antes de publicar el detalle.")}
  <div class="grid-4">
    <article class="card"><div class="card-icon">📍</div><h3>El caso</h3><p>La operación y el inmueble involucrado.</p></article>
    <article class="card"><div class="card-icon">🤝</div><h3>Las partes</h3><p>Quién invierte, quién recibe los recursos, quién debe pagar y quién figura como propietario o acreedor.</p></article>
    <article class="card"><div class="card-icon">📄</div><h3>Los antecedentes</h3><p>Tasación, ficha, contratos e inscripciones de la operación.</p></article>
    <article class="card"><div class="card-icon">📊</div><h3>El seguimiento</h3><p>Hitos, pagos previstos y realizados, novedades y situación actual.</p></article>
  </div>
  <div class="actions"><a class="btn btn-outline" href="#" aria-disabled="true">Ver documentos del caso</a><a class="btn btn-dark" href="{mail('Consulta sobre la operación abierta')}">Consultar sobre esta operación</a></div>
  <p class="disclaimer">Las condiciones y resultados de este caso corresponden a una operación específica.</p>
</div></section>

<section class="section" id="riesgos"><div class="container">
  <div class="title"><span class="eyebrow">Riesgos y medidas de gestión</span><h2>Conoce cómo se aborda cada escenario</h2>
    <p class="lead">Una evaluación completa considera los escenarios posibles y las medidas aplicables para gestionarlos.</p></div>
  {P("COMPLETAR la medida que se informa para cada situación: atrasos/insolvencia y cobro; valoración y escenarios de flujos; salida anticipada; revisión jurídica y prioridad de derechos; orientación sobre concentración.")}
  <div class="table-wrap"><table>
    <thead><tr><th>Situación</th><th>Lo que debes conocer</th></tr></thead>
    <tbody>
      <tr><td>Atrasos o dificultades de la contraparte</td><td>Evaluación, comunicación y acciones de cobro aplicables, y el efecto de una eventual insolvencia.</td></tr>
      <tr><td>Cambios en el valor del inmueble o en los flujos</td><td>Escenarios de ingresos y gastos, incluidas las consecuencias de resultados inferiores a los previstos.</td></tr>
      <tr><td>Necesidad de recuperar recursos antes</td><td>Condiciones y costos de salida establecidos en la documentación de tu alternativa.</td></tr>
      <tr><td>Situación jurídica del inmueble</td><td>Formalización notarial e inscripción de título o hipoteca según la modalidad.</td></tr>
      <tr><td>Concentración de la inversión</td><td>Tu exposición a una empresa, propiedad o estrategia.</td></tr>
    </tbody></table></div>
  <p class="disclaimer">Las medidas de gestión ayudan a abordar los riesgos; su alcance depende de cada operación y no elimina la posibilidad de pérdidas.</p>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Verificación independiente</span><h2>Contrasta la información con fuentes independientes</h2></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Qué comprobar</th><th>Cómo hacerlo</th></tr></thead>
    <tbody>
      <tr><td>La empresa y sus canales</td><td>Contrasta razón social, RUT, domicilio y datos de contacto.</td></tr>
      <tr><td>La situación regulatoria</td><td>Consulta registros y alertas oficiales de la CMF usando la razón social.</td></tr>
      <tr><td>La propiedad y sus documentos</td><td>Revisa antecedentes del Conservador correspondiente y solicita una opinión jurídica independiente.</td></tr>
      <tr><td>Las condiciones y el pago</td><td>Verifica que los compromisos y el destinatario de los fondos coincidan con la documentación.</td></tr>
    </tbody></table></div>
  <p class="note" style="margin-top:24px">Tómate el tiempo para verificar. La presión para transferir, las promesas de ganancias sin riesgo y las negativas a entregar antecedentes son señales para detenerse y pedir aclaraciones. La ausencia de alertas no equivale a una autorización.</p>
  <ul class="facts" style="margin-top:24px">
    <li><strong>Razón social:</strong> Pulso Inversor SpA</li>
    <li><strong>Correo:</strong> <a href="mailto:{EMAIL}">{EMAIL}</a></li>
  </ul>
  {P("COMPLETAR RUT, domicilio, teléfono y demás canales oficiales; identificar la contraparte contractual de cada modalidad si fuera otra entidad.")}
  {P("INCORPORAR enlaces oficiales directos a los registros y alertas de la CMF; por ahora se enlaza el sitio general.")}
  {P("INCORPORAR enlace al perfil oficial de Google: 'Lee las opiniones de nuestros clientes en Google'.")}
  <div class="actions"><a class="btn btn-outline" href="https://www.cmfchile.cl" target="_blank" rel="noopener">Consultar registros y alertas de la CMF</a></div>
</div></section>
''' + cta('Si algo no está claro, conversemos', 'Pregúntanos por los antecedentes que necesitas para evaluar tu inversión.', 'Quiero resolver una duda', 'Quiero resolver una duda'))

# ---------------- 4.1 Mi primera inversión ----------------
page('mi-primera-inversion.html', 'Mi primera inversión',
     'Preguntas y conceptos para dar tu primer paso antes de explorar una alternativa de inversión.',
     hero('Recursos / Mi primera inversión', 'Una base para dar tu primer paso',
          'Comienza por estas preguntas y conceptos antes de explorar una alternativa.', 'Recursos') + f'''
<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">Prepárate</span><h2>Tres preguntas para prepararte</h2></div>
  <div class="grid-3">
    <article class="card"><div class="card-num">01</div><h3>¿Qué quiero lograr con esta inversión?</h3></article>
    <article class="card"><div class="card-num">02</div><h3>¿Qué recursos puedo destinar conservando dinero para mis gastos e imprevistos?</h3></article>
    <article class="card"><div class="card-num">03</div><h3>¿Durante cuánto tiempo puedo mantenerlos invertidos?</h3></article>
  </div>
</div></section>
<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Glosario</span><h2>Cinco conceptos útiles</h2></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Concepto</th><th>Explicación</th></tr></thead>
    <tbody>
      <tr><td>Capital</td><td>Recursos que aportas a la inversión.</td></tr>
      <tr><td>Rentabilidad</td><td>Resultado respecto del capital; revisa el período y los costos considerados.</td></tr>
      <tr><td>Plazo</td><td>Horizonte previsto para la inversión.</td></tr>
      <tr><td>Liquidez</td><td>Facilidad para convertir la inversión en dinero disponible.</td></tr>
      <tr><td>Respaldo</td><td>Derechos y garantías de la estructura, con el alcance indicado en sus documentos.</td></tr>
    </tbody></table></div>
</div></section>
<section class="section"><div class="container split">
  <div><span class="eyebrow">Tu primera reunión</span><h2>Lleva estas preguntas a tu primera conversación</h2>
    <div class="actions"><a class="btn btn-dark" href="como-funciona.html">Conocer el proceso</a></div></div>
  <ul class="facts">
    <li>¿Quién recibe los recursos y quién asume la obligación de pago?</li>
    <li>¿Qué documentos recibiré y qué derechos establecen?</li>
    <li>¿Qué costos debo considerar y qué ocurre si necesito recuperar mi dinero antes?</li>
  </ul>
</div></section>
''' + cta('Conversemos sobre lo que quieres construir', 'Cuéntanos tus objetivos y revisemos por dónde comenzar.', 'Conversar con el equipo', 'Mi primera inversión'))

# ---------------- 4.2 Experiencia ----------------
page('ya-tengo-experiencia.html', 'Ya tengo experiencia invirtiendo',
     'Criterios para evaluar cómo una alternativa de inversión se integra a tu patrimonio.',
     hero('Recursos / Ya tengo experiencia invirtiendo', 'Compara con una mirada más completa',
          'Utiliza estos criterios para evaluar cómo una alternativa se integra a tu patrimonio.', 'Recursos') + f'''
<section class="section"><div class="container">
  <div class="table-wrap"><table>
    <thead><tr><th>Criterio</th><th>Qué revisar</th></tr></thead>
    <tbody>
      <tr><td>Base de comparación</td><td>Mismo horizonte y moneda; distinguir tasas mensuales de anuales.</td></tr>
      <tr><td>Resultado neto</td><td>Costos e impuestos considerados, pagos durante el período y devolución del capital.</td></tr>
      <tr><td>Liquidez</td><td>Condiciones de salida y recursos que necesitas mantener disponibles.</td></tr>
      <tr><td>Exposición</td><td>Cuánto de tu patrimonio quedaría vinculado a una empresa, inmueble o estrategia.</td></tr>
      <tr><td>Escenarios</td><td>Efecto de cambios en los plazos, costos, ingresos o valor de salida.</td></tr>
    </tbody></table></div>
</div></section>
<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Para profundizar</span><h2>Accesos para profundizar</h2></div>
  <div class="grid-3">
    <article class="card"><h3>Tabla comparativa</h3><p>Mínimos, respaldo y plazos de cada alternativa.</p><a class="link-arrow" href="inversiones.html#comparar">Ver tabla</a></article>
    <article class="card"><h3>Garantías y documentos</h3><p>Qué aporta cada documento y qué puedes comprobar.</p><a class="link-arrow" href="garantias-y-documentos.html">Ver garantías</a></article>
    <article class="card"><h3>Operación abierta</h3><p>Cómo se documenta una operación real.</p><a class="link-arrow" href="verifica-a-pulso.html#operacion-abierta">Ver operación</a></article>
  </div>
</div></section>
''' + cta('Evalúa con los antecedentes completos', 'Te enviamos la información necesaria para analizar una alternativa.', 'Solicitar antecedentes para evaluar', 'Solicitud de antecedentes para evaluar'))

# ---------------- 4.3 FAQ ----------------
def qa(q, a):
    return f'<details><summary>{q}</summary><div class="details-body"><p>{a}</p></div></details>'
page('preguntas-frecuentes.html', 'Preguntas frecuentes',
     'Respuestas sobre cómo invertir con Pulso Inversor: montos, documentos, pagos, simuladores, impuestos y CMF.',
     hero('Recursos / Preguntas frecuentes', 'Respuestas para avanzar',
          'Lo que más nos preguntan antes de invertir.', 'Preguntas frecuentes') + f'''
<section class="section"><div class="container" style="max-width:860px">
  {qa('¿Necesito haber invertido antes?', 'Puedes comenzar por nuestra <a href="mi-primera-inversion.html">guía de primera inversión</a> y conversar con el equipo sobre tus objetivos.')}
  {qa('¿Desde cuánto puedo invertir?', 'Consulta los montos y requisitos en la <a href="inversiones.html#comparar">tabla comparativa de alternativas</a>.')}
  {qa('¿Puedo revisar los documentos con mi abogado?', 'Sí. Una revisión independiente puede ayudarte a comprender los derechos y condiciones de la operación antes de firmar.')}
  {qa('¿Cuándo recibiré pagos y cómo podré hacer seguimiento?', 'El material comercial contempla reportes trimestrales sobre compra, venta y resultados de los activos. Los pagos y su periodicidad se establecen en el contrato de la modalidad elegida.')}
  {P("COMPLETAR canal de entrega de reportes y calendario por alternativa.")}
  {P("AGREGAR cuando esté aprobada: '¿Puedo recuperar mi inversión antes del plazo?' (respuesta consistente con condiciones de salida, con enlace al detalle de cada alternativa).")}
  {P("AGREGAR cuando esté aprobada: '¿Qué costos debo considerar?' (costos del inversionista, momento de cobro, conceptos incluidos/excluidos por alternativa).")}
  {qa('¿El resultado del simulador es lo que recibiré?', 'Es una estimación basada en los datos y supuestos utilizados. Consulta “Cómo leer tu simulación” en <a href="simuladores.html">Simuladores</a> para interpretar el resultado y sus condiciones.')}
  {qa('¿Cómo se tratan los impuestos?', 'El tratamiento depende de la estructura y de tu situación. Puedes revisar los antecedentes con tu profesional tributario.')}
  {qa('¿Dónde reviso la situación de Pulso ante la CMF?', 'Encontrarás la explicación y los accesos de consulta en <a href="verifica-a-pulso.html">Verifica a Pulso</a>.')}
</div></section>
''' + cta('¿Tienes otra pregunta?', 'Escríbenos y te respondemos.', 'Consultar al equipo', 'Consulta al equipo'))
print('ok')
