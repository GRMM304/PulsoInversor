import os, re, urllib.parse
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMAIL = 'contacto@pulsoinversor.cl'

# WhatsApp comercial. PENDIENTE: confirmar el número (hoy es el que aparecía en el sitio anterior).
# Si cambia, actualizarlo también en assets/js/main.js (WHATSAPP).
WHATSAPP = '56983554676'
AGENDAR = 'Agendar una reunión'
# Redes sociales oficiales (pie de página y Verifica).
INSTAGRAM = 'https://www.instagram.com/pulsoinversorcl'
FACEBOOK = 'https://www.facebook.com/pulsoinversor.cl/'
LINKEDIN = 'https://www.linkedin.com/company/pulsoinversor/'
# Reseñas de Google (botón del pie de página).
RESENAS_GOOGLE = 'https://g.page/r/CV1wmi0Qf_B7EAE/review'
# Botón "Agendar una reunión" del menú: agenda de Brevo Meetings (hoy, la de Renato Vargas).
AGENDA_URL = 'https://meet.brevo.com/pulsoinversor/renato-vargas'
# Páginas cuyos botones de agendar (menú incluido) van a otra agenda.
AGENDA_POR_PAGINA = {
    'ya-tengo-experiencia.html': 'https://meet.brevo.com/pulsoinversor/pamela-herrera',  # Pamela Herrera
}

def mail(subject=None):
    """Enlace de contacto de los botones: abre WhatsApp con un mensaje que conserva el tema."""
    texto = 'Hola, quiero agendar una reunión con un asesor de Pulso Inversor.'
    if subject:
        texto += f' Tema: {subject}.'
    return f'https://wa.me/{WHATSAPP}?text=' + urllib.parse.quote(texto)

def P(text):
    """Marcador interno: no se muestra en el sitio."""
    return f'<!-- PENDIENTE: {text} -->'

NAV = [
    ('Cómo invertir', [('como-funciona.html', 'Cómo funciona'), ('inversiones.html', 'Inversiones'),
                       ('garantias-y-documentos.html', 'Garantías y respaldo'), ('simuladores.html', 'Simuladores')]),
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
    items.append(f'<li class="nav-cta-item" hidden-desktop><a href="{AGENDA_URL}" target="_blank" rel="noopener" data-agendar>{AGENDAR}</a></li>')
    return f'''<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="header">
  <div class="container nav">
    <a class="logo" href="index.html" aria-label="Pulso Inversor, ir al inicio"><img src="assets/img/logo-pulso-gmm.webp" alt="Pulso Inversor · Una empresa de Grupo Matchmaking" width="560" height="62"></a>
    <nav aria-label="Principal">
      <ul class="menu" id="menu">{''.join(items)}</ul>
    </nav>
    <div class="nav-actions"><a class="btn nav-cta" href="{AGENDA_URL}" target="_blank" rel="noopener" data-agendar>{AGENDAR}</a></div>
    <button class="mobile-toggle" type="button" aria-controls="menu" aria-expanded="false" aria-label="Abrir menú">☰</button>
  </div>
</header>'''

# Barra inferior fija en celular (estilo app): Inicio · Simular · Inversiones · Agendar.
_TAB_ICONS = {
    'inicio': '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
    'simular': '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" stroke-width="2.6"/>',
    'inversiones': '<path d="M4 19.5h16"/><path d="M6.5 16V11M11 16V7M15.5 16v-6M20 16V5"/>',
    'agendar': '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 14.5l2 2 4-4"/>',
}
def tabbar(slug):
    def item(clave, href, texto, activo=False, externo=False, extra=''):
        ic = f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{_TAB_ICONS[clave]}</svg>'
        ext = ' target="_blank" rel="noopener"' if externo else ''
        cur = ' aria-current="page"' if activo else ''
        return f'<a class="tab tab-{clave}{" is-active" if activo else ""}{extra}" href="{href}"{ext}{cur}>{ic}<span>{texto}</span></a>'
    return ('<nav class="tabbar" aria-label="Accesos rápidos">'
            + item('inicio', 'index.html', 'Inicio', slug == 'index.html')
            + item('simular', 'simuladores.html', 'Simular', slug == 'simuladores.html')
            + item('inversiones', 'inversiones.html', 'Inversiones', slug == 'inversiones.html')
            + item('agendar', AGENDA_URL, 'Agendar', externo=True, extra='" data-agendar="')
            + '</nav>')

def footer():
    cols = ''.join(f'<div><h4>{label}</h4><ul>' + ''.join(f'<li><a href="{s}">{t}</a></li>' for s, t in subs) + '</ul></div>' for label, subs in NAV)
    return f'''<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img class="logo-foot" src="assets/img/logo-pulso-blanco.webp" alt="Pulso Inversor" width="300" height="100">
        <p>Inversiones privadas vinculadas a bienes raíces mediante el modelo IGR: Inversión con Garantía Real.</p>
        <p><strong>Pulso Inversor SpA</strong><br><a href="mailto:{EMAIL}">{EMAIL}</a></p>
        <div class="footer-redes">
          <a href="{INSTAGRAM}" target="_blank" rel="noopener" aria-label="Pulso Inversor en Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></svg></a>
          <a href="{FACEBOOK}" target="_blank" rel="noopener" aria-label="Pulso Inversor en Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg></a>
          <a href="{LINKEDIN}" target="_blank" rel="noopener" aria-label="Pulso Inversor en LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 8.6h3v10.2h-3zM6.7 4a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10.2 8.6h2.9v1.4h.04c.4-.76 1.38-1.56 2.85-1.56 3.05 0 3.6 2 3.6 4.6v5.76h-3v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.95 1.32-1.95 2.7v5.18h-3z"/></svg></a>
        </div>
        <a class="usar-app" href="#" data-usar-app hidden>📲 Usar Pulso Inversor como app</a>
        {P("RUT, domicilio, teléfono y demás canales oficiales.")}
        <img class="logo-gmm" src="assets/img/logo-gmm-blanco.png" alt="Una empresa de Grupo Matchmaking" width="700" height="108">
      </div>
      {cols}
    </div>
    <div class="footer-review">
      <div><strong>¿Ya conversaste con nosotros?</strong><span>Tu experiencia ayuda a otras personas a decidir con más información.</span></div>
      <a class="btn footer-review-btn" href="{RESENAS_GOOGLE}" target="_blank" rel="noopener"><span aria-hidden="true">★</span> Déjanos tu reseña en Google</a>
    </div>
    <div class="footer-bottom">
      <span>© <span id="year">2026</span> Pulso Inversor SpA. Todos los derechos reservados.</span>
      <span><a href="privacidad.html">Política de privacidad</a> · La información de este sitio es referencial y no constituye una oferta ni asegura resultados.</span>
    </div>
  </div>
</footer>'''

import re as _re
def _etiquetar_tablas(html):
    """Agrega data-label a cada celda con el encabezado de su columna (para apilar tablas en celular)."""
    def una(m):
        t = m.group(0)
        heads = [_re.sub(r'<[^>]+>', '', h).strip() for h in _re.findall(r'<th[^>]*>(.*?)</th>', t, _re.S)]
        def fila(r):
            i = [0]
            def celda(c):
                k = i[0]; i[0] += 1
                lab = heads[k] if k < len(heads) else ''
                return f'<td data-label="{lab}"'
            return _re.sub(r'<td(?=[ >])', celda, r.group(0))
        return _re.sub(r'<tr>.*?</tr>', fila, t, flags=_re.S)
    html = _re.sub(r'<table>.*?</table>', una, html, flags=_re.S)
    return _re.sub(r'(<div class="table-wrap[^"]*"><table>.*?</table></div>)', r'\1<p class="tabla-hint" aria-hidden="true">Desliza para ver toda la tabla →</p>', html, flags=_re.S)

def _sin_punto(inner):
    """Quita el punto final y separa en dos líneas (con distinto grosor) un título de dos frases."""
    inner = _re.sub(r'(?<!\.)\.((?:\s*</[a-z]+>)*)\s*$', r'\1', inner)
    out, depth, i, partes = [], 0, 0, []
    for m in _re.finditer(r'<(/?)([a-z0-9]+)[^>]*>|(?<!\d)\.\s+(?=[<A-ZÁÉÍÓÚÑ¿¡«])', inner):
        if m.group(0).startswith('<'):
            if m.group(2) not in ('br', 'img'):
                depth += -1 if m.group(1) else 1
        else:
            partes.append((m.start(), m.end(), depth))
    if not partes:
        return inner
    a, b, d = partes[0]
    if d == 0:
        return inner[:a] + '<span class="h-sub">' + inner[b:] + '</span>'
    return inner[:a] + '<br>' + inner[b:]

def _titulos(html):
    html = _re.sub(r'(<h([1-6])(?:\s[^>]*)?>)(.*?)(</h\2>)', lambda m: m.group(1) + _sin_punto(m.group(3)) + m.group(4), html, flags=_re.S)
    html = _re.sub(r'(<(p|span|strong) class="(?:aht-tag|eyebrow[^"]*|rx-kicker[^"]*|why-kicker|yn-kicker|flip-kicker|gdeck-tag)">)(.*?)(</\2>)',
                   lambda m: m.group(1) + _sin_punto(m.group(3)) + m.group(4), html, flags=_re.S)
    html = _re.sub(r'(<div class="r2-head"><span>[^<]*</span><strong>)(.*?)(</strong>)', lambda m: m.group(1) + _sin_punto(m.group(2)) + m.group(3), html)
    return html

def page(slug, title, desc, body, scripts=''):
    body = _titulos(body)
    full = 'Pulso Inversor · Inversiones con garantía real' if slug == 'index.html' else f'{title} · Pulso Inversor'
    html = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{full}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{full}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/media/hero-poster.jpg">
<meta name="theme-color" content="#0E2C28">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/assets/img/app/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Pulso Inversor">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)}};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '4384764601785320');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=4384764601785320&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
</head>
<body>
{header(slug)}
<main id="contenido">
{body}
</main>
{tabbar(slug)}
<button class="to-top" type="button" aria-label="Volver arriba"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
{footer()}
<script src="assets/js/main.js"></script>{scripts}
<script src="assets/js/lorenzo.js" defer></script>
</body>
</html>
'''
    html = html.replace(' hidden-desktop', ' data-mobile-only')
    html = _etiquetar_tablas(html)
    if slug in AGENDA_POR_PAGINA:
        html = html.replace(AGENDA_URL, AGENDA_POR_PAGINA[slug])
    open(os.path.join(R, slug), 'w').write(html)

def hero(crumb, h1, p, eyebrow=None):
    eb = f'<span class="eyebrow dark">{eyebrow}</span>' if eyebrow else ''
    return f'''<section class="page-hero"><div class="container">
<div class="breadcrumb"><a href="index.html">Inicio</a> / {crumb}</div>{eb}
<h1>{h1}</h1><p>{p}</p></div></section>'''

def whatsapp(texto):
    """Enlace a WhatsApp con un mensaje exacto."""
    return f'https://wa.me/{WHATSAPP}?text=' + urllib.parse.quote(texto)

def cta(h, p, label, subject, href=None):
    return f'''<section class="section"><div class="container"><div class="cta-band">
<div><h2>{h}</h2><p>{p}</p></div>
<a class="btn btn-primary" href="{href or mail(subject)}" target="_blank" rel="noopener">{label}</a></div></div></section>'''

def cta_rutas(eyebrow, titulo, texto):
    return f'''<section class="cta-final">
  <div class="container">
    <span class="eyebrow dark">{eyebrow}</span>
    <h2>{titulo}</h2>
    <p>{texto}</p>
    <div class="cta-final-actions">
      <a class="btn btn-primary btn-xl" href="simuladores.html">Simular mi inversión <span aria-hidden="true">→</span></a>
      <a class="btn btn-secondary" href="mi-primera-inversion.html">Es mi primera vez</a>
      <a class="btn btn-secondary" href="ya-tengo-experiencia.html">Ya he invertido</a>
    </div>
    <p class="cta-final-small">No te pedimos decidir en la reunión. Puedes venir con tu pareja, un socio o tu abogado.</p>
  </div>
</section>'''

def cta_final(eyebrow='Tu siguiente paso', titulo='Cuéntanos qué quieres <span class="accent">construir</span>',
              texto='Una conversación para conocernos y ver por dónde partir. Sin apuro.', boton=None, tema=None):
    boton = boton or AGENDAR
    return f'''<section class="cta-final">
  <div class="container">
    <span class="eyebrow dark">{eyebrow}</span>
    <h2>{titulo}</h2>
    <p>{texto}</p>
    <a class="btn btn-primary btn-xl" href="{AGENDA_URL}" target="_blank" rel="noopener">{boton} <span aria-hidden="true">→</span></a>
    <ul class="cta-final-notes">
      <li>Te responde una persona del equipo</li>
      <li>No te pedimos decidir en la reunión</li>
      <li>Puedes venir con tu abogado</li>
    </ul>
  </div>
</section>'''


# ---------------- Íconos (trazo simple, heredan el color del texto) ----------------
_ICONS = {
    'brote': '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 14c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z"/>',
    'camino': '<path d="M4 19l5-14"/><path d="M20 19l-5-14"/><path d="M12 6v2"/><path d="M12 11v2"/><path d="M12 16v3"/>',
    'escudo': '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    'billetera': '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16" cy="14.5" r="1"/>',
    'reloj': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    'casa': '<path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    'manos': '<path d="M3 12l4-4 4 3 3-3 4 4"/><path d="M7 8l-2 9h14l-2-9"/>',
    'documento': '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h5M10 16h5"/>',
    'grafico': '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 15l3-4 3 2 5-6"/>',
}
def icon(name):
    return f'<div class="card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{_ICONS[name]}</svg></div>'

PASOS = '''<li><strong>Nos cuentas qué buscas</strong><span>Partimos por escucharte: qué quieres lograr y qué te preocupa.</span></li>
    <li><strong>Conoces tu alternativa</strong><span>Revisamos juntos una propuesta y sus condiciones.</span></li>
    <li><strong>Decides con calma</strong><span>Te llevas los documentos y resolvemos cada pregunta, las veces que haga falta.</span></li>
    <li><strong>Inviertes acompañado</strong><span>Formalizas tu inversión y sigues en contacto directo con el equipo.</span></li>'''

CTA_GENERAL = ('Cuéntanos qué quieres construir', 'Una conversación para conocernos y ver por dónde partir. Sin apuro.', AGENDAR, None)

PRODUCTS = [
    ('Rescate Inmobiliario', 'Haz crecer tu capital y ayuda a que una familia que enfrenta un remate tenga una nueva oportunidad.', 'rescate-inmobiliario'),
    ('Hipoteca Inteligente', 'Usa tu capacidad de crédito para empezar a construir tu patrimonio inmobiliario.', 'hipoteca-inteligente'),
    ('Configuración Patrimonial', 'Ordena lo que has construido pensando en tu familia y en lo que quieres dejar.', 'configuracion-patrimonial'),
    ('Inversión Inmobiliaria Circular', 'Dale una nueva vida al capital de tu propiedad, con menos preocupaciones de arriendo.', 'inversion-circular'),
]

# ---------------- 1. Inicio ----------------
_ICONS['calendario'] = '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2M14 17h2"/>'
_ICONS['doc-check'] = '<path d="M6 3h9l3 3v8"/><path d="M6 3v18h7"/><path d="M9 8h6M9 11h6M9 14h3"/><circle cx="17.5" cy="18" r="3.5"/><path d="M16 18l1 1 2-2"/>'

# Matriz de estrategias del Modelo IGR (imagen entregada por la usuaria el 2026-11-18).
CAMINOS = [
    ('renta-de-capital', 'Renta de Capital', 'Proyecto Nuevo Hogar',
     'Una estrategia para poner a trabajar tu capital disponible y generar una renta periódica alta, segura y con respaldo real.',
     'Inversionistas con capital disponible desde $5.000.000.',
     'Renta periódica, con garantía real y una rentabilidad muy superior a la de un depósito a plazo.'),
    ('produccion-de-capital', 'Producción de Capital', 'Hipoteca Inteligente',
     'Usa tu capacidad financiera para generar un activo que produce capital, combinando financiamiento bancario, control del arriendo y valorización del inmueble.',
     'Personas con capacidad de crédito hipotecario y buen comportamiento financiero.',
     'Produces capital con financiamiento del banco, generas flujo por arriendo y construyes patrimonio.'),
    ('arquitectura-de-capital', 'Arquitectura de Capital', 'Configuración Patrimonial',
     'Diseña una estructura integral de inversión y patrimonio que combina tus bienes, ingresos y ahorros, según tus objetivos, plazos y necesidades (tributarias, sucesorias o familiares).',
     'Personas con bienes, ingresos y/o ahorros que buscan una estrategia patrimonial integral.',
     'Protección, eficiencia, continuidad y crecimiento de tu patrimonio, con una configuración personalizada.'),
]
_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
cards = ''.join(f'''<a class="camino{' is-open' if i == 0 else ''}" href="inversiones.html#{a}" data-camino>
  <div class="camino-bg camino-bg-{i+1}" aria-hidden="true"></div>
  <div class="camino-top"><span class="camino-num">0{i+1}</span><span class="camino-arrow">{_ARROW}</span></div>
  <div class="camino-bottom">
    <h3>{t}</h3>
    <div class="camino-detail"><div class="camino-inner">
      <div class="camino-rows uno">
        <div class="camino-row"><span class="camino-label">A quiénes</span><span>{q}</span></div>
      </div>
    </div></div>
  </div>
</a>''' for i, (a, t, inv, d, q, lg) in enumerate(CAMINOS))

def bullets(items):
    return '<ul class="choice-list">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'

TESTIMONIOS = [
    ('Fadi Layous', 'Socio en Pitahouse', 'FL',
     ['Al principio partí con una inversión en Leaseback para conocer cómo funcionaba. Con el tiempo fui tomando más confianza en Pulso Inversor y me animé a seguir invirtiendo.',
      'No fue algo de un día para otro. Empecé con un monto y después fui aumentando lo que invertía, porque me fui sintiendo más cómodo con el modelo. Hoy veo que esa confianza se fue construyendo con la experiencia. Por eso he seguido participando en nuevas operaciones.']),
    ('Juan Manuel Silva', 'Inversionista', 'JS',
     ['Buscando otras opciones para invertir encontré Pulso Inversor. Me interesaban los activos alternativos, pero no conocía la Estrategia Acción. Pregunté cómo funcionaba y fui aclarando mis dudas antes de invertir. Eso me dio confianza para empezar. Hasta ahora estoy contento con la experiencia; para mí es importante poder preguntar cuando hay algo que no entiendo.']),
]
def testimonio(nombre, cargo, ini, parrafos):
    cuerpo = ''.join(f'<p>{x}</p>' for x in parrafos)
    return f'''<figure class="testimonio">
      <div class="review-quote" aria-hidden="true">“</div>
      <blockquote>{cuerpo}</blockquote>
      <figcaption><span class="testimonio-avatar" aria-hidden="true">{ini}</span><span><strong>{nombre}</strong><small>{cargo}</small></span></figcaption>
    </figure>'''

page('index.html', 'Inicio',
     'Explora alternativas de inversión vinculadas al mercado inmobiliario y encuentra un punto de partida para tus objetivos. Agenda una conversación con un asesor.', f'''
<section class="hero">
  <img class="hero-bg" src="assets/media/hero-santiago.jpg" srcset="assets/media/hero-santiago-movil.jpg 1000w, assets/media/hero-santiago.jpg 1920w" sizes="100vw" alt="" fetchpriority="high" decoding="async">
  <div class="container"><div class="hero-content">
    <span class="eyebrow dark">Inversión con Garantía Real y Resguardo Patrimonial</span>
    <h1>Tu próxima inversión <span class="accent">comienza con claridad</span></h1>
    <p>Explora alternativas vinculadas al mercado inmobiliario y encuentra un punto de partida para tus objetivos.</p>
    {P("El botón Empecemos por ti abre la agenda de Brevo de Felipe Rojas (assets/js/main.js).")}
    <form class="hero-form" data-agenda novalidate>
      <label for="agenda-nombre" class="sr-only">Tu nombre</label>
      <input id="agenda-nombre" name="nombre" type="text" autocomplete="given-name" placeholder="Escribe tu nombre" required>
      <button class="btn btn-primary" type="submit">Empecemos por ti <span aria-hidden="true">→</span></button>
    </form>
  </div>
  {P("CIFRAS retiradas a pedido de la usuaria (2026-11-16): cartera aprox. $4.000 millones; rentabilidades desde 0,8%.")}
  <div class="hero-team">
    <div class="avatars">
      <img src="assets/img/equipo/ivan-barboza-avatar.jpg" alt="Iván Barboza" title="Iván Barboza" width="240" height="240" loading="lazy">
      <img src="assets/img/equipo/felipe-rojas-avatar.jpg" alt="Felipe Rojas" title="Felipe Rojas" width="240" height="240" loading="lazy">
      <img src="assets/img/equipo/jessica-valenzuela.jpg" alt="Jessica Valenzuela" title="Jessica Valenzuela" width="240" height="240" loading="lazy">
      <img src="assets/img/equipo/felipe-jana.jpg" alt="Felipe Jaña" title="Felipe Jaña" width="240" height="240" loading="lazy">
      <img src="assets/img/equipo/william-rojas.jpg" alt="William Rojas" title="William Rojas" width="240" height="240" loading="lazy">
      <img src="assets/img/asesores/pamela.webp" alt="Pamela Herrera" title="Pamela Herrera" width="240" height="240" loading="lazy">
      <img src="assets/img/equipo/renato-vargas.jpg" alt="Renato Vargas" title="Renato Vargas" width="240" height="240" loading="lazy">
      <img src="assets/img/equipo/santiago-fernandez.jpg" alt="Santiago Fernández" title="Santiago Fernández" width="240" height="240" loading="lazy">
    </div>
    <strong>Quienes te acompañan</strong>
  </div>
  </div>
</section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Hablemos de lo que te sirve</span><h2>¿Inviertes por primera vez?</h2>
    <p class="lead">No es lo mismo dar el primer paso fuera del banco que venir de fondos, acciones o crowdfunding. Elige y te llevamos a la información pensada para ti.</p></div>
  <div class="grid-2 choice-grid">
    <a class="card profile-card choice" href="mi-primera-inversion.html">
      <h3><span class="choice-tag yes">Sí</span> es mi primera vez</h3>
      <p>Tengo mis ahorros en el banco y quiero hacerlos crecer, pero me preocupa arriesgar mi dinero.</p>
      {bullets(['<span><strong>Invierte desde $5 millones</strong>, sin necesidad de comprometer todos tus ahorros.</span>',
                '<span>Tu inversión está <strong>respaldada por un inmueble</strong>, no solo por una promesa de pago.</span>',
                '<span>Conoce <strong>cuánto podrías ganar y en qué plazo</strong>, antes de tomar una decisión.</span>'])}
      <span class="btn btn-primary">Quiero conocer cómo funciona</span></a>
    <a class="card profile-card choice" href="ya-tengo-experiencia.html">
      <h3><span class="choice-tag no">No</span> ya he invertido</h3>
      <p>¿Estás por renovar tu depósito a plazo o quieres saber si puedes invertir con financiamiento bancario? Conoce las nuevas alternativas de Pulso Inversor.</p>
      {bullets(['<span><strong>Invierte parte de tus ahorros.</strong> Explora opciones de inversión inmobiliaria según el monto que quieras destinar.</span>',
                '<span><strong>Aprovecha tu capacidad de crédito.</strong> Evalúa si puedes financiar la compra de una propiedad con un crédito hipotecario para construir patrimonio.</span>',
                '<span><strong>Compara antes de decidir.</strong> Revisa cuánto podrías ganar, cómo y cuándo recuperarías tu dinero, y qué respaldo tiene cada opción.</span>'])}
      <span class="btn btn-dark">Quiero comparar alternativas</span></a>
  </div>
</div></section>

<section class="section section-soft" id="por-que-pulso"><div class="container">
  <div class="title center"><span class="eyebrow">¿Por qué invertir con Pulso Inversor?</span><h2>Conoce qué hay detrás de tu inversión</h2></div>
  <div class="why" data-why data-reveal>
    <div class="why-compare">
      <div class="why-col why-other">
        <span class="why-kicker">Otras alternativas</span>
        <h3>Lo que ya conoces</h3>
        <p>Otros instrumentos financieros ofrecen tasas de interés más bajas y, con ellas, retornos más bajos.</p>
        <p>Además, están expuestos a las variaciones del mercado.</p>
        <p>Si compras una propiedad para invertir, muchas veces tienes que complementar el dividendo de tu bolsillo y hacerte cargo de mantenerla.</p>
      </div>
      <div class="why-col why-pulso">
        <span class="why-kicker">Con nosotros</span>
        <h3>Pulso Inversor</h3>
        <p>Intereses que superan ampliamente a los de otros instrumentos financieros.</p>
        <p>Retornos definidos por contrato, estructurados en escrituras públicas y pagarés.</p>
        <p>Distintas estructuras de inversión, con acceso a oportunidades en remate y a portafolios con descuento.</p>
      </div>
    </div>
    <div class="why-m"><span class="why-kicker">Con nosotros</span><h3>Pulso Inversor</h3>
      <div class="why-m-item"><p class="why-m-pulso">Intereses que superan ampliamente a los de otros instrumentos financieros.</p><p class="why-m-otra"><span>Otras alternativas</span>Otros instrumentos financieros ofrecen tasas de interés más bajas y, con ellas, retornos más bajos.</p></div>
      <div class="why-m-item"><p class="why-m-pulso">Retornos definidos por contrato, estructurados en escrituras públicas y pagarés.</p><p class="why-m-otra"><span>Otras alternativas</span>Además, están expuestos a las variaciones del mercado.</p></div>
      <div class="why-m-item"><p class="why-m-pulso">Distintas estructuras de inversión, con acceso a oportunidades en remate y a portafolios con descuento.</p><p class="why-m-otra"><span>Otras alternativas</span>Si compras una propiedad para invertir, muchas veces tienes que complementar el dividendo de tu bolsillo y hacerte cargo de mantenerla.</p></div>
    </div>
    <div class="why-igr">
      <p class="lead">Descubre cómo te acompañamos y qué información tendrás para evaluar tu alternativa. Antes de invertir, deberías poder responder estas tres preguntas con documentos en la mano. Así trabaja el Modelo IGR.</p>
      <div class="igr-list">
        <article class="igr-item">{icon('casa')}<div><h3>¿Qué respalda mi dinero?</h3><p>Una propiedad concreta, con su tasación y su precio de compra.</p></div></article>
        <article class="igr-item">{icon('doc-check')}<div><h3>¿Qué queda a mi favor?</h3><p>Un documento firmado ante notario que puedes revisar con tu abogado.</p></div></article>
        <article class="igr-item">{icon('calendario')}<div><h3>¿Cómo recupero mi dinero?</h3><p>Un calendario de pagos por escrito, antes de firmar.</p></div></article>
      </div>
    </div>
  </div>
  <div class="why-cta"><a class="btn btn-primary btn-xl" href="https://meet.brevo.com/pulsoinversor/pamela-herrera" target="_blank" rel="noopener">Descubre cómo funciona <span aria-hidden="true">→</span></a><span>Respaldo, estructura legal y plazos, explicados paso a paso</span></div>
  <p class="disclaimer">Comparación general y referencial. Toda inversión, incluidas las nuestras, tiene riesgos.</p>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Matriz IGR</span><h2>Tres estrategias para rentabilizar, producir y diseñar tu patrimonio</h2></div>
  <div class="caminos-acc">{cards}</div>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title center"><span class="eyebrow">Personas reales, con nombre</span><h2>Lo que encontraron quienes ya invirtieron</h2>
    <p class="lead">Perfiles distintos, la misma experiencia: condiciones claras, documentos que se pueden revisar y lo acordado, cumplido.</p></div>
  <div class="reviews">
    <figure class="video-testimonio">
      <video controls playsinline preload="none" poster="assets/media/testimonio-gonzalo.jpg"><source src="assets/media/testimonio-gonzalo.mp4" type="video/mp4"></video>
      <figcaption><strong>Gonzalo</strong>, kinesiólogo. Tenía sus ahorros quietos en el banco y aquí cuenta cómo fue su primera inversión con Pulso Inversor.</figcaption>
    </figure>
    <div class="review-list">
      {''.join(testimonio(*t) for t in TESTIMONIOS)}
      {P("Espacio para un tercer testimonio o reseña de Google (texto, autor y cargo).")}
    </div>
  </div>
  {P("INCORPORAR enlace al perfil oficial de Pulso en Google: botón 'Ver opiniones en Google'.")}
  <p class="disclaimer" style="text-align:center">Las experiencias corresponden a casos particulares y no aseguran resultados futuros.</p>
</div></section>
''' + cta_rutas('Tu siguiente paso', 'Cuéntanos qué quieres <span class="accent">construir</span>',
               'Simula tu inversión o dinos si es tu primera vez, y te llevamos a lo que te sirve.'))

# ---------------- 2.1 Cómo funciona ----------------
PILARES = [
    ('escudo', 'Respaldo inmobiliario', 'Todas las operaciones están vinculadas únicamente a bienes raíces comprados a precios de oportunidad.',
     'Tu capital tiene cobertura: las propiedades se compran bajo su valor, y ese margen protege tu inversión hasta que se transan según la operación.'),
    ('documento', 'Estructura legal', 'La operación se formaliza mediante contratos y garantías, según el instrumento de inversión.',
     'Sabes quién tiene la obligación de pagarte, qué derechos te corresponden y qué mecanismos existen ante un incumplimiento.'),
    ('calendario', 'Retorno y plazo', 'Los intereses, el vencimiento y las condiciones de pago quedan establecidos por contrato.',
     'Puedes planificar tus próximos movimientos financieros, sabiendo cuánto tienes pactado recibir y cuándo corresponde cada pago.'),
]
pilares = ''.join(f'''<button class="flip" type="button" aria-pressed="false">
      <span class="flip-inner">
        <span class="flip-face flip-front">{icon(ic)}<span class="flip-num">0{i+1}</span><strong>{t}</strong><span class="flip-text">{d}</span><span class="flip-hint">¿Qué significa para ti? <span aria-hidden="true">↻</span></span></span>
        <span class="flip-face flip-back"><span class="flip-kicker">¿Qué significa para ti?</span><strong>{t}</strong><span class="flip-text">{b}</span></span>
      </span>
    </button>''' for i, (ic, t, d, b) in enumerate(PILARES))

PASOS_CAMINO = [
    ('Simula tu inversión', 'Explora nuestras soluciones: conoce una estimación de tus intereses según el monto y el plazo.',
     'Tus números, primero.', [('Exploras', 'Nuestras soluciones'), ('Defines', 'Monto y plazo'), ('Obtienes', 'Una estimación de tus intereses')]),
    ('Conversemos sobre tus objetivos', 'Un asesor conoce tu perfil, resuelve tus dudas y te orienta sobre las alternativas disponibles.',
     'Hablamos contigo.', [('Conocemos', 'Tu perfil'), ('Resolvemos', 'Tus dudas'), ('Te orientamos', 'Sobre las alternativas disponibles')]),
    ('Evalúa una operación concreta', 'Recibe información del inmueble, su tasación, las condiciones financieras y la estructura de la inversión.',
     'Una operación real.', [('El inmueble', 'Información y tasación'), ('Las condiciones', 'Financieras'), ('La inversión', 'Su estructura')]),
    ('Revisa y formaliza', 'Analiza los documentos, consulta con tu abogado si lo deseas y formaliza la operación ante notario.',
     'A tu ritmo.', [('Analizas', 'Los documentos'), ('Consultas', 'Con tu abogado, si lo deseas'), ('Formalizas', 'Ante notario')]),
    ('Recibe tus pagos y seguimiento', 'Accede a los pagos y reportes conforme al contrato. Al vencimiento se realiza el cierre de la operación, según las condiciones pactadas.',
     'Hasta el cierre.', [('Recibes', 'Pagos según contrato'), ('Accedes', 'A tus reportes'), ('Al vencimiento', 'El cierre de la operación')]),
]
_CHECK = '<svg class="ico-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
_CROSS = '<svg class="ico-cross" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>'
ruta_steps = ''.join(f'''<li><button type="button" class="r2-step{' is-active' if i == 0 else ''}" data-i="{i}" aria-expanded="{'true' if i == 0 else 'false'}">
        <span class="r2-num">{i+1}</span>
        <span class="r2-body">
          <span class="r2-title">{t}</span>
          <span class="r2-desc"><span class="r2-desc-in"><span class="r2-text">{d}</span>
            <span class="r2-rows-m">''' + ''.join(f'<span><em>{l}</em>{v}</span>' for l, v in rows) + f'''</span></span></span>
          <span class="r2-bar" aria-hidden="true"><i></i></span>
        </span>
      </button></li>''' for i, (t, d, h, rows) in enumerate(PASOS_CAMINO))
ruta_cards = ''.join(f'''<div class="r2-card{' is-active' if i == 0 else ''}" data-card="{i}" aria-hidden="{'false' if i == 0 else 'true'}">
        <div class="r2-head"><span>Paso {i+1} de {len(PASOS_CAMINO)}</span><strong>{h}</strong></div>
        <div class="r2-rows">''' + ''.join(f'<div class="r2-row"><span>{l}</span><strong>{v}</strong></div>' for l, v in rows) + '''</div>
      </div>''' for i, (t, d, h, rows) in enumerate(PASOS_CAMINO))

page('como-funciona.html', 'Cómo funciona',
     'Invertir también puede generar impacto. Así funciona el Modelo IGR: respaldo inmobiliario, estructura legal y retorno y plazo definidos por contrato.', f'''
<section class="page-hero cf-hero"><div class="container cf-hero-grid">
  <div>
    <div class="breadcrumb"><a href="index.html">Inicio</a> / Cómo invertir / Cómo funciona</div>
    <span class="eyebrow dark">Modelo IGR</span>
    <h1>Porque invertir también puede generar impacto</h1>
    <p>Estructuramos inversiones privadas vinculadas a bienes raíces mediante el modelo IGR: Inversión con Garantía Real y respaldo patrimonial. Conectamos objetivos de inversión con soluciones de liquidez para propietarios, a través de una relación directa con cada inversionista.</p>
  </div>
  <figure class="cf-video">
    {P("VIDEO de Felipe Rojas (de newpulso). En newpulso estaba marcado: 'confirmar uso; el video dice «doble garantía real»'.")}
    <video controls playsinline preload="none" poster="assets/media/felipe-que-es-igr.jpg"><source src="assets/media/felipe-que-es-igr.mp4" type="video/mp4"></video>
    <figcaption><strong>Felipe Rojas</strong> te explica el Modelo IGR</figcaption>
  </figure>
</div></section>
{P("VALIDAR INTERNAMENTE: compromisos de entrega de documentos antes de firmar, acompañamiento y atención expresados en esta página; confirmar que coinciden con la práctica real.")}

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Los tres pilares del Modelo IGR</span><h2>Tres pilares para invertir con mayor claridad</h2>
    <p class="lead">Cada operación se estructura sobre tres elementos que te permiten conocer dónde inviertes, qué derechos tienes y bajo qué condiciones recuperarás tu capital.</p></div>
  <div class="flip-grid">{pilares}</div>
</div></section>

<section class="section ruta-section"><div class="container">
  <div class="title center"><span class="eyebrow dark">Tu experiencia con Pulso Inversor</span><h2>Así es tu camino con Pulso Inversor</h2>
    <p class="lead">Desde la primera evaluación hasta el cierre de tu inversión, conoces las condiciones de cada etapa.</p></div>
  <div class="r2" data-r2>
    <div class="r2-steps">
      <ol class="r2-list">{ruta_steps}</ol>
      <p class="r2-caption r2-caption-list">Toca cada etapa para ver qué pasa en ella.</p>
    </div>
    <div class="r2-stage" aria-live="polite">
      <div class="r2-frame">{ruta_cards}</div>
    </div>
  </div>
</div></section>

<section class="section" id="forma-de-trabajar"><div class="container">
  <div class="title center"><span class="eyebrow">Nuestra forma de trabajar</span><h2>Claridad desde el primer contacto</h2>
    <p class="lead">Queremos que tomes decisiones informadas, a tu ritmo y con acompañamiento directo.</p></div>
  <div class="yn" data-reveal>
    <div class="yn-card yn-yes"><span class="yn-kicker">Lo que sí hacemos</span><ul>
      <li>{_CHECK}<div><span>Te entregamos los antecedentes antes de firmar.</span></div></li>
      <li>{_CHECK}<div><span>Te explicamos los beneficios, riesgos y condiciones de cada operación.</span></div></li>
      <li>{_CHECK}<div><span>Te acompañamos mediante una relación directa y personalizada.</span></div></li></ul></div>
    <div class="yn-card yn-no"><span class="yn-kicker">Lo que no hacemos</span><ul>
      <li>{_CROSS}<div><span>Presionarte para decidir en la primera reunión.</span></div></li>
      <li>{_CROSS}<div><span>Prometer intereses sin explicar la operación y sus riesgos.</span></div></li>
      <li>{_CROSS}<div><span>Operar como una plataforma de crowdfunding o financiamiento colectivo.</span></div></li></ul></div>
  </div>
</div></section>

<section class="cta-final">
  <div class="container">
    <span class="eyebrow dark">Tu siguiente paso</span>
    <h2>Ahora que sabes cómo funciona, <span class="accent">mira tus números</span></h2>
    <p>Simula tu inversión o cuéntanos si es tu primera vez y te llevamos a lo que te sirve.</p>
    <div class="cta-final-actions">
      <a class="btn btn-primary btn-xl" href="simuladores.html">Simular mi inversión <span aria-hidden="true">→</span></a>
      <a class="btn btn-secondary" href="mi-primera-inversion.html">Es mi primera vez</a>
      <a class="btn btn-secondary" href="ya-tengo-experiencia.html">Ya he invertido</a>
    </div>
    <p class="cta-final-small">No te pedimos decidir en la reunión. Puedes venir con tu pareja, un socio o tu abogado.</p>
  </div>
</section>
''')

# ---------------- 2.2 Inversiones ----------------
_ICONS['hipoteca'] = '<path d="M3.5 11L12 4.5l8.5 6.5"/><path d="M5.5 9.8V20h13V9.8"/><rect x="9.5" y="13" width="5" height="4" rx="1"/><path d="M10.5 13v-1.3a1.5 1.5 0 0 1 3 0V13"/>'
_ICONS['llave'] = '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8"/><path d="M16 7l2.5 2.5M14 9l1.5 1.5"/>'
# Mecánica entregada por la usuaria el 2026-11-17. "Rescate Inmobiliario" = estrategias de participación (Acción, Hipoteca, Título).
def pasos(lista):
    def li(i, x):
        t, d = x[0], x[1]
        opc = len(x) > 2 and x[2]
        return (f'<li{" class=opt" if opc else ""}><span class="paso-n">{i+1}</span><div>'
                + ('<span class="paso-opt">Opcional</span>' if opc else '') + f'<strong>{t}</strong><p>{d}</p></div></li>')
    return '<ol class="pasos">' + ''.join(li(i, x) for i, x in enumerate(lista)) + '</ol>'

# Condiciones según la "Tabla de condiciones" entregada el 2026-11-18.
ESTRATEGIAS = [
    ('A', 'Acción', 'Acceso flexible con respaldo notarial.', 'Pagaré', '$5.000.000', '12, 18 o 24 meses', '1,0% a 1,2%', 'Sí, según contrato'),
    ('H', 'Hipoteca', 'Inversión respaldada por garantía hipotecaria.', 'Hipoteca', '$25.000.000', '15, 21 o 27 meses', '0,7% a 0,9% + UF', 'No'),
    ('T', 'Título', 'Máximo respaldo mediante título de propiedad.', 'Título', '$100.000.000', '15, 21 o 27 meses', '0,8% a 1,0% + UF', 'No'),
]
estrategias = ''.join(f"""<article class="aht" id="estrategia-{n.lower().replace('í','i').replace('ó','o')}">
      <span class="aht-letter" aria-hidden="true">{l}</span>
      <h3>{n}</h3>
      <p class="aht-tag">{tag}</p>
      <dl class="aht-rows">
        <div><dt>Garantía real</dt><dd>{gar}</dd></div>
        <div><dt>Ticket mínimo</dt><dd>{tk}</dd></div>
        <div><dt>Plazo</dt><dd>{pl}</dd></div>
        <div><dt>Interés mensual</dt><dd>{it}</dd></div>
        <div><dt>Retiro anticipado</dt><dd>{rt}</dd></div>
      </dl>
    </article>""" for l, n, tag, gar, tk, pl, it, rt in ESTRATEGIAS)

# Matriz IGR (2026-11-18): en las tarjetas solo el nombre; al abrir, por qué se llama así, a quiénes, tres rectángulos de condiciones y qué logras.
def _rect(kicker, titulo, filas=()):
    dl = ('<dl>' + ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in filas) + '</dl>') if filas else ''
    return f'<article class="est-rect"><span class="est-rect-k">{kicker}</span><h4>{titulo}</h4>{dl}</article>'
ESTRATEGIAS_IGR = [
    ('renta-de-capital', 'Renta de Capital',
     'Una estrategia para poner a trabajar tu capital disponible y generar una renta periódica alta, segura y con respaldo real.',
     'Inversionistas con capital disponible desde $5.000.000.',
     [('estrategia-titulo', 'Garantía real', 'Título', [('Plazo', '15, 21 o 27 meses'), ('Interés mensual', '0,8% · 0,9% · 1,0% + UF'), ('Retiros', 'No'), ('Ticket mínimo', '$100.000.000')]),
      ('estrategia-hipoteca', 'Garantía real', 'Hipoteca', [('Plazo', '15, 21 o 27 meses'), ('Interés mensual', '0,7% · 0,8% · 0,9% + UF'), ('Retiros', 'No'), ('Ticket mínimo', '$25.000.000')]),
      ('estrategia-pagare', 'Garantía real', 'Pagaré', [('Plazo', '12, 18 o 24 meses'), ('Interés mensual', '1,0% · 1,1% · 1,2%'), ('Retiros', 'Sí'), ('Ticket mínimo', '$5.000.000')])],
     'Renta periódica, con garantía real y una rentabilidad muy superior a la de un depósito a plazo.',
     '<a class="btn btn-primary btn-xl" href="simuladores.html#sim-proyecta">Simular Renta de Capital <span aria-hidden="true">→</span></a>'),
    ('produccion-de-capital', 'Producción de Capital',
     'Utiliza tu capacidad financiera (scoring) para generar un activo que produce capital, combinando financiamiento bancario, control del arriendo y valorización del inmueble.',
     'Personas con capacidad de crédito hipotecario y buen comportamiento financiero.',
     [('', 'Propiedades', 'Desde 2.000 UF', []), ('', 'Retorno', '5% + UF anual', []), ('', 'Horizonte', '2 a 5 años', [])],
     'Produces capital con financiamiento del banco, generas flujo por arriendo y construyes patrimonio.',
     f'<a class="btn btn-primary btn-xl" href="{AGENDA_URL}" target="_blank" rel="noopener">Solicitar una simulación asistida <span aria-hidden="true">→</span></a><p class="inv-asist">Esta simulación la haces junto a un asesor de Pulso Inversor.</p>'),
    ('arquitectura-de-capital', 'Arquitectura de Capital',
     'Te permite diseñar una estructura integral de inversión y patrimonio, combinando tus bienes, ingresos y ahorros, según tus objetivos, plazos y necesidades especiales (tributarias, sucesorias o familiares).',
     'Personas con bienes, ingresos y/o ahorros que buscan una estrategia patrimonial integral.',
     [('', 'Diseño a medida', 'Opciones de inversión', []), ('', 'Diseño a medida', 'Opciones de financiamiento', []), ('', 'Diseño a medida', 'Estructura legal', [])],
     'Protección, eficiencia, continuidad y crecimiento de tu patrimonio, con una configuración personalizada.',
     f'<a class="btn btn-primary btn-xl" href="{AGENDA_URL}" target="_blank" rel="noopener">Solicitar una simulación asistida <span aria-hidden="true">→</span></a><p class="inv-asist">Esta simulación la haces junto a un asesor de Pulso Inversor.</p>'),
]
tipos = ''.join(f"""<button type="button" class="tipo tipo-solo" data-inv-tab="{a_}" aria-expanded="false" aria-controls="{a_}">
      <span class="tipo-n">0{i+1}</span><h3>{t}</h3>
      <span class="tipo-go"><span class="tipo-go-open">Ver detalle</span><span class="tipo-go-close">Cerrar</span> <i aria-hidden="true">↓</i></span></button>""" for i, (a_, t, *_r) in enumerate(ESTRATEGIAS_IGR))
def _panel(i, a_, t, porque, quien, rects, logras, cta):
    rs = ''.join(_rect(k, h, f).replace('<article class="est-rect">', f'<article class="est-rect"{f" id={chr(34)}{rid}{chr(34)}" if rid else ""}>') for rid, k, h, f in rects)
    return f"""<div class="inv-panel" id="{a_}" data-inv-panel="{a_}" hidden>
    <div class="est">
      <div class="est-head"><span class="eyebrow">0{i+1}</span><h2>{t}</h2>
        <p class="lead">{porque}</p></div>
      <div class="est-row"><span class="est-k">A quiénes</span><p>{quien}</p></div>
      <div class="est-row"><span class="est-k">Condiciones</span><div class="est-rects">{rs}</div></div>
      <div class="est-row"><span class="est-k">Qué logras</span><p>{logras}</p></div>
      <div class="est-cta">{cta}</div>
    </div>
  </div>"""
paneles_inv = '\n\n  '.join(_panel(i, *x) for i, x in enumerate(ESTRATEGIAS_IGR))

PASOS_HI = [
    ('Compras una propiedad con tu crédito hipotecario', 'Usas tu capacidad de crédito para comprar una propiedad que requiere financiamiento. No necesitas poner capital.'),
    ('La familia la arrienda por mínimo 2 años', 'Sigue viviendo en su casa con un contrato de arriendo de mínimo 2 años.'),
    ('Despreocúpate: no pagas tus dividendos', 'Mientras dura la operación, los dividendos de tu crédito no salen de tu bolsillo.'),
    ('Recompra de la propiedad', 'Al cierre, la propiedad se recompra: la recompra la familia o la hacemos nosotros.'),
]
PASOS_IC = [
    ('Vendes tu propiedad', 'Se ofrece a un precio que permita una venta ágil.'),
    ('Liberas su capital', 'Si tiene una deuda hipotecaria, se salda con la venta.'),
    ('Lo inviertes en Pulso Inversor', 'El capital genera intereses fijos cada mes y te da un flujo de caja constante.'),
    ('Puedes optar a comprar otra propiedad con descuento', 'Si quieres seguir en el mercado inmobiliario, puedes comprar otra propiedad con descuento.', True),
]
PASOS_AC = [
    ('Nos cuentas qué tienes', 'Revisamos tus bienes, ingresos y ahorros.'),
    ('Definimos tus objetivos', 'Plazos, flujo esperado y necesidades tributarias, sucesorias o familiares.'),
    ('Diseñamos tu configuración', 'Combinamos opciones de inversión, financiamiento y estructura legal.'),
    ('La simulamos contigo', 'Un asesor te muestra los números y cómo crecería tu patrimonio.'),
]
PERFILES = [
    ('Tengo capital disponible y quiero una renta periódica', 'Renta de Capital · Pagaré', 'Desde $5MM', '#estrategia-pagare'),
    ('Busco que mi inversión tenga respaldo hipotecario', 'Renta de Capital · Hipoteca', 'Desde $25MM · Hipoteca a tu favor', '#estrategia-hipoteca'),
    ('Quiero el mayor resguardo: una propiedad a mi nombre', 'Renta de Capital · Título', 'Desde $100MM · Título de propiedad', '#estrategia-titulo'),
    ('Tengo capacidad de crédito, pero no capital para invertir', 'Producción de Capital', 'Propiedades desde 2.000 UF', '#produccion-de-capital'),
    ('Tengo bienes, ingresos o ahorros y quiero una estrategia para todo mi patrimonio', 'Arquitectura de Capital', 'Diseño a medida', '#arquitectura-de-capital'),
]
perfiles = ''.join(f"""<a class="perfil" href="{h}"><span class="perfil-q">“{q}”</span><span class="perfil-arrow" aria-hidden="true">→</span><span class="perfil-a"><small>Te recomendamos</small><strong>{r}</strong><em>{m}</em></span></a>""" for q, r, m, h in PERFILES)

page('inversiones.html', 'Inversiones',
     'Las tres estrategias de la Matriz IGR: Renta de Capital, Producción de Capital y Arquitectura de Capital.',
     hero('Cómo invertir / Inversiones', 'Encuentra la estrategia que va contigo',
          'Tres estrategias complementarias para rentabilizar, producir y diseñar tu patrimonio. Toca la tuya para ver el detalle.', 'Matriz IGR') + f"""
<section class="section tipos-sec" data-inv><div class="container">
  <div class="tipos">{tipos}</div>

  {paneles_inv}
  {P("Condiciones de Renta de Capital según la Tabla de condiciones del 2026-11-18. La tabla original marcaba 'Sí*' en retiros de Pagaré y '$100.000.000**' en Título: CONFIRMAR qué dicen esas notas.")}
</div></section>

<section class="section section-soft" id="comparar"><div class="container">
  <div class="title center"><span class="eyebrow">Tabla comparativa</span><h2>Compáralas lado a lado</h2></div>
  <div class="table-wrap compare"><table>
    <thead><tr><th>Estrategia</th><th>Desde</th><th>Qué queda a tu favor</th><th>Interés o retorno</th><th>Plazos</th></tr></thead>
    <tbody>
      <tr><td>Renta de Capital · Pagaré</td><td>$5 millones</td><td>Contrato de mutuo y pagaré</td><td>1,0% a 1,2% mensual</td><td>12, 18 o 24 meses</td></tr>
      <tr><td>Renta de Capital · Hipoteca</td><td>$25 millones</td><td>Hipoteca inscrita a tu favor</td><td>0,7% a 0,9% mensual + UF</td><td>15, 21 o 27 meses</td></tr>
      <tr><td>Renta de Capital · Título</td><td>$100 millones</td><td>La propiedad inscrita a tu nombre</td><td>0,8% a 1,0% mensual + UF</td><td>15, 21 o 27 meses</td></tr>
      <tr><td>Producción de Capital</td><td>Propiedades desde 2.000 UF, con tu crédito hipotecario</td><td>La propiedad a tu nombre durante la operación</td><td>5% + UF anual</td><td>2 a 5 años</td></tr>
      <tr><td>Arquitectura de Capital</td><td>Tus bienes, ingresos y/o ahorros</td><td>Según la estructura legal que diseñemos contigo</td><td>A medida</td><td>A medida</td></tr>
    </tbody></table></div>
</div></section>

<section class="section" id="para-ti"><div class="container">
  <div class="title center"><span class="eyebrow">Para orientarte</span><h2>¿Cuál es para ti?</h2>
    <p class="lead">Busca la frase que más se parezca a lo que estás pensando.</p></div>
  <div class="perfiles">{perfiles}</div>
</div></section>
""" + cta_final('¿Te ves en más de una?', 'Revisemos juntos <span class="accent">tu caso</span>',
                'Un asesor te ayuda a elegir la alternativa que calza con lo que quieres construir.', AGENDAR, 'Ayúdenme a encontrar mi alternativa'))

# ---------------- 2.3 Garantías y respaldo ----------------
_ICONS['pagare'] = '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3"/><path d="M9 10h6M9 13h4"/><path d="M8.5 18c1-1.4 1.8-1.4 2.4 0s1.4 1.4 2.4-.4"/>'
_ICONS['hipoteca'] = '<path d="M3.5 11L12 4.5l8.5 6.5"/><path d="M5.5 9.8V20h13V9.8"/><rect x="9.5" y="13" width="5" height="4" rx="1"/><path d="M10.5 13v-1.3a1.5 1.5 0 0 1 3 0V13"/>'
_ICONS['llave'] = '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8"/><path d="M16 7l2.5 2.5M14 9l1.5 1.5"/>'
GARANTIAS = [
    ('pagare', 'Pagaré', 'Un compromiso de pago exigible legalmente.', 'Respalda la obligación de pago y permite ejercer acciones de cobro si no se cumple lo acordado.'),
    ('hipoteca', 'Hipoteca', 'Una propiedad queda vinculada al cumplimiento de la deuda.', 'Te entrega un derecho real de garantía sobre un inmueble identificado e inscrito.'),
    ('llave', 'Título de propiedad', 'El inmueble queda legalmente a tu nombre.', 'Adquieres derechos de propietario sobre un bien raíz inscrito a tu nombre en el respectivo Conservador de Bienes Raíces.'),
    ('documento', 'Contrato de mutuo', 'Las condiciones financieras quedan establecidas por escrito.', 'Determina las obligaciones de las partes, el monto, los intereses y los plazos de devolución.'),
]
GAR_IMG = {'pagare': 'pagare', 'hipoteca': 'hipoteca', 'llave': 'titulo', 'documento': 'mutuo'}
_tabs = ''.join(f'<button type="button" class="gdeck-tab{" is-active" if i == 0 else ""}" data-go="{i}">{t}</button>' for i, (ic, t, tag, d) in enumerate(GARANTIAS))
garantias = ''.join(f"""<article class="gdeck-card{' is-active' if i == 0 else ''}" data-card="{i}" aria-hidden="{'false' if i == 0 else 'true'}">
        <div class="gdeck-bg" style="background-image:url(assets/img/garantias/{GAR_IMG[ic]}.svg)" aria-hidden="true"></div>
        <div class="gdeck-content">
          <span class="gdeck-num">0{i+1} <small>/ 0{len(GARANTIAS)}</small></span>
          {icon(ic)}
          <h3>{t}</h3>
          <p class="gdeck-tag">{tag}</p>
          <p class="gdeck-desc">{d}</p>
        </div>
      </article>""" for i, (ic, t, tag, d) in enumerate(GARANTIAS))

PROPIEDADES = [   # fotos entregadas por la usuaria el 2026-11-17 (sector entre paréntesis, solo en el texto alternativo)
    ('puerto-varas', 'Puerto Varas', 'Casa', 'La Laja'),
    ('tome', 'Tomé', 'Casa', 'Pingueral'),
    ('lo-barnechea', 'Lo Barnechea', 'Casa', 'Camino del Bollenar'),
    ('loncoche', 'Loncoche', 'Terreno', 'El Retiro'),
    ('osorno', 'Osorno', 'Casa', 'Las Quemas'),
    ('quinta-normal', 'Quinta Normal', 'Departamento', 'Patricio Lynch'),
    ('la-florida', 'La Florida', 'Departamento', 'Santa Amalia'),
]
def _prop(slug, c, tipo, sector):
    return f"""<article class="prop-card"><div class="prop-img" role="img" aria-label="{tipo} en {sector}, {c}" style="background-image:url(assets/img/portafolio/{slug}.jpg)"></div>
      <div class="prop-info"><span class="prop-city">{c}</span><span class="prop-type">{tipo}</span></div></article>"""
propiedades = ''.join(_prop(*x) for x in PROPIEDADES)

MECANISMOS = [   # texto entregado por la usuaria el 2026-11-18
    ('Obligaciones caucionadas mediante pagaré', 'El inversionista queda facultado para iniciar las acciones de cobro pertinentes, tanto en contra de los deudores directos como, de ser procedente, en contra de los fiadores y avalistas que se hubieren constituido como codeudores solidarios o que hubieren asumido formalmente dicha responsabilidad.'),
    ('Operaciones caucionadas con garantía hipotecaria', 'Las partes podrán acordar la enajenación voluntaria del bien raíz hipotecado con el objeto de extinguir íntegramente la obligación caucionada. En caso de que dicha alternativa no resulte viable, el acreedor conservará todas las acciones y los procedimientos judiciales conducentes a la realización forzada de la garantía para la satisfacción de su crédito.'),
    ('Operaciones sobre bienes raíces inscritos a nombre del inversionista', 'El inversionista conservará plenamente su dominio sobre el inmueble, quedando facultado para exigir el cumplimiento de las obligaciones de recompra estipuladas contractualmente, con estricta sujeción a los términos, modalidades y condiciones previstos en la respectiva convención.'),
]
mecanismos = ''.join(f'<article class="mec-card"><span class="mec-num">0{i+1}</span><h3>{t}</h3><p>{d}</p></article>' for i, (t, d) in enumerate(MECANISMOS))

page('garantias-y-documentos.html', 'Garantías y respaldo',
     'Qué protege tu inversión con Pulso: pagaré, hipoteca, título de propiedad y contrato de mutuo, el portafolio inmobiliario detrás de las operaciones y cómo funcionan los resguardos ante un incumplimiento.',
     f"""<section class="page-hero g-hero"><div class="container g-hero-grid">
  <div>
    <div class="breadcrumb"><a href="index.html">Inicio</a> / Cómo invertir / Garantías y respaldo</div>
    <span class="eyebrow dark">Garantías y respaldo legal</span>
    <h1>¿Qué protege tu inversión con Pulso Inversor?</h1>
    <p>Cada operación cuenta con una estructura legal definida para establecer tus derechos, las obligaciones de pago y los mecanismos de resguardo de tu capital. Estos varían según la solución de inversión.</p>
    <div class="gdeck-tabs" role="tablist" aria-label="Garantías">{_tabs}</div>
  </div>
  <div class="gdeck" data-gdeck>
    <div class="gdeck-stage">{garantias}</div>
    <div class="gdeck-bar" aria-hidden="true"><i></i></div>
  </div>
</div></section>

<section class="port-section port-light" id="portafolio">
  <div class="container port-intro">
    <span class="eyebrow">El respaldo detrás de nuestras operaciones</span>
    {P("CIFRA actualizada por la usuaria el 2026-11-18: $4.000 millones.")}
    {P("PRECISIÓN: no todas las propiedades del portafolio garantizan necesariamente todas las inversiones. Distinguir entre activos que garantizan obligaciones y propiedades disponibles para nuevas operaciones.")}
    <h2 class="port-title">Actualmente contamos con más de <span class="port-num">$<span data-count="4000" data-when-visible>4.000</span> millones</span> listos para estructurar tu garantía</h2>
  </div>
  {P("PROPIEDADES: fotos reales entregadas el 2026-11-17; se muestran solo comuna y tipo (sin valor comercial ni descuento). El Retiro, Loncoche es un terreno: CONFIRMAR el tipo.")}
  <div class="marquee" aria-label="Propiedades del portafolio">
    <div class="marquee-track">{propiedades}<div class="marquee-dup" aria-hidden="true">{propiedades}</div></div>
  </div>
</section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Mecanismos de respuesta</span><h2>¿Cómo funcionan tus resguardos ante un incumplimiento?</h2>
    <p class="lead">Las operaciones contemplan mecanismos de respuesta según la estructura contratada. Su objetivo es exigir el cumplimiento de las obligaciones y buscar la recuperación de los fondos.</p></div>
  <div class="mec-grid">{mecanismos}</div>
</div></section>
""" + cta_final('¿Te quedó alguna duda?', 'Pregúntanos lo que <span class="accent">necesites</span>',
                'Ninguna pregunta está de más cuando se trata de tus ahorros. Te respondemos de frente, antes de cualquier decisión.',
                'Resolver mis dudas', 'garantías y respaldo'))

# ---------------- 2.4 Simuladores ----------------
# Lógica en assets/js/simuladores.js. Rescate Inmobiliario replica www.pulsoinversor.cl (con comparación vs depósito a plazo);
# Hipoteca Inteligente replica simuladorpulsoinversor.netlify.app.
GATE = """  <div class="gate" id="sim-gate" aria-labelledby="gate-title">
    <span class="gate-lock" aria-hidden="true">🔒</span>
    <h3 id="gate-title">Completa tus datos para ver tu simulación</h3>
    <p class="gate-sub">Te los pedimos una sola vez y quedan listos para todos los simuladores.</p>
    <form class="gate-form" id="gate-form" novalidate>
      <label>Nombre y apellido<input id="gate-nombre" name="nombre" autocomplete="name" placeholder="Tu nombre" required></label>
      <label>Correo electrónico<input name="email" type="email" autocomplete="email" placeholder="nombre@correo.cl" required></label>
      <label>Teléfono / WhatsApp<span class="gate-tel"><span>+56</span><input name="telefono" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="9 1234 5678" required></span></label>
      <label class="check"><input type="checkbox" name="terminos" required><span>Acepto la <a href="privacidad.html" target="_blank">Política de privacidad</a>.</span></label>
      <label class="check"><input type="checkbox" name="contenido"><span>(Opcional) Acepto recibir información comercial y publicidad de Pulso Inversor por correo y WhatsApp.</span></label>
      <p class="gate-aut">Al completar tus datos personales, Pulso Inversor SpA podrá usarlos para contactarte y entregarte opciones de inversión, además de verificar el funcionamiento de la plataforma. Si quieres saber más sobre el uso y resguardo de tu información, revisa nuestra <a href="privacidad.html" target="_blank">Política de privacidad</a>.</p>
      <div class="hp" aria-hidden="true"><label>No completar<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <p class="gate-err" id="gate-err" role="alert"></p>
      <button class="btn btn-primary" type="submit">Ver mi simulación <span aria-hidden="true">→</span></button>
    </form>
  </div>
  """ + P("CASILLAS (revisión 17-11-2026): Política de privacidad obligatoria; publicidad OPCIONAL y sin marcar. Términos y condiciones pendientes de validación legal.") + """
"""

_PANELES_EQUIPO = f"""  <div class="sim-panel" id="sim-hipoteca" data-sim-panel="sim-hipoteca" hidden><div class="sim-panel-body">
    <div class="sim-head"><h2>Hipoteca Inteligente</h2><p class="muted">Arma tu configuración: el Portafolio Tracción genera el retorno y el Portafolio Patrimonio construye tu patrimonio.</p></div>
    <form class="hi-capform" id="hi-cap-form" novalidate>
      <div><strong>Tu capacidad financiera</strong><p>Indica cuánto crédito hipotecario podrías obtener por operación. Cada propiedad se valida por separado; los créditos no se suman.</p></div>
      <label class="hi-capfield"><span class="sr-only">Capacidad financiera por crédito</span><input id="hi-cap" inputmode="decimal" autocomplete="off" placeholder="Ej. 3.000"><span>UF</span></label>
      <button class="btn btn-primary" type="submit">Comenzar simulación</button>
      <p class="gate-err" id="hi-caperr" role="alert"></p>
    </form>
    <div class="hi" id="hi-body">
      <div class="hi-lockmsg"><strong>Ingresa tu capacidad financiera para ver la simulación</strong></div>
      <article class="hi-panel"><div class="hi-bar"></div><div class="hi-pad">
        <span class="hi-n">01</span><span class="hi-k">Portafolio Tracción</span><h3>Genera el retorno</h3>
        <p class="muted">Selecciona una propiedad y el plazo de la estrategia.</p>
        <label class="pro-label" for="hi-traction">Propiedad Tracción</label><select id="hi-traction" class="hi-select"></select>
        <div class="hi-rows" id="hi-tmetrics"></div>
        <div class="hi-ret"><small id="hi-retlabel">Retorno acumulado</small><strong id="hi-retval">—</strong><span>5% anual simple sobre el 80%</span></div>
        <div class="hi-years" id="hi-years"></div>
        <p class="hi-yearnote">Plazos referenciales, se determinan en el contrato</p>
        <p class="hi-foot">Este retorno financia los costos estimados del Portafolio Patrimonio. Capacidad declarada: <b id="hi-capdisplay">—</b> por crédito.</p>
      </div></article>
      <article class="hi-panel"><div class="hi-bar green"></div><div class="hi-pad">
        <span class="hi-n">02</span><span class="hi-k">Portafolio Patrimonio</span><h3>Elige hasta dos propiedades</h3>
        <p class="muted">Cada propiedad se valida contra tu capacidad financiera.</p>
        <div id="hi-table"></div>
        <p class="hi-note" id="hi-note">El flujo incorpora arriendo, dividendo y administración.</p>
      </div></article>
      <article class="hi-panel"><div class="hi-bar gold"></div><div class="hi-pad">
        <span class="hi-n">03</span><span class="hi-k">Resultado de la configuración</span><h3>Tu elección cambia el cierre</h3>
        <div id="hi-result"></div>
      </div></article>
    </div>
    <p class="pro-note">Esta simulación no constituye una cotización ni asegura rentabilidades futuras. La rentabilidad simulada es referencial a esta fecha y no compromete a Pulso Inversor SpA. La rentabilidad y las condiciones finales se fijan al momento de la firma del contrato respectivo. Simulación en UF. Considera una vacancia promedio de 1 mes por año; contribuciones estimadas en 0,08% anual de la tasación; mantención y reparaciones estimadas en 0,04% anual. En la recompra, la amortización acumulada se distribuye en partes iguales entre el inversionista y Pulso Inversor. Los valores definitivos dependen de cada propiedad y de la tabla bancaria aplicable.</p>
    {P("REVISIÓN 7 pedía retirar la regla de reparto 50/50 de la amortización en la recompra porque difiere de la presentación vigente. Se replicó tal cual el simulador actual a pedido de la usuaria: CONFIRMAR.")}
  </div></div>

  <div class="sim-panel" id="sim-patrimonial" data-sim-panel="sim-patrimonial" hidden><div class="sim-panel-body">
    <div class="sim-head"><h2>Simulador de Arquitectura de Capital</h2><p class="muted">Elige propiedades del catálogo (cada una ya trae su precio con descuento) y cuánto financia el banco, y mira cuánto aportas y cómo crece tu patrimonio.</p></div>
    <div class="pro sp">
      <div class="pro-form sp-form">
        <div class="sp-block" id="sp-s1">
          <span class="pro-label">1. Elige las propiedades</span>
          <div class="sp-list" id="sp-props"></div>
          <div class="sp-sum" id="sp-total"></div>
        </div>
        <div class="sp-block" id="sp-s2">
          <span class="pro-label">2. ¿Cuánto financia el banco?</span>
          <div class="pro-chips" id="sp-ltv"><button type="button" class="chip-opt" data-sp-ltv="70">70%</button><button type="button" class="chip-opt" data-sp-ltv="80">80%</button><button type="button" class="chip-opt" data-sp-ltv="90">90%</button></div>
          <p class="pro-help">Porcentaje de la tasación que financia el banco.</p>
          <details class="sp-more">
            <summary>Ajustar plazo, tasa y arriendo <small>(opcional)</small></summary>
            <span class="pro-label">Plazo del crédito</span>
            <div class="pro-chips" id="sp-plazo"><button type="button" class="chip-opt" data-sp-plazo="20">20 años</button><button type="button" class="chip-opt is-active" data-sp-plazo="25" aria-pressed="true">25 años</button><button type="button" class="chip-opt" data-sp-plazo="30">30 años</button></div>
            <label class="sp-in"><span class="pro-label">Tasa del crédito</span><span class="sp-unit"><input id="sp-tasa" inputmode="decimal" autocomplete="off" value="4,5"><span>% real anual</span></span></label>
            <label class="sp-in"><span class="pro-label">Arriendo mensual de todo el portafolio</span><span class="sp-unit"><input id="sp-renta" inputmode="decimal" autocomplete="off" placeholder="Ej. 60"><span>UF al mes</span></span></label>
          </details>
        </div>
      </div>
      <div class="pro-out sp-out" id="sp-out">
        <p class="pro-falta" id="sp-falta">Elige las propiedades y el financiamiento para ver tu resultado</p>
        <div class="sp-res" id="sp-fin"></div>
        <div class="sp-card">
          <h3>Mientras la deuda baja, el patrimonio crece</h3>
          <p class="sp-fine" id="sp-evo-sub">Sin plusvalía.</p>
          <div class="sp-evo" id="sp-evo"></div>
          <p class="sp-legend"><span class="sp-l-d"></span>Deuda <span class="sp-l-p"></span>Tu patrimonio</p>
        </div>
        <details class="sp-more sp-estr">
          <summary>¿Cómo se estructura?</summary>
          <p>Los socios (personas o sociedades) forman una sociedad patrimonial que compra y mantiene las propiedades, y el banco las financia. La empresa operativa puede respaldar la deuda, sujeto a autorización y análisis de riesgo. Pulso administra arriendo, cobranza, mantención y cobertura ante incumplimiento o vacancia (10% de administración y 5% de cobertura sobre el arriendo). Estructura sujeta a revisión jurídica, tributaria y bancaria.</p>
        </details>
        <div class="pro-actions"><button type="button" class="btn btn-primary btn-xl" id="sp-enviar" disabled>Enviar al correo <span aria-hidden="true">→</span></button></div>
        <p class="sim-status" id="sp-status" role="status"></p>
        <p class="pro-note">Esta simulación no constituye una cotización ni asegura rentabilidades futuras. Es referencial a esta fecha y no compromete a Pulso Inversor SpA. Propiedades publicadas en pulsopropiedades.cl, con su tasación y precio de venta al 18-11-2026. No incluye gastos, reservas ni evaluación de riesgo; el banco puede usar el menor valor entre el precio y la tasación. La evolución no refleja arriendos, dividendos pagados, costos ni impuestos.</p>
      </div>
    </div>
    {P("SIMULADOR DE ARQUITECTURA DE CAPITAL (antes Simulador Patrimonial). Catálogo: propiedades publicadas en pulsopropiedades.cl con tasación y precio de venta al 18-11-2026 (planilla de la usuaria). Financiamiento 70/80/90% sobre la tasación. Validaciones previas: Mariana (estructura y garantías societarias) y Felipe Rojas (rentas, costos, seguros y flujo).")}
  </div></div>
"""

def _sim_page(slug, titulo, desc, h1, lead, picks, paneles_extra, cierre, acceso=''):
  page(slug, titulo, desc,
f"""
<div data-simuladores>
<section class="section sim-top" id="sim-area"><div class="container">
  <div class="title center"><h1>{h1}</h1>
    <p class="lead">{lead}</p></div>
  <div class="sim-picks" role="tablist" aria-label="Simuladores">
{picks}
  </div>
  {acceso}

  <div class="sim-stage" id="sim-stage" hidden>
  {GATE}

<div class="sim-panel" id="sim-proyecta" data-sim-panel="sim-proyecta"><div class="sim-panel-body">
    <div class="sim-head"><span class="sim-ufr">UF + Rentabilidad</span><h2>Renta de Capital</h2><p class="muted">Tu capital se reajusta en UF y además gana la rentabilidad pactada. Elige la garantía, el monto y el plazo, y compara con lo que te daría un depósito a plazo.</p></div>
    <div class="pro">
      <div class="pro-form">
        <span class="pro-label">Garantía real</span>
        <div class="pro-series">
          <button type="button" data-serie="T"><span>Título<small>Desde $100MM · UF + 0,8% a 1,0% mensual</small></span></button>
          <button type="button" data-serie="H"><span>Hipoteca<small>Desde $25MM · UF + 0,7% a 0,9% mensual</small></span></button>
          <button type="button" data-serie="A"><span>Pagaré<small>Desde $5MM · 1,0% a 1,2% mensual</small></span></button>
        </div>
        <label class="pro-label" for="p-monto">Monto a invertir</label>
        <input id="p-monto" class="pro-monto" type="text" inputmode="numeric" autocomplete="off">
        <div class="pro-chips" id="p-quick"></div>
        <p class="pro-help" id="p-min"></p>
        <p class="pro-warn" id="p-warn" hidden>El monto está bajo el mínimo; se calcula con el mínimo de esta garantía.</p>
        <span class="pro-label">Plazo</span>
        <div class="pro-chips" id="p-plazos"></div>
        <div class="pro-retiro" id="p-retiro-wrap">
          <span class="pro-label">¿Quieres la opción de retiro anticipado?</span>
          <div class="pro-yesno" role="group" aria-label="Retiro anticipado"><button type="button" class="chip-opt" data-retiro="0">No</button><button type="button" class="chip-opt" data-retiro="1">Sí</button></div>
          <p class="pro-help">Si eliges Sí, puedes retirar antes del plazo, y la tasa mensual baja 0,1 punto (por ejemplo, de 1,0% a 0,9%).</p>
        </div>
      </div>
      <div class="pro-out">
        <p class="pro-falta" id="p-falta">Elige la garantía, el monto y el plazo para ver tu resultado</p>
        <div class="pro-cols">
          <div class="pro-result">
            <span class="pro-tag">Con Pulso Inversor</span>
            <div class="pro-total"><small>Total a recibir</small><strong id="r-total">—</strong></div>
            <div class="pro-gain"><small>Ganas</small><strong id="r-ganancia">—</strong></div>
            <ul class="pro-list">
              <li><span>Garantía</span><strong id="r-estrategia">—</strong></li>
              <li><span>Monto</span><strong id="r-monto">—</strong></li>
              <li><span>Plazo</span><strong id="r-plazo">—</strong></li>
              <li><span>Rentabilidad</span><strong id="r-tasa">—</strong></li>
            </ul>
          </div>
          <div class="pro-dap">
            <span class="pro-tag bank">En un depósito a plazo</span>
            <div class="pro-total"><small>Total a recibir</small><strong id="d-total">—</strong></div>
            <div class="pro-gain bank"><small>Ganas</small><strong id="d-dap">—</strong></div>
            <ul class="pro-list">
              <li><span>Monto</span><strong id="d-monto">—</strong></li>
              <li><span>Plazo</span><strong id="d-plazo">—</strong></li>
              <li><span>Tasa</span><strong><span id="d-tasa">—</span> anual</strong></li>
            </ul>
          </div>
        </div>
        <p class="pro-pref" id="p-pref" hidden>Sobre $250.000.000 puedes acceder a condiciones preferentes. Pregúntale a tu asesor.</p>
        <div class="pro-actions"><button type="button" class="btn btn-primary btn-xl" id="p-correo">Enviar a mi correo <span aria-hidden="true">→</span></button></div>
        <p class="sim-aut">Al completar tus datos personales, Pulso Inversor SpA podrá usarlos para contactarte y entregarte opciones de inversión, además de verificar el funcionamiento de la plataforma. Si quieres saber más sobre el uso y resguardo de tu información, revisa nuestra <a href="privacidad.html" target="_blank">Política de privacidad</a>.</p>
        <p class="sim-status" id="p-status" role="status"></p>
        <p class="pro-note">Esta simulación no constituye una cotización ni asegura rentabilidades futuras. La rentabilidad simulada es referencial a esta fecha y no compromete a Pulso Inversor SpA. La rentabilidad y las condiciones finales se fijan al momento de la firma del contrato respectivo. Depósito a plazo: a 365 días, renovado al vencimiento con interés compuesto; para plazos que no son años completos, el último período se calcula en proporción al tiempo. <span id="r-nota-uf">Hipoteca y Título se reajustan en UF (UF de hoy <span id="r-uf">—</span>, IPC estimado 4,5% anual).</span></p>
      </div>
    </div>
    {P("TASA del depósito a plazo a 365 días (DAP_ANUAL en assets/js/simuladores.js): 4,8% anual referencial; CONFIRMAR el valor vigente a usar.")}
  </div></div>

{paneles_extra}  </div>
</div></section>
</div>
<img id="sim-logo" class="pdf-logo" src="assets/img/logo-pulso-gmm.png" alt="" width="396" height="44">
""" + cierre,
       scripts='\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>\n<script src="assets/js/simuladores.js"></script>\n<script src="assets/js/sim-movil.js"></script>')


PICKS_PUBLICO = f'''    <button type="button" class="sim-pick" role="tab" data-sim-tab="sim-proyecta" aria-selected="false">
      <span class="sim-pick-ico">RC</span><strong>Renta de Capital</strong><span>Invierte tu capital con título, hipoteca o pagaré y compáralo con un depósito a plazo.</span><em>UF + Rentabilidad</em><span class="sim-pick-go">Abrir simulador <i aria-hidden="true">↓</i></span></button>
    <button type="button" class="sim-pick sim-pick-asist" role="tab" data-sim-tab="sim-asistido-pc" aria-selected="false">
      <span class="sim-pick-ico">PC</span><strong>Producción de Capital</strong><span>Tu capacidad de crédito genera retorno y patrimonio. La simulas junto a un asesor.</span><em>Simulación asistida</em><span class="sim-pick-go">Ver simulador <i aria-hidden="true">↓</i></span></button>
    <button type="button" class="sim-pick sim-pick-asist" role="tab" data-sim-tab="sim-asistido-ac" aria-selected="false">
      <span class="sim-pick-ico">AC</span><strong>Arquitectura de Capital</strong><span>Una estructura a la medida de tus bienes, ingresos y ahorros. La simulas junto a un asesor.</span><em>Simulación asistida</em><span class="sim-pick-go">Ver simulador <i aria-hidden="true">↓</i></span></button>'''
PICKS_EQUIPO = '''    <button type="button" class="sim-pick" role="tab" data-sim-tab="sim-proyecta" aria-selected="false">
      <span class="sim-pick-ico">RC</span><strong>Renta de Capital</strong><span>Invierte tu capital con título, hipoteca o pagaré y compáralo con un depósito a plazo.</span><em>UF + Rentabilidad</em><span class="sim-pick-go">Abrir simulador <i aria-hidden="true">↓</i></span></button>
    <button type="button" class="sim-pick" role="tab" data-sim-tab="sim-hipoteca" aria-selected="false">
      <span class="sim-pick-ico">PC</span><strong>Producción de Capital</strong><span>Hipoteca Inteligente: arma la configuración con la capacidad de crédito del cliente.</span><em>Desde 2.000 UF</em><span class="sim-pick-go">Abrir simulador <i aria-hidden="true">↓</i></span></button>
    <button type="button" class="sim-pick" role="tab" data-sim-tab="sim-patrimonial" aria-selected="false">
      <span class="sim-pick-ico">AC</span><strong>Arquitectura de Capital</strong><span>Portafolio de propiedades con descuento y financiamiento bancario, y cómo crece el patrimonio.</span><em>Simulación asistida</em><span class="sim-pick-go">Abrir simulador <i aria-hidden="true">↓</i></span></button>'''

def _asistido(id_, t, img, texto):
    return f"""<div class="sim-panel sim-asistido" id="{id_}" data-sim-panel="{id_}" data-asistido hidden><div class="sim-panel-body">
    <div class="sim-head"><span class="sim-ufr">Simulación asistida</span><h2>{t}</h2></div>
    <div class="asist">
      <img class="asist-img" src="assets/img/sim/{img}" alt="" width="1160" height="760" loading="lazy">
      <div class="asist-card">
        <span class="asist-lock" aria-hidden="true">🔒</span>
        <h3>Este simulador lo usas junto a un asesor</h3>
        <p>{texto}</p>
        <a class="btn btn-primary" href="{AGENDA_URL}" target="_blank" rel="noopener">Agendar hora con un asesor <span aria-hidden="true">→</span></a>
        <a class="asist-acceso" href="/panel/simuladores">¿Eres asesor de Pulso Inversor? Ingresa aquí</a>
      </div>
    </div>
  </div></div>
"""
PANELES_ASISTIDOS = (_asistido('sim-asistido-pc', 'Producción de Capital', 'asistido-produccion.jpg',
                               'Para ver tus números, agenda una hora con un asesor. Lo revisan juntos, con tu capacidad de crédito y tus objetivos.') +
                     _asistido('sim-asistido-ac', 'Arquitectura de Capital', 'asistido-arquitectura.jpg',
                               'Para ver tus números, agenda una hora con un asesor. Lo revisan juntos, con tus bienes, ingresos y ahorros.'))
ACCESO_ASESORES = '<p class="sim-acceso"><a href="/panel/simuladores">Acceso asesores <span aria-hidden="true">→</span></a></p>'

_sim_page('simuladores.html', 'Simuladores',
          'Simula tu inversión en Renta de Capital (Acción, Hipoteca o Título) y compárala con un depósito a plazo. Producción y Arquitectura de Capital se simulan junto a un asesor.',
          '¿Qué quieres simular?', 'Elige un simulador, completa tus datos una vez y revisa tus números con calma. Los resultados son referenciales.',
          PICKS_PUBLICO, PANELES_ASISTIDOS,
          cta_final('¿Prefieres ver los números con alguien?', 'Revisemos tu simulación <span class="accent">juntos</span>',
                    'Un asesor te acompaña a leer los resultados y a resolver tus dudas.', AGENDAR, 'mi simulación'),
          ACCESO_ASESORES)

# Simuladores asistidos: solo para el equipo. Se sirven en /panel/simuladores (con la clave del panel);
# el Worker bloquea el acceso directo a /simuladores-equipo.
_sim_page('simuladores-equipo.html', 'Simuladores asistidos', 'Uso interno del equipo de Pulso Inversor.',
          'Simuladores asistidos', 'Uso interno del equipo de Pulso Inversor. Simula junto al cliente; al enviar te pediremos sus datos para mandarle la simulación a su correo.',
          PICKS_EQUIPO, _PANELES_EQUIPO, '')
_fe = os.path.join(R, 'simuladores-equipo.html')
_he = open(_fe).read().replace('<head>\n', '<head>\n<meta name="robots" content="noindex">\n', 1).replace('<div data-simuladores>', '<div data-simuladores data-equipo>', 1)
_he = re.sub(r'((?:href|src)=")(?!https?:|/|#|mailto:|tel:|data:|javascript:)', r'\1/', _he)
open(_fe, 'w').write(_he)

# ---------------- Landing: Inversión Inmobiliaria Circular ----------------
page('inversion-circular.html', 'Inversión Inmobiliaria Circular',
     'Transforma el capital detenido en tu propiedad en una inversión con intereses fijos cada mes. Conoce cómo funciona y simula tu caso.',
     hero('<a href="inversiones.html">Inversiones</a> / Inversión Circular', 'Dale una nueva vida al capital de tu propiedad',
          'Transforma el capital detenido en tu propiedad en una inversión que te da flujo cada mes, y deja atrás las cargas que hoy te genera.', 'Inversión Inmobiliaria Circular') + f"""
<section class="section"><div class="container">
  <div class="inv-split">
    <div class="inv-side">
      <span class="eyebrow">Para propietarios</span><h2>Cómo funciona</h2>
      <p class="lead">Convierte una deuda hipotecaria que te ahoga en una inversión que te da flujo cada mes. Si tu propiedad te da más preocupaciones que ingresos, o el dividendo se lleva casi todo el arriendo, puedes liberar ese capital y hacerlo trabajar con intereses fijos cada mes.</p>
      <ul class="inv-facts">
        <li><span>Qué activas</span><strong>El capital que hoy está detenido en tu propiedad</strong></li>
        <li><span>Qué logras</span><strong>Flujo mensual, sin deuda, con intereses fijos y tu capacidad de crédito recuperada</strong></li>
        <li><span>A tu favor</span><strong>Una inversión en Pulso Inversor con intereses fijos mensuales</strong></li>
        <li><span>Plazo</span><strong>Según tu contrato</strong></li>
      </ul>
      <div class="actions"><a class="btn btn-primary" href="#simulador">Simular mi caso <span aria-hidden="true">↓</span></a></div>
    </div>
    {pasos(PASOS_IC)}
  </div>
</div></section>

<div data-simuladores>
<section class="section section-soft sim-solo" id="simulador"><div class="container">
  <div class="sim-stage" id="sim-stage">
  <div class="gate" id="sim-gate" aria-labelledby="gate-title">
    <span class="gate-lock" aria-hidden="true">🔒</span>
    <h3 id="gate-title">Completa tus datos para ver tu simulación</h3>
    <p class="gate-sub">Te los pedimos una sola vez y quedan listos para todos los simuladores.</p>
    <form class="gate-form" id="gate-form" novalidate>
      <label>Nombre y apellido<input id="gate-nombre" name="nombre" autocomplete="name" placeholder="Tu nombre" required></label>
      <label>Correo electrónico<input name="email" type="email" autocomplete="email" placeholder="nombre@correo.cl" required></label>
      <label>Teléfono / WhatsApp<span class="gate-tel"><span>+56</span><input name="telefono" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="9 1234 5678" required></span></label>
      <label class="check"><input type="checkbox" name="terminos" required><span>Acepto la <a href="privacidad.html" target="_blank">Política de privacidad</a>.</span></label>
      <label class="check"><input type="checkbox" name="contenido"><span>(Opcional) Acepto recibir información comercial y publicidad de Pulso Inversor por correo y WhatsApp.</span></label>
      <p class="gate-aut">Al completar tus datos personales, Pulso Inversor SpA podrá usarlos para contactarte y entregarte opciones de inversión, además de verificar el funcionamiento de la plataforma. Si quieres saber más sobre el uso y resguardo de tu información, revisa nuestra <a href="privacidad.html" target="_blank">Política de privacidad</a>.</p>
      <div class="hp" aria-hidden="true"><label>No completar<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <p class="gate-err" id="gate-err" role="alert"></p>
      <button class="btn btn-primary" type="submit">Ver mi simulación <span aria-hidden="true">→</span></button>
    </form>
  </div>
  {P("CASILLAS (revisión 17-11-2026): Política de privacidad obligatoria; publicidad OPCIONAL y sin marcar. Términos y condiciones pendientes de validación legal.")}
  <div class="sim-panel" id="sim-circular" data-sim-panel="sim-circular"><div class="sim-panel-body">
    <div class="sim-head"><h2>Simula tu Inversión Circular</h2><p class="muted">Compara conservar tu propiedad arrendada con venderla e invertir el capital en Pulso Inversor. Cifras en pesos.</p></div>
    <div class="ic">
      <form class="pro-form ic-form" id="ic-form" novalidate>
        <span class="pro-label">¿Tu propiedad tiene deuda?</span>
        <div class="pro-yesno"><button type="button" class="chip-opt" data-ic-debt="no">Sin deuda</button><button type="button" class="chip-opt" data-ic-debt="yes">Con deuda</button></div>
        <label class="pro-label" for="ic-value">¿Cuánto vale tu propiedad hoy?</label>
        <div class="money-in"><span>$</span><input id="ic-value" inputmode="numeric" autocomplete="off" placeholder="0"></div>
        <label class="pro-label" for="ic-rent">¿Cuánto recibes de arriendo al mes? <small>Si no está arrendada, déjalo vacío.</small></label>
        <div class="money-in"><span>$</span><input id="ic-rent" inputmode="numeric" autocomplete="off" placeholder="0"></div>
        <label class="pro-label" for="ic-oldpayment">¿Cuánto pagas de dividendo al mes?</label>
        <div class="money-in"><span>$</span><input id="ic-oldpayment" inputmode="numeric" autocomplete="off" placeholder="0"></div>
        <div id="ic-debtfields" class="ic-sub" hidden>
          <label class="pro-label" for="ic-debt">¿Cuánto debes hoy? <small>Saldo de prepago que informa tu banco.</small></label>
          <div class="money-in"><span>$</span><input id="ic-debt" inputmode="numeric" autocomplete="off" placeholder="Ej. 40.000.000"></div>
          <label class="pro-label" for="ic-oldmonths">¿Cuántas cuotas te quedan?</label>
          <input id="ic-oldmonths" type="number" inputmode="numeric" min="1" max="600" placeholder="Ej. 225">
        </div>
        <span class="pro-label">¿Cada cuánto quieres recibir tus intereses?</span>
        <div class="pro-chips"><button type="button" class="chip-opt" data-ic-freq="quarterly">Cada 3 meses · 1,2% mensual</button><button type="button" class="chip-opt" data-ic-freq="monthly">Cada mes · 1,0% mensual</button></div>
        <span class="pro-label">¿A cuántos años quieres proyectar?</span>
        <div class="pro-yesno"><button type="button" class="chip-opt" data-ic-years="5">5 años</button><button type="button" class="chip-opt" data-ic-years="10">10 años</button></div>
        <label class="check ic-purchase"><input type="checkbox" id="ic-purchase"><span>Quiero evaluar comprar una nueva propiedad con el capital <small>(opcional)</small></span></label>
        <div id="ic-purchasefields" class="ic-sub" hidden>
          <label class="pro-label" for="ic-newvalue">Valor de la nueva propiedad</label>
          <div class="money-in"><span>$</span><input id="ic-newvalue" inputmode="numeric" autocomplete="off" value="80.000.000"></div>
          <label class="pro-label" for="ic-newrent">Arriendo que podría generar</label>
          <div class="money-in"><span>$</span><input id="ic-newrent" inputmode="numeric" autocomplete="off" value="400.000"></div>
          <div class="ic-2"><label><span class="pro-label">Financiamiento (% tasación)</span><input id="ic-ltv" type="number" value="85" min="0" max="100" step="0.1"></label>
            <label><span class="pro-label">Plazo del crédito (años)</span><input id="ic-term" type="number" value="20" min="1" max="40"></label></div>
          <div class="ic-2"><label><span class="pro-label">Tasa del crédito (% anual UF)</span><input id="ic-rate" type="number" value="5" min="0" max="30" step="0.1"></label>
            <label><span class="pro-label">Gastos de compra (% del precio)</span><input id="ic-buycost" type="number" value="2" min="0" max="30" step="0.1"></label></div>
        </div>
      </form>
      <div class="ic-out" id="ic-results">
        <div class="sim-alert" id="ic-error" role="alert" hidden></div>
        <div class="sim-alert warn" id="ic-warning" role="status" hidden></div>
        <div class="ic-head"><h3>Más claridad para decidir</h3><span id="ic-period">Proyección a 5 años</span></div>
        <div class="ic-gain" id="ic-gain" hidden></div>
        <div class="ic-kpis">
          <div class="ic-kpi"><small>Capital neto de la venta</small><strong id="ic-k-net">—</strong><span>Venta menos prepago y gastos</span></div>
          <div class="ic-kpi hl"><small>Ingreso mensual equivalente con Pulso Inversor</small><strong id="ic-k-monthly">—</strong><span id="ic-k-monthly-sub">—</span></div>
          <div class="ic-kpi"><small>Flujo actual antes de costos</small><strong id="ic-k-flow">—</strong><span>Arriendo menos dividendo actual</span></div>
        </div>
        <p class="ic-summary" id="ic-summary"></p>
        <div class="ic-card"><h4 id="ic-bars-title">¿Con cuánto terminas?</h4><div class="cb" id="ic-bars"></div>
          <p class="cb-legend"><span class="cb-a"></span>Patrimonio o capital al término <span class="cb-b"></span>Ingresos recibidos en el período</p></div>
        <div class="ic-card"><div class="ic-head"><h4>La comparación que respalda tu decisión</h4><span>TIR anual efectiva</span></div>
          <div class="ic-tablewrap"><table class="ic-table"><thead><tr><th>Alternativa</th><th>5 años</th><th>10 años*</th></tr></thead><tbody id="ic-tir"></tbody></table></div>
          <p class="ic-note" id="ic-base"></p>
          <p class="ic-note">*Proyectar diez años exige continuidad de tasa, condiciones y cumplimiento de pagos. La nueva compra es opcional y se evalúa por separado.</p>
          <p class="ic-note">Esta simulación no constituye una cotización ni asegura rentabilidades futuras. La rentabilidad simulada es referencial a esta fecha y no compromete a Pulso Inversor SpA. La rentabilidad y las condiciones finales se fijan al momento de la firma del contrato respectivo.</p></div>
        <div class="pro-actions"><button type="button" class="btn btn-primary btn-xl" id="ic-correo">Enviar a mi correo <span aria-hidden="true">→</span></button></div>
        <p class="sim-aut">Al completar tus datos personales, Pulso Inversor SpA podrá usarlos para contactarte y entregarte opciones de inversión, además de verificar el funcionamiento de la plataforma. Si quieres saber más sobre el uso y resguardo de tu información, revisa nuestra <a href="privacidad.html" target="_blank">Política de privacidad</a>.</p>
        <p class="sim-status" id="ic-status" role="status"></p>
      </div>
    </div>
    {P("SUPUESTOS fijos (como el simulador de referencia): venta 15% bajo valor comercial, tasas Pulso 1,2% (pago trimestral) y 1,0% (mensual), inflación 3%, arriendo +3% anual, mantención $150.000/año, vacancia 42 días cada 3 años con 1 mes de garantía, reparaciones $1.200.000 cada 3 años. VALIDAR.")}
  </div></div>
  </div>
</div></section>
</div>
<img id="sim-logo" class="pdf-logo" src="assets/img/logo-pulso-gmm.png" alt="" width="396" height="44">
""" + cta_final('¿Prefieres verlo con alguien?', 'Revisemos tu propiedad <span class="accent">juntos</span>',
                'Un asesor te ayuda a ver si la Inversión Circular calza con tu caso, sin apuro y sin compromiso.', AGENDAR, 'Inversión Circular'),
     scripts='\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>\n<script src="assets/js/simuladores.js"></script>\n<script src="assets/js/sim-movil.js"></script>')

# ---------------- Política de privacidad ----------------
page('privacidad.html', 'Política de privacidad',
     'Qué datos personales recoge Pulso Inversor, para qué los usa y cómo ejercer tus derechos.',
     hero('Política de privacidad', 'Política de privacidad', 'Última actualización: 17 de noviembre de 2025', 'Tus datos') + f"""
{P("Texto basado en la Política de privacidad publicada en www.pulsoinversor.cl (16-11-2026), adaptada a los simuladores de este sitio. REVISAR con legal, en especial el punto 2 (contenido obligatorio para usar los simuladores).")}
<section class="section"><div class="container legal-text">
  <p>En Pulso Inversor, empresa de Grupo Matchmaking, cuidamos los datos personales que nos entregas a través de este sitio. Aquí te contamos qué datos recogemos, para qué los usamos y cómo puedes ejercer tus derechos, conforme a la Ley N° 19.628 sobre protección de la vida privada y sus modificaciones.</p>
  <h2>1. Qué datos recogemos</h2>
  <p>Cuando usas los simuladores o nos contactas, recogemos tu nombre, correo, teléfono o WhatsApp, los datos de tu simulación (estrategia, monto, plazo y resultado referencial) y, en Hipoteca Inteligente, la capacidad financiera que declares.</p>
  <h2>2. Para qué los usamos</h2>
  <ul><li>Responder tu solicitud: un asesor puede contactarte para revisar tu simulación y orientarte.</li>
    <li>Enviarte contenido e información sobre inversiones por correo y WhatsApp, si lo autorizaste. Puedes darte de baja cuando quieras.</li></ul>
  <p>No vendemos ni cedemos tus datos a terceros para fines comerciales propios de ellos.</p>
  <h2>3. Quién más trata tus datos</h2>
  <p>Usamos proveedores de servicios tecnológicos, como Brevo (correo y gestión de contactos) y Google (planillas). Ellos tratan tus datos solo por encargo nuestro y para los fines descritos aquí.</p>
  <h2>4. Cuánto tiempo los guardamos</h2>
  <p>Mientras mantengamos contacto contigo o hasta que nos pidas eliminarlos, salvo que la ley nos obligue a conservarlos por más tiempo.</p>
  <h2>5. Tus derechos</h2>
  <p>Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos, eliminarlos u oponerte a su uso, y retirar tu autorización para recibir contenido. Escríbenos a <a href="mailto:{EMAIL}">{EMAIL}</a> indicando tu nombre y lo que necesitas.</p>
  <h2>6. Cookies y medición</h2>
  <p>Este sitio usa el Píxel de Meta (Facebook e Instagram) para medir las visitas y la efectividad de nuestros anuncios, y para mostrar publicidad de Pulso Inversor a personas interesadas. El píxel usa cookies y datos de navegación; no le enviamos tu nombre, correo ni teléfono. Puedes bloquear estas cookies en la configuración de tu navegador y gestionar tus preferencias de anuncios en tu cuenta de Facebook o Instagram.</p>
  <h2>7. Contacto</h2>
  <p>Correo: <a href="mailto:{EMAIL}">{EMAIL}</a> · Teléfono: +56 2 3365 5239</p>
  <h2>8. Cambios a esta política</h2>
  <p>Si actualizamos esta política, publicaremos la nueva versión en esta página con su fecha.</p>
</div></section>
""")

# ---------------- 3.1 Nosotros ----------------
HITOS = [
    ('2016', 'Los orígenes', 'Bajo el origen empresarial de Partners &amp; Advisers y la gestión de Iván Barboza, nace el modelo Inversión Remate Seguro (IRS), que permitía a los inversionistas participar en oportunidades de remates judiciales con respaldo de activos inmobiliarios.'),
    ('2016 – 2023', 'Experiencia y especialización', 'Se consolida una profunda experiencia en evaluación comercial, análisis jurídico y gestión inmobiliaria. Con ella, el horizonte se amplía hacia el financiamiento privado.'),
    ('Fines de 2023', 'Nace Pulso Inversor SpA', 'Con la entrada en vigor de la Ley Fintech y la especialización de las actividades de Partners &amp; Advisers, se constituye oficialmente Pulso Inversor SpA y el modelo evoluciona hacia la Inversión con Garantía Real (IGR) y resguardo patrimonial.'),
    ('Hoy', 'Parte de Grupo Matchmaking', 'Ese desarrollo impulsó la creación de Grupo Matchmaking, el grupo de empresas del que Pulso Inversor hoy forma parte fundamental.'),
]
hitos = ''.join(f'<li><span class="hito-year">{y}</span><strong>{t}</strong><p>{d}</p></li>' for y, t, d in HITOS)
PILARES_N = [
    ('Transparencia y simplicidad', 'Un modelo directo que no complica al inversionista, con condiciones contractuales claras y resultados previamente pactados.'),
    ('Seguridad y respaldo', 'Toda operación está sustentada en garantías reales (activos inmobiliarios subyacentes) o instrumentos legales sólidos.'),
    ('Intereses atractivos', 'Búsqueda constante de intereses atractivos que superen a los instrumentos de ahorro convencionales.'),
    ('Inversión con sentido', 'Generamos valor más allá del dinero, con soluciones que ayudan a los propietarios frente a escenarios de pérdida patrimonial y abren nuevas oportunidades financieras.'),
]
ASESORES = [   # certificados por la CMF
    ('Pamela Herrera', 'Asesora de inversiones', 'assets/img/asesores/pamela.webp'),
    ('Renato Vargas', 'Asesor de inversiones', 'assets/img/equipo/renato-vargas.jpg'),
    ('Santiago Fernández', 'Asesor internacional', 'assets/img/equipo/santiago-fernandez.jpg'),
]
EQUIPO = [
    ('Jessica Valenzuela', 'Jefa comercial', 'assets/img/equipo/jessica-valenzuela.jpg'),
    ('Felipe Jaña', 'Jefe de operaciones', 'assets/img/equipo/felipe-jana.jpg'),
    ('William Rojas', 'Jefe de contabilidad', 'assets/img/equipo/william-rojas.jpg'),
]
def _crew(lista):
    return ''.join(f'''<li><img src="{foto}" alt="" width="240" height="240" loading="lazy"><span><strong>{n}</strong><small>{r}</small></span></li>''' for n, r, foto in lista)
crew_asesores = _crew(ASESORES)
crew = _crew(EQUIPO)
pilares_n = ''.join(f'<article class="pilar"><span class="pilar-num">0{i+1}</span><h3>{t}</h3><p>{d}</p></article>' for i, (t, d) in enumerate(PILARES_N))
_ICONS['onda'] = '<path d="M3 12h3l2-5 4 10 3-7 2 2h4"/>'
_ICONS['flecha-up'] = '<path d="M4 18l6-6 4 4 6-8"/><path d="M15 8h5v5"/>'
DIFERENCIAS = [
    ('onda', 'Descorrelación del mercado bursátil', 'Al centrarse en activos alternativos inmobiliarios, las inversiones no se ven afectadas por la volatilidad diaria de la bolsa, las fluctuaciones de acciones o los conflictos macroeconómicos.'),
    ('flecha-up', 'Intereses superiores a la banca tradicional', 'El modelo busca al menos duplicar los intereses de un depósito a plazo común y, en algunos casos, casi los triplica.'),
    ('escudo', 'Garantías tangibles', 'El capital se respalda con propiedades a nombre del inversionista, contratos de mutuo, hipotecas o pagarés, con un nivel de seguridad igual o superior al de las garantías estatales bancarias.'),
]
diferencias = ''.join(f'<article class="dif">{icon(ic)}<h3>{t}</h3><p>{d}</p></article>' for ic, t, d in DIFERENCIAS)

page('nosotros.html', 'Nosotros',
     'Desde 2016 estructuramos inversiones respaldadas por activos inmobiliarios. Conoce la historia, el enfoque, el equipo y los pilares de Pulso Inversor, parte de Grupo Matchmaking.',
     f"""<section class="page-hero nos-hero"><div class="container split">
  <div class="sticky-col"><div class="breadcrumb"><a href="index.html">Inicio</a> / Conócenos / Nosotros</div>
    <span class="eyebrow dark">Nuestra historia</span><h1>Una trayectoria que empezó en 2016</h1>
    <p>De los remates judiciales a la Inversión con Garantía Real, siempre con el mismo principio: garantías identificables, evaluables y jurídicamente constituidas.</p></div>
  <ol class="hitos hitos-dark" data-reveal>{hitos}</ol>
</div></section>
{P("TEXTOS de marca entregados por la usuaria el 2026-11-16. REVISIÓN LEGAL sugerida antes de publicar: 'nivel de seguridad igual o superior al de las garantías estatales bancarias', 'no se ven afectadas por… conflictos macroeconómicos', 'inversiones seguras', 'garantizando que cada operación sea… segura', 'retornos estables', 'completamente desconectada de la volatilidad bursátil'.")}

<section class="section section-dark enfoque" data-enfoque><div class="container">
  <span class="eyebrow dark">Nuestro enfoque</span>
  <p class="enfoque-quote" data-scrub>Facilitamos el acceso a activos alternativos inmobiliarios y deuda privada, conectando a quienes necesitan liquidez con inversionistas que buscan <span class="accent">diversificar, proteger y hacer crecer su patrimonio</span>.</p>
  <div class="enfoque-cols">
    <p>Con nuestro modelo de financiamiento privado, puedes adquirir una propiedad como inversión o financiar una operación inmobiliaria a cambio de intereses pactados, sin tener que comprar ni administrar la propiedad en este último caso. Al mismo tiempo, los propietarios pueden acceder a recursos para reorganizar sus finanzas de manera sostenible.</p>
    <p>Queremos ser un referente en este mercado con alternativas que buscan ofrecer retornos atractivos y condiciones claras desde el inicio, para que puedas revisar los plazos, el respaldo y la forma de pago de cada operación antes de decidir si se ajusta a tus objetivos.</p>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Nuestro equipo</span><h2>Las personas detrás de Pulso Inversor</h2></div>
  <div class="team">
    <article class="team-card"><div class="team-photo" style="background-image:url(assets/img/equipo/ivan-barboza.jpg)"></div><div class="team-body">
      <h3>Iván Barboza</h3><span class="team-role">Cofundador y experto inmobiliario</span>
      <p>Con más de una década desarrollando modelos de inversión alternativa, Iván es el arquitecto detrás de Pulso Inversor. En 2016, al alero de Partners &amp; Advisers, comenzó a estructurar operaciones respaldadas por activos inmobiliarios, buscando más transparencia, gestión profesional y solidez contractual para los inversionistas. Ese conocimiento le permitió evolucionar el modelo hacia la Inversión con Garantía Real (IGR). En 2023 lideró el nacimiento de Pulso Inversor SpA, con el propósito de acercar a las personas a inversiones con respaldo real, revisables antes de firmar.</p></div></article>
    <article class="team-card"><div class="team-photo" style="background-image:url(assets/img/equipo/felipe-rojas.jpg)"></div><div class="team-body">
      <h3>Felipe Rojas</h3><span class="team-role">Cofundador y estratega financiero</span>
      <p>Lleva 16 años liderando áreas de finanzas y control de gestión en compañías como LATAM, Iansa y Transbank. Esa visión corporativa, con rigor analítico, es la que aporta a la empresa. Su vínculo con el proyecto nació de la confianza en el modelo: comenzó como cliente, validando con su propio patrimonio los intereses y el respaldo de las operaciones. Hoy estructura financieramente los productos para que cada operación sea directa, transparente y competitiva.</p></div></article>
  </div>
  {P("EQUIPO y fotos entregados por la usuaria el 2026-11-17.")}
  <h3 class="team-sub">El equipo que te acompaña</h3>
  <div class="eq2">
    <div class="eq2-col eq2-cmf">
      <div class="eq2-h"><span class="eq2-badge">✓ Certificados por la CMF</span><strong>Asesores de inversión</strong></div>
      <ul>{crew_asesores}</ul>
    </div>
    <div class="eq2-col">
      <div class="eq2-h"><strong>Gestión y operaciones</strong></div>
      <ul>{crew}</ul>
    </div>
  </div>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title center"><span class="eyebrow">Nuestros pilares</span><h2>Lo que guía cada operación</h2></div>
  <div class="pilares" data-reveal>{pilares_n}</div>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Qué nos diferencia del mercado</span><h2>Una alternativa que se sostiene en activos reales</h2></div>
  <div class="difs">{diferencias}</div>
  <p class="disclaimer" style="text-align:center">Toda inversión tiene riesgos. Las condiciones de cada operación quedan establecidas en su contrato.</p>
</div></section>
""" + cta_final())

# ---------------- 3.2 Verifica ----------------
SENALES = [
    ('No te explican de dónde salen los intereses', 'En Pulso Inversor:', 'cada pago de intereses está ligado a una operación concreta y queda escrito en el contrato que revisas antes de firmar.'),
    ('No te dicen en qué está tu dinero', 'En Pulso Inversor:', 'te mostramos una operación real, con la propiedad, su tasación y su precio de compra.'),
    ('Te apuran para firmar', 'En Pulso Inversor:', 'no te pedimos decidir en la reunión. Te llevas los documentos y lo piensas con calma.'),
]
senales = ''.join(f'<article class="senal"><span class="senal-tag">Señal {i+1}</span><h3>{t}</h3><p><strong>{k}</strong> {d}</p></article>' for i, (t, k, d) in enumerate(SENALES))

# Ficha de EJEMPLO (Maitencillo), entregada por la usuaria el 2026-11-18: datos ilustrativos, no corresponden a una operación real.
FICHA = [
    (None, 'Inmueble', 'Casa · Maitencillo, Puchuncaví'),
    (1, 'Tasación comercial', '10.000 UF <small>Tasador independiente</small>'),
    (2, 'Inversión', '4.744,2 UF <small>47% de la tasación · cobertura de capital de 211%</small>'),
    (3, 'Qué queda a favor del inversionista', 'Título de propiedad <small>Inscrito en el Conservador de Bienes Raíces</small>'),
    (4, 'Plazo y pago', '15 meses · 0,5% mensual + UF <small>Al vencimiento: 5.100 UF (inversión + 355,8 UF de interés)</small>'),
]
ficha = ''.join(f'<div class="ficha-row">{f"<span class=ficha-mark>{n}</span>" if n else "<span></span>"}<span class="ficha-label">{l}</span><strong>{v}</strong></div>' for n, l, v in FICHA)
REVISAR = [
    'Que la tasación sea reciente y diga quién la hizo.',
    'La diferencia entre el precio de compra y el valor comercial.',
    'Qué documento queda a tu favor y dónde se inscribe.',
    'Cuándo te pagan y cuándo vuelve tu capital.',
]
revisar = ''.join(f'<li><span class="ficha-mark">{i+1}</span>{t}</li>' for i, t in enumerate(REVISAR))

IMPREVISTOS = [
    ('Si un pago se atrasa', 'Cada operación tiene definido qué se hace según su documento: acciones de cobro con el pagaré, venta voluntaria o ejecución de la hipoteca, o exigir la recompra cuando la propiedad está a tu nombre.'),
    ('Si necesitas tu dinero antes', 'Puedes retirar tu capital antes del plazo cuando inviertes con pagaré. En ese caso se aplican las condiciones de tu contrato de mutuo.'),
    ('Si surge un tema legal con el inmueble', 'Pulso Inversor se hace responsable de sanear cualquier gravamen sobre el inmueble y cualquier uso indebido de él, ejerciendo los derechos y las garantías de los inversionistas.'),
]
imprevistos = ''.join(f'<article class="riesgo"><div class="riesgo-q"><span class="riesgo-ico" aria-hidden="true">{i+1}</span><h3>{q}</h3></div><div class="riesgo-a"><span class="riesgo-k">Lo que hacemos</span><p>{a_}</p></div></article>' for i, (q, a_) in enumerate(IMPREVISTOS))

OFICINA_DIR = None   # PENDIENTE: dirección de la oficina (activa el mapa de Google)
RUT = None           # PENDIENTE: RUT de Pulso Inversor SpA
if OFICINA_DIR:
    _mapa = f'<iframe class="of-map" title="Mapa de la oficina de Pulso Inversor" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q={urllib.parse.quote(OFICINA_DIR)}&output=embed"></iframe>'
else:
    _mapa = '<div class="of-map of-foto" role="img" aria-label="Edificio de la oficina de Pulso Inversor" style="background-image:url(assets/img/oficina.jpg)"></div>'
_datos = [('Razón social', 'Pulso Inversor SpA')]
if RUT: _datos.append(('RUT', RUT))
if OFICINA_DIR: _datos.append(('Oficina', OFICINA_DIR + '. Puedes venir a conocernos.'))
_datos += [('WhatsApp', f'<a href="https://wa.me/{WHATSAPP}" target="_blank" rel="noopener">+56 9 8355 4676</a>'), ('Correo', f'<a href="mailto:{EMAIL}">{EMAIL}</a>'), ('Instagram', f'<a href="{INSTAGRAM}" target="_blank" rel="noopener">@pulsoinversorcl</a>'), ('Facebook', f'<a href="{FACEBOOK}" target="_blank" rel="noopener">pulsoinversor.cl</a>'), ('LinkedIn', f'<a href="{LINKEDIN}" target="_blank" rel="noopener">Pulso Inversor</a>'), ('Grupo', 'Una empresa de Grupo Matchmaking')]
datos = ''.join(f'<div class="of-row"><span>{k}</span><strong>{v}</strong></div>' for k, v in _datos)

page('verifica-a-pulso.html', 'Verifica a Pulso',
     'Por qué Pulso Inversor no está en la CMF, cómo reconocer una estafa, cómo revisar una operación, cómo enfrentamos los imprevistos y los datos de la empresa.',
     f"""<section class="page-hero v-hero"><div class="container">
  <div class="breadcrumb"><a href="index.html">Inicio</a> / Conócenos / Verifica a Pulso</div>
  <span class="eyebrow dark">Verifica a Pulso</span>
  <h1>¿Por qué no estamos en la CMF?</h1>
  <p class="v-answer">Pulso Inversor no requiere certificación CMF bajo esta estructura privada, contractual y personalizada. No opera como banco, corredora, administradora de fondos ni plataforma de financiamiento colectivo regulada.</p>
  <div class="somos2">
    <span class="somos2-k">Lo que sí somos</span>
    <p class="somos2-lead">Pulso Inversor es una compañía especializada en ingeniería financiera y estructuración de inversiones alternativas respaldadas por activos reales.</p>
    <p>Conectamos a inversionistas que buscan rentabilizar su capital con personas y empresas que requieren soluciones financieras, diseñando operaciones que integran rentabilidad, garantías y oportunidades de desarrollo patrimonial.</p>
  </div>
  <p>Tu respaldo está en los documentos que firmas. Por eso, aquí te damos lo necesario para revisarnos por tu cuenta.</p>
</div></section>

<section class="section section-soft estafa"><div class="container estafa-grid">
  <figure class="estafa-video">
    <video controls playsinline preload="none" poster="assets/media/ivan-es-una-estafa-portada.jpg"><source src="assets/media/ivan-es-una-estafa.mp4" type="video/mp4"></video>
    <figcaption><strong>«¿Esto es una estafa?»</strong> Iván Barboza responde</figcaption>
  </figure>
  <div>
    <span class="eyebrow">Para que tomes decisiones informadas, sin depender de nuestra palabra</span>
    <h2>Tres señales de una estafa. Mídenos con ellas.</h2>
    <div class="senales">{senales}</div>
  </div>
</div></section>

<section class="section" id="operacion-abierta"><div class="container">
  <div class="title center"><span class="eyebrow">Operación abierta</span><h2>Cómo revisar una operación</h2>
    <p class="lead">Cada operación tiene su ficha. Con este ejemplo ilustrativo te mostramos qué mirar en cada dato antes de invertir.</p></div>
  {P("FICHA DE EJEMPLO (Maitencillo, imagen del 2026-11-18). La usuaria autorizó mostrarla y pidió aclarar que los datos son de ejemplo.")}
  <div class="ficha-grid">
    <article class="ficha">
      <div class="ficha-img" style="background-image:url(assets/img/operacion/maitencillo-casa.jpg)"><span class="ficha-badge">Ejemplo ilustrativo</span></div>
      <div class="ficha-body"><span class="ficha-kicker">Ficha de ejemplo</span><h3>Casa en Maitencillo</h3>{ficha}
        <div class="ficha-bar" aria-label="La inversión equivale al 47% de la tasación"><i style="width:47%">Inversión 47%</i><span>Respaldo 53%</span></div>
        <figure class="ficha-tas"><img src="assets/img/operacion/maitencillo-tasacion.jpg" alt="Extracto de un informe de tasación de ejemplo: 10.000 UF" width="1448" height="590" loading="lazy"><figcaption>Extracto de un informe de tasación, como referencia</figcaption></figure>
        <p class="ficha-nota">Ejemplo ilustrativo para mostrarte cómo leer una ficha. Los datos no corresponden a una operación real.</p>
      </div>
    </article>
    <div class="ficha-guide">
      <span class="eyebrow">Cómo leer esta ficha</span>
      <h3>Lo que deberías revisar en cualquier operación</h3>
      <ol class="ficha-check">{revisar}</ol>
      <p class="muted">Pide los certificados al Conservador de Bienes Raíces que corresponda, compara la tasación con propiedades parecidas y lleva los documentos a tu abogado antes de firmar.</p>
    </div>
  </div>
</div></section>

<section class="section section-soft" id="imprevistos"><div class="container">
  <div class="title center"><span class="eyebrow">Ante los imprevistos</span><h2>Cómo enfrentamos los imprevistos</h2>
    <p class="lead">En toda inversión pueden surgir imprevistos. Lo importante es saber desde antes qué se hace en cada caso, y que quede por escrito.</p></div>
  {P("VALIDAR internamente que las medidas descritas coinciden con la práctica de cada operación.")}
  <div class="riesgos">{imprevistos}</div>
</div></section>

<section class="oficina"><div class="container of-grid">
  <div class="of-info">
    <span class="eyebrow dark">Conócenos en persona</span>
    <h2>Datos de la empresa, a la vista</h2>
    <p>Sin intermediarios ni nombres de fantasía. Estos son nuestros datos para que los compruebes, y la invitación a reunirnos.</p>
    {P("COMPLETAR RUT y dirección de la oficina en scripts/build.py (variables RUT y OFICINA_DIR). Con la dirección se activa el mapa de Google.")}
    <div class="of-data">{datos}</div>
    <a class="btn btn-primary btn-xl" href="{AGENDA_URL}" target="_blank" rel="noopener">Agendar una reunión <span aria-hidden="true">→</span></a>
  </div>
  {_mapa}
</div></section>
""")

# ---------------- 4 Recursos: componentes compartidos ----------------
_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
_CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'

def rx_hero(eyebrow, h1, texto, btn1, tema, btn2, href2, chips, card, agenda=None):
    ch = ''.join(f'<span>{_CHECK}{c}</span>' for c in chips)
    return f"""<section class="page-hero rx-hero"><div class="container rx-hero-grid">
  <div class="rx-hero-copy">
    <div class="breadcrumb"><a href="index.html">Inicio</a> / Recursos</div>
    <span class="rx-kicker">{eyebrow}</span>
    <h1>{h1}</h1>
    <p>{texto}</p>
    <div class="rx-hero-actions">
      <a class="btn btn-primary btn-xl" href="{agenda or mail(tema)}" target="_blank" rel="noopener">{btn1}</a>
      <a class="btn btn-secondary btn-xl" href="{href2}">{btn2}</a>
    </div>
    <div class="rx-chips">{ch}</div>
    <p class="rx-legal">Operaciones bajo contratos civiles, no reguladas por la CMF. Toda inversión tiene riesgos. Revisa los documentos con tu abogado antes de firmar.</p>
  </div>
  {card}
</div></section>"""

def rx_fit(id_, eyebrow, h2, p1, p2, visual, si, no):
    si_ = ''.join(f'<div class="rx-fit-row">{_CHECK}<span>{x}</span></div>' for x in si)
    no_ = ''.join(f'<div class="rx-fit-row">{_CROSS}<span>{x}</span></div>' for x in no)
    return f"""<section class="section rx-fit" id="{id_}"><div class="container">
  <div class="rx-fit-top">
    <div><span class="rx-kicker dark">{eyebrow}</span><h2>{h2}</h2><p class="lead">{p1}</p><p>{p2}</p></div>
    <div class="rx-visual" data-reveal>{visual}</div>
  </div>
  <div class="rx-fit-cols" data-reveal>
    <div class="rx-fit-card si"><h3>Esto es para ti si…</h3>{si_}</div>
    <div class="rx-fit-card no"><h3>Esto NO es para ti si…</h3>{no_}</div>
  </div>
</div></section>"""

def rx_proceso(eyebrow, h2, pasos, h3, despues):
    ps = ''.join(f'<div class="rx-step"><span class="rx-step-n">{i}</span><div><h3>{t}</h3><p>{d}</p></div></div>' for i, (t, d) in enumerate(pasos, 1))
    ds = ''.join(f'<div class="rx-after-card"><span class="rx-after-ico">{icon(ic)}</span><h4>{t}</h4><p>{d}</p></div>' for ic, t, d in despues)
    return f"""<section class="section section-soft rx-proc"><div class="container">
  <div class="rx-proc-grid">
    <div class="rx-proc-head"><span class="rx-kicker dark">{eyebrow}</span><h2>{h2}</h2>
      <p class="muted">Cinco pasos, siempre con una persona del equipo y sin apuro. Tú decides cuándo avanzar.</p></div>
    <div class="rx-steps" data-reveal>{ps}</div>
  </div>
  <h3 class="rx-after-title">{h3}</h3>
  <div class="rx-after" data-reveal>{ds}</div>
</div></section>"""

# ---------------- 4.1 Mi primera inversión ----------------
_preg = [('¿Qué respalda mi dinero?', 'Una propiedad concreta, con su tasación y su precio de compra.'),
         ('¿Qué queda a mi favor?', 'Un documento firmado ante notario que te permite cobrar.'),
         ('¿Cómo recupero mi dinero?', 'Un calendario de pagos por escrito, antes de firmar.')]
_card1 = '<aside class="rx-card" data-reveal><span class="rx-card-kicker">Antes de invertir, deberías poder responder esto</span>' + ''.join(
    f'<div class="rx-q"><span class="rx-q-n">{i}</span><div><strong>{q}</strong><p>{r}</p></div></div>' for i, (q, r) in enumerate(_preg, 1)) + \
    '<p class="rx-card-note">Si alguien te ofrece invertir y no te responde estas tres preguntas con documentos, no firmes. Tampoco con nosotros.</p></aside>'

page('mi-primera-inversion.html', 'Mi primera inversión',
     'Tu primera inversión fuera del banco: qué propiedad respalda tu dinero, qué documento queda a tu favor y cómo lo recuperas. Sin tecnicismos y sin apuro.',
     rx_hero('Tu primera inversión fuera del banco',
             'Invierte tus ahorros sabiendo qué hay detrás. <span class="accent">Míralo antes de firmar.</span>',
             'Si tienes desde $5 millones en el banco y nunca has invertido, te explicamos en simple qué propiedad respalda tu dinero, qué documento queda a tu favor y cómo lo recuperas. Sin tecnicismos ni apuro; si quieres, con tu abogado revisando todo.',
             'Quiero una conversación sin compromiso', 'Mi primera inversión', 'Primero quiero entender', '#para-ti',
             ['Desde $5 millones', 'Firma ante notario', 'Puedes venir con tu pareja o tu abogado', 'No te pedimos decidir en la reunión'], _card1,
             agenda=AGENDA_URL)  # en Mi primera inversión atiende Renato Vargas
     + rx_fit('para-ti', 'Antes de hablar de tasas, hablamos de ti',
              'En tu primera inversión, lo primero no es cuánto ganas. Es cuánto puedes mover sin quedarte sin colchón.',
              'Si inviertes el dinero que vas a necesitar, cualquier imprevisto te obliga a salir en mal momento. Y una primera mala experiencia se convierte en la razón para no volver a invertir nunca.',
              'Por eso la primera conversación es sobre ti: cuánto tienes, para qué es ese dinero y cuánto necesitas disponible si pasa algo. Si lo sensato es que inviertas menos, o que todavía no lo hagas, te lo vamos a decir.',
              '''<h3>Un ejemplo</h3><p class="muted">Tienes $10 millones ahorrados. Quizás lo sensato es mover 5 y dejar 5 de colchón.</p>
      <div class="rx-total"><span>Tus ahorros</span><strong>$10 MM</strong></div>
      <div class="rx-bar"><div class="rx-seg s1" style="--w:50%"><strong>$5 MM</strong><span>para invertir</span></div><div class="rx-seg s3" style="--w:50%"><strong>$5 MM</strong><span>tu colchón</span></div></div>
      <p class="rx-visual-note">Empiezas con el mínimo y creces a medida que ganas confianza. No tienes que poner todos tus ahorros.</p>''',
              ['Tienes al menos $5 millones que no vas a necesitar en el corto plazo.', 'Nunca has invertido fuera del banco, o lo hiciste sin entender bien.',
               'Quieres entender qué hay detrás de tu dinero antes de moverlo.', 'Estás dispuesto a conversar y revisar documentos con calma.'],
              ['Buscas hacerte rico rápido.', 'Ese ahorro es tu único fondo de emergencia.', 'Quieres que alguien decida por ti sin explicarte.'])
     + rx_proceso('Qué pasa después de que dejas tus datos', 'Así de simple, y sin sorpresas',
                  [('Te escribe un asesor con nombre y apellido', 'Por WhatsApp, en el horario que elijas, para coordinar una conversación. No es un robot vendiéndote algo.'),
                   ('Conversamos sobre ti, sin compromiso', 'Revisamos tu situación y te decimos con honestidad si esto es para ti hoy. Puedes venir con tu pareja, un socio o tu abogado.'),
                   ('Te mostramos una operación real y sus documentos', 'La propiedad, su tasación, el precio de compra, el documento que queda a tu favor y el calendario de pagos.'),
                   ('Te los llevas y los revisas con calma', 'Con quien quieras, el tiempo que necesites. Si algo no queda claro, no avanzas.'),
                   ('Si decides avanzar, firmamos ante notario', 'Solo cuando tú estés tranquilo con lo que firmas.')],
                  'Y después de firmar, no quedas solo',
                  [('reloj', 'Pagos en fecha', 'En tu cuenta, en las fechas pactadas en tu contrato.'),
                   ('grafico', 'Reportes simples', 'Cada trimestre sabes cómo va tu inversión.'),
                   ('manos', 'Tu asesor al teléfono', 'Una persona a quien llamar si tienes una duda.'),
                   ('brote', 'Al terminar, decides', 'Recuperas tu capital y te ayudamos a evaluar si reinviertes.')])
     + cta_final('Tu primer paso', 'Empieza por una <span class="accent">conversación</span>, no por una firma',
                 'Cuéntanos cuánto tienes y para qué es. Te decimos con honestidad si esto es para ti hoy.',
                 'Quiero una conversación sin compromiso', 'Mi primera inversión'))

# ---------------- 4.2 Experiencia ----------------
_rev = [('La propiedad', 'Dirección, rol y antecedentes de la propiedad vinculada a tu operación.'),
        ('Tasación y precio de compra', 'Para que veas el margen entre lo que se pagó y su valor comercial estimado.'),
        ('El documento a tu favor', 'Hipoteca inscrita en el Conservador o título de dominio a tu nombre.'),
        ('Calendario y devolución', 'Plazo, fechas de pago y cómo vuelve tu capital, por escrito.'),
        ('El peor escenario', 'Qué herramienta legal tienes si algo no se cumple, y qué riesgos se mantienen.')]
_card2 = '<aside class="rx-card rx-ficha" data-reveal><div class="rx-ficha-head"><span class="rx-card-kicker">Lo que revisas antes de firmar</span><span class="rx-tag">Ficha de la operación</span></div>' + ''.join(
    f'<div class="rx-check compact">{_CHECK}<div><strong>{t}</strong></div></div>' for t, d in _rev) + \
    '<p class="rx-card-note boxed">Si alguien te ofrece «respaldo inmobiliario» y no te entrega esto antes de firmar, no avances. Tampoco con nosotros.</p></aside>'

page('ya-tengo-experiencia.html', 'Ya tengo experiencia invirtiendo',
     'Operaciones desde $25 millones con una propiedad identificada y una hipoteca inscrita a tu favor o la propiedad a tu nombre. Revisa la ficha completa con tu abogado.',
     rx_hero('Para quien ya invirtió y quiere ver qué hay detrás',
             'Ya probaste fondos, acciones o crowdfunding. Esta vez, <span class="accent">mira la propiedad antes de firmar.</span>',
             'Operaciones desde $25 millones con una propiedad identificada y una hipoteca a tu favor o la propiedad a tu nombre. Te mostramos la ficha completa y la revisas con tu abogado.',
             'Quiero una conversación sin compromiso', 'Ya tengo experiencia invirtiendo', 'Ver cómo se estructura', 'verifica-a-pulso.html#operacion-abierta',
             ['Desde $25 millones', 'Hipoteca inscrita o propiedad a tu nombre'], _card2,
             agenda=AGENDA_URL)  # se cambia a la agenda de Pamela Herrera (AGENDA_POR_PAGINA)
     + rx_fit('tu-patrimonio', 'Antes de la operación, tu patrimonio',
              'Saber cuánto tienes no es lo mismo que saber cuánto puedes mover',
              'Tu empresa, tu salud y tu familia definen cuánto capital puede quedar comprometido 15, 21 o 27 meses. Quien invierte sin ese análisis puede terminar comprometiendo dinero que va a necesitar, o dejando sin trabajar dinero que podría estar rindiendo.',
              'Por eso la primera reunión es un diagnóstico uno a uno: qué tienes hoy (banco, propiedades, empresa); qué necesitas líquido y para qué; cuál es el horizonte real de ese dinero. Con eso definimos monto, línea y plazo. A veces el monto es menor de lo que el cliente imaginaba; si es así, se lo decimos.',
              '''<h3>Cómo se ordena tu patrimonio</h3><p class="muted">Ejemplo ilustrativo de cómo se ordena un patrimonio antes de invertir:</p>
      <div class="rx-bar three"><div class="rx-seg s2" style="--w:30%"><span>Liquidez que no se toca</span></div><div class="rx-seg s4" style="--w:39%"><span>Tus inversiones actuales</span></div><div class="rx-seg s3" style="--w:31%"><span>Operación con respaldo</span></div></div>
      <p class="rx-visual-note">Las proporciones son solo un ejemplo: las de tu caso salen del diagnóstico. Si quieres, el equipo legal, tributario y patrimonial de Grupo MatchMaking te ayuda a ordenar el resto.</p>''',
              ['Tienes $25 millones o más disponibles para invertir.', 'Ya invertiste en fondos, acciones, crowdfunding o propiedades.',
               'Quieres diversificar una parte de tu patrimonio.', 'Quieres revisar la propiedad y los documentos antes de firmar, con tu abogado o contador.'],
              ['Buscas duplicar tu capital rápido. Eso no existe, y si alguien te lo ofrece, aléjate.', 'Vas a necesitar ese dinero en los próximos 12 meses.',
               'Prefieres que te digan «confía en mí» en vez de mostrarte los papeles.'])
     + rx_proceso('Qué pasa después de que dejas tus datos', 'Un proceso a tu ritmo, sin presión para decidir',
                  [('Te escribe el asesor que corresponde a tu monto', 'Por WhatsApp, con su nombre, en el horario que elijas. Si quieres, te envía la ficha de una operación antes de conversar.'),
                   ('Diagnóstico patrimonial, uno a uno', '45 minutos para revisar tu situación y ver si esto tiene sentido para ti hoy. Puedes venir con tu socio, tu pareja o tu abogado.'),
                   ('Revisas una operación concreta', 'La propiedad, la tasación, el precio de compra, el documento a tu favor, el calendario y el peor escenario.'),
                   ('Te llevas los documentos', 'Para que tu abogado o tu contador los revisen el tiempo que necesiten.'),
                   ('Si decides avanzar, firmas ante notario', 'Y se inscribe la hipoteca a tu favor o la propiedad a tu nombre.')],
                  'Y durante la operación',
                  [('reloj', 'Pagos en fecha', 'En tu cuenta, en las fechas de tu contrato.'),
                   ('grafico', 'Reportes trimestrales', 'Sabes cómo va tu operación sin tener que preguntar.'),
                   ('manos', 'Una persona al teléfono', 'Tu asesor responde, no un bot.'),
                   ('brote', 'Al cierre, decides', 'Recuperas tu capital o evalúas una nueva operación.')])
     + cta_final('Con los papeles sobre la mesa', 'Revisa una <span class="accent">operación real</span> con tu abogado',
                 'Te mostramos la ficha completa, incluido el peor escenario. Tú decides si avanzas.',
                 'Quiero una conversación sin compromiso', 'Ya tengo experiencia invirtiendo'))

# ---------------- 4.3 FAQ ----------------
def qa(q, a):
    return f'<details><summary>{q}</summary><div class="details-body"><p>{a}</p></div></details>'
page('preguntas-frecuentes.html', 'Preguntas frecuentes',
     'Tus preguntas sobre invertir con Pulso Inversor: montos, documentos, pagos, simuladores, impuestos y CMF.',
     hero('Recursos / Preguntas frecuentes', 'Tus preguntas, respondidas',
          'Si la tuya no está aquí, pregúntanos. Ninguna duda es pequeña cuando se trata de tus ahorros.', 'Preguntas frecuentes') + f'''
<section class="section"><div class="container" style="max-width:860px">
  {qa('¿Necesito haber invertido antes?', 'No. Puedes partir por nuestra <a href="mi-primera-inversion.html">guía de primera inversión</a> y después conversar con el equipo sobre lo que buscas.')}
  {qa('¿Desde cuánto puedo invertir?', 'Depende de la alternativa. Revisa los montos y requisitos en la <a href="inversiones.html#comparar">tabla comparativa</a>.')}
  {qa('¿Puedo revisar los documentos con mi abogado?', 'Sí, y te lo recomendamos. Una revisión independiente te ayuda a entender tus derechos y las condiciones antes de firmar.')}
  {qa('¿Cuándo recibiré pagos y cómo sabré cómo va mi inversión?', 'Nuestro material comercial contempla reportes trimestrales sobre la compra, la venta y los resultados de los activos. Los pagos y su frecuencia quedan establecidos en el contrato de la modalidad que elijas.')}
  {P("COMPLETAR canal de entrega de reportes y calendario por alternativa.")}
  {P("AGREGAR cuando esté aprobada: '¿Puedo recuperar mi inversión antes del plazo?' (respuesta consistente con condiciones de salida, con enlace al detalle de cada alternativa).")}
  {P("AGREGAR cuando esté aprobada: '¿Qué costos debo considerar?' (costos del inversionista, momento de cobro, conceptos incluidos/excluidos por alternativa).")}
  {qa('¿Lo que muestra el simulador es lo que voy a recibir?', 'Es una estimación con los datos y supuestos que usaste. En <a href="simuladores.html">Simuladores</a>, la sección “Cómo leer tu simulación” te ayuda a interpretar el resultado.')}
  {qa('¿Cómo se pagan los impuestos?', 'Depende de la estructura y de tu situación personal. Te recomendamos revisarlo con tu asesor tributario.')}
  {qa('¿Dónde reviso la situación de Pulso Inversor ante la CMF?', 'En <a href="verifica-a-pulso.html">Verifica a Pulso</a> te explicamos nuestra situación y cómo consultarla por tu cuenta.')}
</div></section>
''' + cta('¿Tienes otra pregunta?', 'Escríbenos. Te responde una persona del equipo.', 'Hacer mi pregunta', None,
                                href=whatsapp('Hola, tengo una pregunta sobre Pulso Inversor')))
print('ok')
