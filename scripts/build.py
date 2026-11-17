import os, urllib.parse
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMAIL = 'contacto@pulsoinversor.cl'

# WhatsApp comercial. PENDIENTE: confirmar el número (hoy es el que aparecía en el sitio anterior).
# Si cambia, actualizarlo también en assets/js/main.js (WHATSAPP).
WHATSAPP = '56983554676'
AGENDAR = 'Agendar una reunión'

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
    items.append(f'<li class="nav-cta-item" hidden-desktop><a href="{mail()}" target="_blank" rel="noopener">{AGENDAR}</a></li>')
    return f'''<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="header">
  <div class="container nav">
    <a class="logo" href="index.html" aria-label="Pulso Inversor, ir al inicio"><img src="assets/img/logo-pulso-gmm.webp" alt="Pulso Inversor · Una empresa de Grupo Matchmaking" width="560" height="62"></a>
    <nav aria-label="Principal">
      <ul class="menu" id="menu">{''.join(items)}</ul>
    </nav>
    <div class="nav-actions"><a class="btn nav-cta" href="{mail()}" target="_blank" rel="noopener">{AGENDAR}</a></div>
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
    return _re.sub(r'<table>.*?</table>', una, html, flags=_re.S)

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
    html = _etiquetar_tablas(html)
    open(os.path.join(R, slug), 'w').write(html)

def hero(crumb, h1, p, eyebrow=None):
    eb = f'<span class="eyebrow dark">{eyebrow}</span>' if eyebrow else ''
    return f'''<section class="page-hero"><div class="container">
<div class="breadcrumb"><a href="index.html">Inicio</a> / {crumb}</div>{eb}
<h1>{h1}</h1><p>{p}</p></div></section>'''

def cta(h, p, label, subject):
    return f'''<section class="section"><div class="container"><div class="cta-band">
<div><h2>{h}</h2><p>{p}</p></div>
<a class="btn btn-primary" href="{mail(subject)}" target="_blank" rel="noopener">{label}</a></div></div></section>'''

def cta_final():
    return f'''<section class="cta-final">
  <div class="container">
    <span class="eyebrow dark">Tu siguiente paso</span>
    <h2>Cuéntanos qué quieres <span class="accent">construir</span></h2>
    <p>Una conversación para conocernos y ver por dónde partir. Sin apuro.</p>
    <a class="btn btn-primary btn-xl" href="{mail()}" target="_blank" rel="noopener">{AGENDAR} <span aria-hidden="true">→</span></a>
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
    ('Proyecta un Hogar', 'Haz crecer tu capital y ayuda a que una familia que enfrenta un remate tenga una nueva oportunidad.', 'proyecta-un-hogar'),
    ('Hipoteca Inteligente', 'Usa tu capacidad de crédito para empezar a construir tu patrimonio inmobiliario.', 'hipoteca-inteligente'),
    ('Configuración Patrimonial', 'Ordena lo que has construido pensando en tu familia y en lo que quieres dejar.', 'configuracion-patrimonial'),
    ('Inversión Inmobiliaria Circular', 'Dale una nueva vida al capital de tu propiedad, con menos preocupaciones de arriendo.', 'inversion-circular'),
]

# ---------------- 1. Inicio ----------------
_ICONS['calendario'] = '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2M14 17h2"/>'
_ICONS['doc-check'] = '<path d="M6 3h9l3 3v8"/><path d="M6 3v18h7"/><path d="M9 8h6M9 11h6M9 14h3"/><circle cx="17.5" cy="18" r="3.5"/><path d="M16 18l1 1 2-2"/>'

# Tres caminos: a primera vista, nombre y frase; al abrir, qué activas y qué logras.
CAMINOS = [
    ('proyecta-un-hogar', 'Proyecta un Hogar', 'Haz crecer tu capital y ayuda a que una familia que enfrenta un remate tenga una nueva oportunidad.',
     ('Capital disponible', 'Desde $5.000.000'),
     ('Renta periódica', 'Flujos mensuales o trimestrales con factibilidad de interés')),
    ('hipoteca-inteligente', 'Hipoteca Inteligente', 'Usa tu capacidad de crédito para empezar a construir tu patrimonio inmobiliario.',
     ('Capacidad financiera', 'Desde 2.000 UF de crédito hipotecario'),
     ('Capital y patrimonio', 'Tu capacidad bancaria genera retorno y activos')),
    ('inversion-circular', 'Inversión Inmobiliaria Circular', 'Dale una nueva vida al capital de tu propiedad, con menos preocupaciones de arriendo.',
     ('Tu propiedad', 'El capital que hoy está detenido en tu inmueble'),
     ('Un mejor flujo', 'Un flujo de dinero mejor que el que hoy te genera tu propiedad')),
]
_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
cards = ''.join(f'''<a class="camino{' is-open' if i == 0 else ''}" href="inversiones.html#{a}" data-camino>
  <div class="camino-bg camino-bg-{i+1}" aria-hidden="true"></div>
  <div class="camino-top"><span class="camino-num">0{i+1}</span><span class="camino-arrow">{_ARROW}</span></div>
  <div class="camino-bottom">
    <h3>{t}</h3>
    <div class="camino-detail"><div class="camino-inner">
      <p>{d}</p>
      <div class="camino-rows">
        <div class="camino-row"><span class="camino-label">Qué activas</span><strong>{act[0]}</strong><span>{act[1]}</span></div>
        <div class="camino-row"><span class="camino-label">Qué logras</span><strong>{log[0]}</strong><span>{log[1]}</span></div>
      </div>
    </div></div>
  </div>
</a>''' for i, (a, t, d, act, log) in enumerate(CAMINOS))

def bullets(items):
    return '<ul class="choice-list">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'

TESTIMONIOS = [
    ('Fadi Layous', 'Socio en Pitahouse', 'FL',
     ['Al principio partí con una inversión en Leaseback para conocer cómo funcionaba. Con el tiempo fui tomando más confianza en Pulso Inversor y me animé a seguir invirtiendo.',
      'No fue algo de un día para otro. Empecé con un monto y después fui aumentando lo que invertía, porque me fui sintiendo más cómodo con el modelo. Hoy veo que esa confianza se fue construyendo con la experiencia. Por eso he seguido participando en nuevas operaciones.']),
    ('Juan Manuel Silva', 'Inversionista', 'JS',
     ['Buscando otras opciones para invertir encontré Pulso Inversor. Me interesaban los activos alternativos, pero no conocía la estrategia Acción. Pregunté cómo funcionaba y fui aclarando mis dudas antes de invertir. Eso me dio confianza para empezar. Hasta ahora estoy contento con la experiencia; para mí es importante poder preguntar cuando hay algo que no entiendo.']),
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
    <span class="eyebrow dark">Inversión con Garantía Real</span>
    <h1>Tu próxima inversión <span class="accent">comienza con claridad</span></h1>
    <p>Explora alternativas vinculadas al mercado inmobiliario y encuentra un punto de partida para tus objetivos.</p>
    {P("El formulario abre WhatsApp con el nombre en el mensaje. CONFIRMAR número en assets/js/main.js (WHATSAPP) y en scripts/build.py (WHATSAPP).")}
    <form class="hero-form" data-agenda novalidate>
      <label for="agenda-nombre" class="sr-only">Tu nombre</label>
      <input id="agenda-nombre" name="nombre" type="text" autocomplete="given-name" placeholder="Escribe tu nombre" required>
      <button class="btn btn-primary" type="submit">Empecemos por ti <span aria-hidden="true">→</span></button>
    </form>
    <p class="hero-form-note">Se abrirá WhatsApp para agendar una reunión con un asesor. Sin apuro y sin compromiso.</p>
  </div>
  {P("CIFRAS retiradas a pedido de la usuaria (2026-11-16): cartera aprox. $1.100 millones; rentabilidades desde 0,8%.")}
  {P("ASESORES: 3 fotos y 3 espacios. Para sumar a alguien, reemplazar un <span class='avatar-slot'> por <img src='assets/img/asesores/nombre.webp' alt='Nombre'>.")}
  <div class="hero-team">
    <div class="avatars">
      <img src="assets/img/asesores/felipe.webp" alt="Felipe" width="240" height="240" loading="lazy">
      <img src="assets/img/asesores/gloria.webp" alt="Gloria" width="240" height="240" loading="lazy">
      <img src="assets/img/asesores/pamela.webp" alt="Pamela" width="240" height="240" loading="lazy">
      <span class="avatar-slot" aria-hidden="true"></span>
      <span class="avatar-slot" aria-hidden="true"></span>
      <span class="avatar-slot" aria-hidden="true"></span>
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
      {bullets(['Invierte desde $5 millones, sin necesidad de comprometer todos tus ahorros.',
                'Tu inversión está respaldada por un inmueble, no solo por una promesa de pago.',
                'Conoce cuánto podrías ganar y en qué plazo, antes de tomar una decisión.'])}
      <span class="btn btn-primary">Quiero conocer cómo funciona</span></a>
    <a class="card profile-card choice" href="ya-tengo-experiencia.html">
      <h3><span class="choice-tag no">No</span> ya he invertido</h3>
      <p>Ya conozco otras alternativas y busco oportunidades con retornos atractivos, respaldo y condiciones claras.</p>
      {bullets(['Operaciones desde $25 millones, con rentabilidades pactadas en UF.',
                'Respaldo inmobiliario identificable: conoce el inmueble, su tasación y la cobertura de la operación.',
                'Estructura contractual individual: revisa las garantías, los plazos y las condiciones de pago antes de invertir.'])}
      <span class="btn btn-dark">Quiero evaluar oportunidades</span></a>
  </div>
</div></section>

<section class="section section-soft" id="por-que-pulso"><div class="container">
  <div class="title center"><span class="eyebrow">¿Por qué invertir con Pulso?</span><h2>Conoce qué hay detrás de tu inversión</h2></div>
  <div class="why">
    <div class="why-compare">
      <div class="why-col why-other">
        <span class="why-kicker">Otras alternativas</span>
        <h3>Lo que ya conoces</h3>
        <p>Los depósitos a plazo suelen ofrecer retornos más conservadores.</p>
        <p>Los fondos están expuestos a variaciones de mercado.</p>
        <p>Comprar para arrendar exige una inversión mayor y gestión continua.</p>
      </div>
      <div class="why-col why-pulso">
        <span class="why-kicker">Con nosotros</span>
        <h3>Pulso Inversor</h3>
        <p>Rentabilidades pactadas en UF, con potencial de superar alternativas conservadoras.</p>
        <p>Retornos definidos contractualmente, sin depender directamente de la cotización diaria de un fondo.</p>
        <p>Participación en operaciones inmobiliarias sin comprar ni administrar una propiedad.</p>
      </div>
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
  <div class="actions" style="justify-content:center"><a class="btn btn-dark" href="como-funciona.html">Cómo funciona</a></div>
  <p class="disclaimer">Comparación general y referencial. Toda inversión, incluidas las nuestras, tiene riesgos.</p>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Formas de invertir</span><h2>Tres caminos, según lo que quieres construir</h2></div>
  <div class="caminos-acc">{cards}</div>
  <p class="center-note">¿Quieres ordenar todo tu patrimonio? <a href="inversiones.html#configuracion-patrimonial">Conoce Configuración Patrimonial</a></p>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title center"><span class="eyebrow">Personas reales, con nombre</span><h2>Lo que encontraron quienes ya invirtieron</h2>
    <p class="lead">Perfiles distintos, la misma experiencia: condiciones claras, documentos que se pueden revisar y lo acordado, cumplido.</p></div>
  <div class="reviews">
    <figure class="video-testimonio">
      <video controls playsinline preload="none" poster="assets/media/testimonio-gonzalo.jpg"><source src="assets/media/testimonio-gonzalo.mp4" type="video/mp4"></video>
      <figcaption><strong>Gonzalo</strong>, kinesiólogo. Tenía sus ahorros quietos en el banco y aquí cuenta cómo fue su primera inversión con Pulso.</figcaption>
    </figure>
    <div class="review-list">
      {''.join(testimonio(*t) for t in TESTIMONIOS)}
      {P("Espacio para un tercer testimonio o reseña de Google (texto, autor y cargo).")}
    </div>
  </div>
  {P("INCORPORAR enlace al perfil oficial de Pulso en Google: botón 'Ver opiniones en Google'.")}
  <p class="disclaimer" style="text-align:center">Las experiencias corresponden a casos particulares y no aseguran resultados futuros.</p>
</div></section>
''' + cta_final())

# ---------------- 2.1 Cómo funciona ----------------
PILARES = [
    ('escudo', 'Respaldo inmobiliario', 'Cada operación está vinculada a un inmueble identificado, con tasación y antecedentes verificables.',
     'Puedes evaluar el valor del inmueble frente al dinero que inviertes y conocer qué activo respalda la operación.'),
    ('documento', 'Estructura legal', 'La operación se formaliza mediante contratos y garantías, según el instrumento de inversión.',
     'Sabes quién tiene la obligación de pagarte, qué derechos te corresponden y qué mecanismos existen ante un incumplimiento.'),
    ('calendario', 'Retorno y plazo', 'La rentabilidad, el vencimiento y las condiciones de pago quedan establecidos por contrato.',
     'Puedes planificar tus próximos movimientos financieros, sabiendo cuánto tienes pactado recibir y cuándo corresponde cada pago.'),
]
pilares = ''.join(f'''<button class="flip" type="button" aria-pressed="false">
      <span class="flip-inner">
        <span class="flip-face flip-front">{icon(ic)}<span class="flip-num">0{i+1}</span><strong>{t}</strong><span class="flip-text">{d}</span><span class="flip-hint">¿Qué significa para ti? <span aria-hidden="true">↻</span></span></span>
        <span class="flip-face flip-back"><span class="flip-kicker">¿Qué significa para ti?</span><strong>{t}</strong><span class="flip-text">{b}</span></span>
      </span>
    </button>''' for i, (ic, t, d, b) in enumerate(PILARES))

PASOS_CAMINO = [
    ('Simula tu inversión', 'Explora nuestras soluciones y conoce una estimación de rentabilidad según el monto y plazo.',
     'Tus números, primero.', [('Exploras', 'Nuestras soluciones'), ('Defines', 'Monto y plazo'), ('Obtienes', 'Una estimación de rentabilidad')]),
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
    <p>Estructuramos inversiones privadas vinculadas a bienes raíces mediante el modelo IGR, Inversión con Garantía Real. Conectamos objetivos de inversión con soluciones de liquidez para propietarios, a través de una relación directa con cada inversionista.</p>
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
  <div class="title center"><span class="eyebrow dark">Tu experiencia con Pulso</span><h2>Así es tu camino con Pulso</h2>
    <p class="lead">Desde la primera evaluación hasta el cierre de tu inversión, conoces las condiciones de cada etapa.</p></div>
  <div class="r2" data-r2>
    <ol class="r2-list">{ruta_steps}</ol>
    <div class="r2-stage" aria-live="polite">
      <div class="r2-frame">{ruta_cards}</div>
      <p class="r2-caption">Toca cada etapa para ver qué pasa en ella.</p>
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
      <li>{_CROSS}<div><span>Prometer rentabilidad sin explicar la operación y sus riesgos.</span></div></li>
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
def product(anchor, num, title, text):
    return f'''<article class="card product-card" id="{anchor}"><div class="card-num">{num}</div><h3>{title}</h3><p>{text}</p>
<a class="btn btn-outline" href="{mail(title)}" target="_blank" rel="noopener">Quiero saber más</a></article>'''

page('inversiones.html', 'Inversiones',
     'Cuatro alternativas de inversión con respaldo inmobiliario. Mira para quién es cada una y compara sus condiciones con calma.',
     hero('Cómo invertir / Inversiones', 'Encuentra la alternativa que va contigo',
          'Cada una responde a un momento distinto. Mira para quién es y compara sus condiciones con calma.', 'Inversiones') + f'''
<section class="section"><div class="container"><div class="grid-2">
{product('proyecta-un-hogar', '01', 'Proyecta un Hogar', 'Para quienes quieren que su capital crezca y, a la vez, haga una diferencia. Junto a Plan de Salida, buscamos soluciones para que familias en riesgo de remate puedan seguir en su hogar.')}
{product('hipoteca-inteligente', '02', 'Hipoteca Inteligente', 'Para quienes tienen capacidad de crédito hipotecario y quieren usarla para construir patrimonio y generar retorno. Contempla comprar una propiedad con financiamiento bancario, sujeto a la evaluación y aprobación del crédito.')}
{product('configuracion-patrimonial', '03', 'Configuración Patrimonial', 'Para quienes quieren ordenar lo que han construido y proyectarlo hacia adelante. Combinamos recursos, activos, financiamiento y estructuras jurídicas según lo que te importa: proteger, ganar eficiencia, dar continuidad o dejar un legado.')}
{product('inversion-circular', '04', 'Inversión Inmobiliaria Circular', 'Para propietarios que quieren transformar el capital de su inmueble en nuevas oportunidades y aliviar la gestión diaria de un arriendo. Evaluamos la venta, el capital neto se invierte en una alternativa de Pulso y, si quieres, exploramos otra propiedad según disponibilidad y tu capacidad de financiamiento.')}
</div></div></section>

<section class="section section-soft" id="comparar"><div class="container">
  <div class="title"><span class="eyebrow">Tabla comparativa</span><h2>Compáralas lado a lado</h2></div>
  <div class="table-wrap compare"><table>
    <thead><tr><th>Alternativa</th><th>Desde</th><th>Qué queda a tu favor</th><th>Plazos</th></tr></thead>
    <tbody>
      <tr><td>Proyecta un Hogar</td>
        <td>Capital disponible desde $5.000.000. {P("Mínimo confirmado por la usuaria el 2026-11-16 (portada). CONFIRMAR qué otras modalidades de Renta de Capital se ofrecen bajo este nombre: hipoteca $25 millones; título $100 millones.")}</td>
        <td>Documentación según la modalidad elegida. {P("CONFIRMAR si incluye pagaré/mutuo, hipoteca y título, o solo alguna.")}</td>
        <td>Según la modalidad elegida. {P("ASIGNAR: 12, 18 o 24 meses en pagaré; 15, 21 o 27 en hipoteca/título, si pertenecen a Proyecta un Hogar.")}</td></tr>
      <tr><td>Hipoteca Inteligente</td><td>Capacidad de crédito hipotecario desde 2.000 UF, sujeta a aprobación bancaria.</td>
        <td>La propiedad que compras con el crédito (con hipoteca a favor del banco) y las condiciones del contrato de la operación.</td><td>2 a 5 años, según la operación.</td></tr>
      <tr><td>Configuración Patrimonial</td><td>Lo que ya tienes: capital, financiamiento, activos y estructuras existentes.</td>
        <td>Una estructura y documentación diseñadas para tus objetivos patrimoniales.</td><td>Según el diseño que hagamos contigo.</td></tr>
      <tr><td>Inversión Inmobiliaria Circular</td><td>El capital neto que queda tras vender tu propiedad y resolver la deuda, si existe; sujeto al mínimo de la modalidad elegida.</td>
        <td>Los documentos de la venta y de la inversión posterior, según la estructura contratada. {P("COMPLETAR instrumentos específicos que se formalizan.")}</td>
        <td>Según la venta y el plazo contratado para la inversión posterior. {P("COMPLETAR plazo comercial aplicable.")}</td></tr>
    </tbody></table></div>
</div></section>

<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">En detalle</span><h2>Las condiciones de cada una</h2></div>
  <details><summary>Proyecta un Hogar</summary><div class="details-body">
    <p>El documento que te respalda y los pagos dependen de la modalidad contractual que elijas.</p>
    {P("COMPLETAR correspondencia con modalidades A/H/T, costos y requisitos. Precisar si 'retiros trimestrales' es pago de intereses, retiro de capital o ambos.")}
  </div></details>
  <details><summary>Hipoteca Inteligente</summary><div class="details-body">
    <p>Necesitas capacidad de financiamiento y la aprobación del banco. La compra contempla una deuda hipotecaria a tu nombre, y la operación detalla qué pagos le corresponden a cada parte y cómo se cierra.</p>
    <p>La proyección considera ingresos, dividendos, administración y otros costos de la configuración que elijas. El resultado depende de la propiedad, el financiamiento y la opción de cierre.</p>
    {P("COMPLETAR obligaciones contractuales de cada parte, costos de entrada y condiciones de recompra o conservación. No incorporar la promesa general de que Pulso paga todos los dividendos.")}
  </div></details>
  <details><summary>Configuración Patrimonial</summary><div class="details-body">
    <p>Según tu situación, puede incluir diseño societario, coordinación jurídica y financiera, administración y planificación de continuidad o legado.</p>
    {P("COMPLETAR alcance contratado, honorarios, entregables y condiciones del acompañamiento.")}
  </div></details>
  <details><summary>Inversión Inmobiliaria Circular</summary><div class="details-body">
    <p>La propuesta se adapta a tu punto de partida:</p>
    <ul><li><strong>Si tu propiedad tiene deuda:</strong> consideramos el prepago del crédito para calcular el capital neto disponible.</li>
      <li><strong>Si está pagada:</strong> evaluamos el capital disponible después de la venta y sus gastos.</li>
      <li><strong>Si quieres otra propiedad:</strong> podemos evaluar una compra adicional, según disponibilidad y aprobación bancaria.</li></ul>
    <p>Las condiciones de venta, inversión y eventuales retiros quedan en tu propuesta y en tu contrato.</p>
    {P("COMPLETAR costos de venta, prepago y gestión; política de retiros y plazos de aviso.")}
  </div></details>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Para orientarte</span><h2>¿Cuál es para ti?</h2>
    <p class="lead">Busca la frase que más se parezca a lo que estás viviendo hoy.</p></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Me identifico con…</th><th>Por dónde partir</th></tr></thead>
    <tbody>
      <tr><td>Tengo capital disponible y quiero que, además de crecer, haga una diferencia</td><td>Conoce <a href="#proyecta-un-hogar">Proyecta un Hogar</a> y las condiciones de participación que definamos para tu caso.</td></tr>
      <tr><td>Tengo capacidad de crédito y quiero construir patrimonio</td><td>Explora <a href="#hipoteca-inteligente">Hipoteca Inteligente</a>.</td></tr>
      <tr><td>Quiero ordenar lo que tengo pensando en mi familia y en el futuro</td><td>Conoce <a href="#configuracion-patrimonial">Configuración Patrimonial</a>.</td></tr>
      <tr><td>Tengo una propiedad y quiero activar su capital sin la carga diaria del arriendo</td><td>Explora <a href="#inversion-circular">Inversión Inmobiliaria Circular</a>, tenga deuda o esté pagada.</td></tr>
    </tbody></table></div>
</div></section>
''' + cta('¿Te ves en más de una?', 'Pasa más de lo que crees. Revisémoslo juntos.', 'Ayúdenme a elegir', 'Ayúdenme a encontrar mi alternativa'))

# ---------------- 2.3 Garantías y respaldo ----------------
_ICONS['pagare'] = '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3"/><path d="M9 10h6M9 13h4"/><path d="M8.5 18c1-1.4 1.8-1.4 2.4 0s1.4 1.4 2.4-.4"/>'
_ICONS['hipoteca'] = '<path d="M3.5 11L12 4.5l8.5 6.5"/><path d="M5.5 9.8V20h13V9.8"/><rect x="9.5" y="13" width="5" height="4" rx="1"/><path d="M10.5 13v-1.3a1.5 1.5 0 0 1 3 0V13"/>'
_ICONS['llave'] = '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8"/><path d="M16 7l2.5 2.5M14 9l1.5 1.5"/>'
GARANTIAS = [
    ('pagare', 'Pagaré', 'Un compromiso de pago exigible legalmente.', 'Respalda la obligación de pago y permite ejercer acciones de cobro si no se cumple lo acordado.'),
    ('hipoteca', 'Hipoteca', 'Una propiedad queda vinculada al cumplimiento de la deuda.', 'Te entrega un derecho real de garantía sobre un inmueble identificado e inscrito.'),
    ('llave', 'Título de propiedad', 'El inmueble queda legalmente a tu nombre.', 'Adquieres derechos de propietario sobre un bien raíz inscrito a tu nombre, según la operación.'),
    ('documento', 'Contrato de mutuo', 'Las condiciones financieras quedan establecidas por escrito.', 'Determina las obligaciones de las partes, el monto, los intereses y los plazos de devolución.'),
]
garantias = ''.join(f'''<article class="g-card">{icon(ic)}<h3>{t}</h3><p class="g-tag">{tag}</p><p>{d}</p></article>''' for ic, t, tag, d in GARANTIAS)
PROPIEDADES = [('Puerto Varas', 42), ('Las Condes', 44), ('Osorno', 39)]
propiedades = ''.join(f'''<article class="prop-card">
      <div class="prop-img prop-img-{i+1}" role="img" aria-label="Propiedad en {c}">{P(f"FOTO real de la propiedad en {c}. Reemplazar este bloque por <img src='assets/img/portafolio/....jpg' alt='Propiedad en {c}'>.")}</div>
      <div class="prop-info"><span class="prop-city">{c}</span><strong><span>{pct}%</span> bajo tasación*</strong></div>
    </article>''' for i, (c, pct) in enumerate(PROPIEDADES))
MECANISMOS = [
    ('Obligaciones respaldadas por pagaré', 'El inversionista puede iniciar acciones de cobro contra los obligados y, cuando corresponda, contra los avales que hayan asumido formalmente esa responsabilidad.'),
    ('Operaciones respaldadas por hipoteca', 'Se puede buscar una venta voluntaria del inmueble para pagar la deuda. Si no resulta viable, existen mecanismos judiciales para hacer efectiva la garantía.'),
    ('Operaciones con propiedad a nombre del inversionista', 'El inversionista conserva sus derechos sobre el inmueble y puede exigir las obligaciones de recompra asumidas contractualmente, de acuerdo con las condiciones de la operación.'),
]
mecanismos = ''.join(f'''<article class="mec-card"><span class="mec-num">0{i+1}</span><h3>{t}</h3><p>{d}</p></article>''' for i, (t, d) in enumerate(MECANISMOS))

page('garantias-y-documentos.html', 'Garantías y respaldo',
     'Qué protege tu inversión con Pulso: pagaré, hipoteca, título de propiedad y contrato de mutuo, los inmuebles detrás de las operaciones y cómo funcionan los resguardos ante un incumplimiento.',
     hero('Cómo invertir / Garantías y respaldo', 'Tu inversión cuenta con resguardos concretos',
          'Conoce los instrumentos legales, los activos y los mecanismos que resguardan tu capital.', 'Garantías y respaldo') + f'''
<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Garantías y respaldo legal</span><h2>¿Qué protege tu inversión con Pulso?</h2>
    <p class="lead">Cada operación cuenta con una estructura legal definida para establecer tus derechos, las obligaciones de pago y los mecanismos de resguardo de tu capital. Estos varían según la solución de inversión.</p></div>
  <div class="g-grid">{garantias}</div>
</div></section>

<section class="section section-soft" id="portafolio"><div class="container">
  <div class="port-head">
    <div><span class="eyebrow">El respaldo detrás de nuestras operaciones</span><h2>Detrás de cada operación hay activos que puedes conocer</h2>
      <p class="lead">Las garantías legales son una parte del resguardo. En las operaciones vinculadas a inmuebles, también importa conocer el valor de los activos, sus condiciones de adquisición y la cobertura que representan frente al capital invertido.</p>
      <p class="muted">Por eso, te mostramos las propiedades y los antecedentes inmobiliarios que forman parte de nuestro portafolio.</p></div>
    {P("CIFRA: la referencia decía 'Más de $1.300 millones' (pendiente de validar). Se usa la cifra que entregó la usuaria el 2026-11-16: aprox. $1.100 millones. CONFIRMAR valor vigente y qué activos incluye.")}
    {P("PRECISIÓN: no todas las propiedades del portafolio garantizan necesariamente todas las inversiones. Distinguir entre activos que garantizan obligaciones y propiedades disponibles para nuevas operaciones antes de presentar la cifra como respaldo.")}
    <div class="port-stat"><span>Cerca de</span><strong>$<span data-count="1100">1.100</span></strong><span>millones en portafolio inmobiliario</span></div>
  </div>
  {P("PORCENTAJES bajo tasación tomados del diseño de referencia: VALIDAR con cada operación. FOTOS: reemplazar por imágenes reales del portafolio.")}
  <div class="prop-row" tabindex="0" aria-label="Propiedades del portafolio">{propiedades}</div>
  <p class="disclaimer">*Diferencia entre el precio de compra y la tasación de cada inmueble. Cifras referenciales de operaciones específicas; no aseguran resultados futuros.</p>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Mecanismos de respuesta</span><h2>¿Cómo funcionan tus resguardos ante un incumplimiento?</h2>
    <p class="lead">Las operaciones contemplan mecanismos de respuesta según la estructura contratada. Su objetivo es exigir el cumplimiento de las obligaciones y buscar la recuperación de los fondos.</p></div>
  <div class="mec-grid">{mecanismos}</div>
  <p class="note mec-note">Los resguardos no eliminan el riesgo ni aseguran que la recuperación sea inmediata o total. Su efectividad depende de las condiciones legales, patrimoniales y comerciales de cada caso.</p>
</div></section>
''' + cta('Si algo no queda claro, pregúntanos', 'Te ayudamos a conseguir los antecedentes que necesitas para evaluar tranquilo.', AGENDAR, 'garantías y respaldo'))

# ---------------- 2.4 Simuladores ----------------
SOON = '<span class="pill soon">Próximamente</span>'
page('simuladores.html', 'Simuladores',
     'Explora los números de tu inversión con calma y sin compromiso.',
     hero('Cómo invertir / Simuladores', 'Mira tus números antes de decidir',
          'Elige una herramienta y explora con calma. Es para ti, sin compromiso.', 'Simuladores') + f'''
<section class="section"><div class="container"><div class="grid-3">

  <article class="card"><div class="card-num">01 · {SOON}</div><h3>Proyección de inversión de capital</h3>
    {P("CONFIRMAR nombre, alternativa asociada y enlace del simulador de capital.")}
    <p>Para ver cómo se relacionan tu capital, el plazo y el retorno estimado.</p>
    <details><summary>Cómo leer tu simulación</summary><div class="details-body"><ul>
      <li><strong>Capital:</strong> lo que aportas a la inversión.</li>
      <li><strong>Retorno estimado:</strong> el interés proyectado con las condiciones del cálculo. Fíjate si está en pesos o reajustado en UF.</li>
      <li><strong>Total y pagos:</strong> separa la devolución de tu capital del interés, y mira cuándo recibirías cada uno.</li></ul></div></details>
    {P("COMPLETAR campos reales, costos incluidos y modalidad de pagos del simulador definitivo.")}
    <a class="btn btn-outline" href="#" aria-disabled="true">Abrir simulador</a></article>

  <article class="card"><div class="card-num">02 · {SOON}</div><h3>Hipoteca Inteligente</h3>
    <p>Para ver cómo tu capacidad de financiamiento puede convertirse en retorno y patrimonio, con sus costos.</p>
    <p>Te pediremos tu nombre, teléfono, correo y la capacidad de crédito que declares. Después eliges propiedad, plazo y las opciones disponibles.</p>
    <details><summary>Cómo leer tu simulación</summary><div class="details-body"><ul>
      <li><strong>Capacidad financiera:</strong> es la referencia que declaras para evaluar cada propiedad. No equivale a la aprobación del banco.</li>
      <li><strong>Retorno proyectado:</strong> el resultado estimado de la propiedad elegida y el período del cálculo.</li>
      <li><strong>Flujo y costos:</strong> ingresos, dividendos, administración y gastos considerados. Si el flujo sale negativo, son recursos que tendrías que cubrir en ese escenario.</li>
      <li><strong>Patrimonio y cierre:</strong> separa el retorno disponible de la amortización de la deuda y compara conservar la propiedad o activar la recompra, cuando corresponda.</li></ul>
      <p style="margin-top:12px">En un ejemplo de recompra, el resultado al cierre suma el retorno disponible y la amortización. Son dos cosas distintas, y conviene leerlas según la configuración que elijas.</p></div></details>
    {P("ENLACE EN REVISIÓN: https://simuladorpulsoinversor.netlify.app/ — activar el botón (quitar aria-disabled y poner el href) cuando el simulador esté alineado con la presentación vigente y se retire la regla divergente de reparto de amortización.")}
    <a class="btn btn-outline" href="#" aria-disabled="true">Abrir simulador</a></article>

  <article class="card"><div class="card-num">03 · {SOON}</div><h3>Una nueva herramienta</h3>
    {P("COMPLETAR identidad de la tercera herramienta, alternativa asociada, enlace, datos requeridos y su desplegable 'Cómo leer tu simulación' (tres resultados principales, moneda, horizonte, costos y supuestos).")}
    <p>Estamos preparando una tercera herramienta para que explores otra de nuestras alternativas.</p>
    <a class="btn btn-outline" href="#" aria-disabled="true">Abrir simulador</a></article>

</div>
<p class="disclaimer">Los resultados son referenciales y dependen de los datos y supuestos que uses. Las condiciones reales de una operación están en su documentación, y una simulación no asegura rentabilidad.</p>
</div></section>
''' + cta('¿Prefieres ver los números con alguien?', 'Te acompañamos a leerlos y a resolver tus dudas.', AGENDAR, 'Consulta sobre simuladores'))

# ---------------- 3.1 Nosotros ----------------
page('nosotros.html', 'Nosotros',
     'Detrás de cada inversión hay personas. Conoce la historia, la forma de trabajar y el equipo de Pulso Inversor, parte de Grupo Matchmaking.',
     hero('Conócenos / Nosotros', 'Detrás de cada inversión hay personas',
          'Desde 2016 acompañamos a quienes quieren invertir en algo que pueden ver y entender.', 'Quiénes somos') + f'''
<section class="section"><div class="container split">
  <div><span class="eyebrow">Nuestra historia</span><h2>Una historia que empezó en 2016</h2>
    <p class="muted">Ese camino también dio origen a Grupo Matchmaking, el grupo de empresas del que hoy somos parte.</p></div>
  <ol class="timeline">
    <li><strong>2016 · Los comienzos</strong><span class="muted">Bajo el alero de Partners &amp; Advisers y con Iván Barboza a la cabeza, nace el modelo Inversión Remate Seguro (IRS), ligado a oportunidades en remates judiciales.</span></li>
    <li><strong>2016–2023 · Aprendiendo en cada operación</strong><span class="muted">Sumamos experiencia en evaluación comercial, análisis jurídico y gestión inmobiliaria, y se abrió el camino hacia el financiamiento privado.</span></li>
    <li><strong>2023 · Nace Pulso Inversor SpA</strong><span class="muted">A fines de ese año se constituye la empresa y el modelo da el paso a la Inversión con Garantía Real (IGR).</span></li>
  </ol>
</div></section>

<section class="section section-dark"><div class="container">
  <div class="title"><span class="eyebrow dark">Lo que hacemos</span><h2>Unimos dos necesidades que se encuentran</h2>
    <p class="lead">Hay personas que quieren diversificar y hacer crecer su patrimonio, y propietarios que necesitan liquidez para reorganizar sus finanzas. Nuestro trabajo es unirlas con inversiones alternativas vinculadas al mercado inmobiliario, buscando retornos atractivos y soluciones que les sirvan a ambos.</p></div>
  <div class="grid-4">
    <article class="card"><div class="card-num">01</div><h3>Transparencia y simplicidad</h3><p>Condiciones que se entienden y acuerdos por escrito desde el primer día.</p></article>
    <article class="card"><div class="card-num">02</div><h3>Seguridad y respaldo</h3><p>Tus derechos quedan definidos en garantías inmobiliarias o instrumentos contractuales, según la alternativa.</p></article>
    <article class="card"><div class="card-num">03</div><h3>Rentabilidad</h3><p>Buscamos retornos atractivos, siempre de acuerdo con el plazo y las condiciones de cada operación.</p></article>
    <article class="card"><div class="card-num">04</div><h3>Inversión con sentido</h3><p>Tu inversión también abre nuevas posibilidades para los propietarios y su patrimonio.</p></article>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">Nuestro equipo</span><h2>Las personas que te van a acompañar</h2></div>
  {P("INCORPORAR fotografías aprobadas de Iván y Felipe (reemplazar el círculo con iniciales por <img class='avatar'>) y nombres, cargos, fotos y biografías de los demás integrantes.")}
  <div class="grid-2">
    <article class="card person"><div class="avatar" aria-hidden="true">IB</div><div><h3>Iván Barboza</h3><div class="role">Cofundador y experto inmobiliario</div>
      <p>Conoce el mercado inmobiliario desde adentro y ha desarrollado modelos de inversión. Su foco está en evaluar bien cada oportunidad, gestionarla con profesionalismo y dejar todo respaldado por contrato.</p></div></article>
    <article class="card person"><div class="avatar" aria-hidden="true">FR</div><div><h3>Felipe Rojas</h3><div class="role">Cofundador y estratega financiero</div>
      <p>Lleva 16 años en finanzas y control de gestión, en compañías como LATAM, Iansa y Transbank. Aporta mirada corporativa y rigor al diseño financiero de nuestras alternativas. Llegó a Pulso como cliente e inversionista.</p></div></article>
  </div>
</div></section>
''' + cta(*CTA_GENERAL))

# ---------------- 3.2 Verifica ----------------
page('verifica-a-pulso.html', 'Verifica a Pulso',
     'Desconfiar antes de invertir es sano. Revisa nuestra situación ante la CMF, una operación real, los riesgos y cómo verificarnos por tu cuenta.',
     hero('Conócenos / Verifica a Pulso', 'Revísanos con toda libertad',
          'Desconfiar antes de invertir es sano. Aquí tienes lo necesario para comprobar quiénes somos y cómo trabajamos, por tu cuenta.', 'Verifica a Pulso') + f'''
<section class="section"><div class="container split">
  <div><span class="eyebrow">Situación regulatoria</span><h2>¿Por qué no estamos en la CMF?</h2></div>
  <div><p class="lead">Pulso Inversor no requiere certificación CMF bajo esta estructura privada, contractual y personalizada. No opera como banco, corredora, administradora de fondos ni plataforma de financiamiento colectivo regulada.</p></div>
</div></section>

<section class="section section-soft" id="operacion-abierta"><div class="container">
  <div class="title"><span class="eyebrow">Operación abierta</span><h2>Así se documenta una operación real</h2>
    <p class="lead">Te mostramos un caso de principio a fin: sus documentos y la información para seguir cada etapa.</p></div>
  {P("Caso candidato: Fundo Alhué, Curacaví (tasación 12.580 UF; inversión 3.034,6 UF según portafolio de octubre). CONFIRMAR autorización y estado. COMPLETAR partes, antecedentes reales anonimizados y seguimiento (hitos, fecha, pagos previstos y realizados) antes de publicar el detalle.")}
  <div class="grid-4">
    <article class="card">{icon('casa')}<h3>El caso</h3><p>La operación y el inmueble detrás de ella.</p></article>
    <article class="card">{icon('manos')}<h3>Las partes</h3><p>Quién invierte, quién recibe los recursos, quién debe pagar y quién figura como dueño o acreedor.</p></article>
    <article class="card">{icon('documento')}<h3>Los antecedentes</h3><p>Tasación, ficha, contratos e inscripciones.</p></article>
    <article class="card">{icon('grafico')}<h3>El seguimiento</h3><p>Hitos, pagos previstos y realizados, novedades y cómo va hoy.</p></article>
  </div>
  <div class="actions"><a class="btn btn-outline" href="#" aria-disabled="true">Ver documentos del caso</a><a class="btn btn-dark" href="{mail('la operación abierta')}" target="_blank" rel="noopener">Preguntar por esta operación</a></div>
  <p class="disclaimer">Las condiciones y resultados de este caso corresponden a una operación específica.</p>
</div></section>

<section class="section" id="riesgos"><div class="container">
  <div class="title"><span class="eyebrow">Riesgos y cómo se gestionan</span><h2>Hablemos también de los riesgos</h2>
    <p class="lead">Toda inversión los tiene. Preferimos que los conozcas ahora, junto con las medidas que existen para abordarlos.</p></div>
  {P("COMPLETAR la medida que se informa para cada situación: atrasos/insolvencia y cobro; valoración y escenarios de flujos; salida anticipada; revisión jurídica y prioridad de derechos; orientación sobre concentración.")}
  <div class="table-wrap"><table>
    <thead><tr><th>Situación</th><th>Lo que debes conocer</th></tr></thead>
    <tbody>
      <tr><td>Atrasos o dificultades de la contraparte</td><td>Cómo se evalúa, cómo te informamos y qué acciones de cobro aplican, incluido el efecto de una eventual insolvencia.</td></tr>
      <tr><td>Cambios en el valor del inmueble o en los flujos</td><td>Escenarios de ingresos y gastos, incluido qué pasa si los resultados son menores a lo previsto.</td></tr>
      <tr><td>Si necesitas tu dinero antes</td><td>Las condiciones y costos de salida que establece la documentación de tu alternativa.</td></tr>
      <tr><td>Situación jurídica del inmueble</td><td>Formalización ante notario e inscripción del título o la hipoteca, según la modalidad.</td></tr>
      <tr><td>Concentración de tu inversión</td><td>Cuánto de tu patrimonio quedaría en una empresa, propiedad o estrategia.</td></tr>
    </tbody></table></div>
  <p class="disclaimer">Las medidas de gestión ayudan a abordar los riesgos. Su alcance depende de cada operación y no elimina la posibilidad de pérdidas.</p>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Verificación independiente</span><h2>Compruébalo con fuentes que no dependen de nosotros</h2></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Qué revisar</th><th>Cómo hacerlo</th></tr></thead>
    <tbody>
      <tr><td>La empresa y sus canales</td><td>Contrasta razón social, RUT, domicilio y datos de contacto.</td></tr>
      <tr><td>La situación regulatoria</td><td>Busca la razón social en los registros y alertas oficiales de la CMF.</td></tr>
      <tr><td>La propiedad y sus documentos</td><td>Revisa los antecedentes en el Conservador que corresponda y pide la opinión de un abogado independiente.</td></tr>
      <tr><td>Las condiciones y el pago</td><td>Comprueba que los compromisos y quién recibe los fondos coincidan con la documentación.</td></tr>
    </tbody></table></div>
  <p class="note" style="margin-top:24px">Tómate tu tiempo. Si alguien te presiona para transferir, te promete ganancias sin riesgo o no te quiere entregar antecedentes, detente y pide explicaciones. Vale para cualquier inversión, también para la nuestra. Y que no aparezcan alertas no significa que exista una autorización.</p>
  <ul class="facts" style="margin-top:24px">
    <li><strong>Razón social:</strong> Pulso Inversor SpA</li>
    <li><strong>Correo:</strong> <a href="mailto:{EMAIL}">{EMAIL}</a></li>
  </ul>
  {P("COMPLETAR RUT, domicilio, teléfono y demás canales oficiales; identificar la contraparte contractual de cada modalidad si fuera otra entidad.")}
  {P("INCORPORAR enlaces oficiales directos a los registros y alertas de la CMF; por ahora se enlaza el sitio general.")}
  {P("INCORPORAR enlace al perfil oficial de Google: 'Lee las opiniones de nuestros clientes en Google'.")}
  <div class="actions"><a class="btn btn-outline" href="https://www.cmfchile.cl" target="_blank" rel="noopener">Consultar registros y alertas de la CMF</a></div>
</div></section>
''' + cta('Pregúntanos lo que necesites', 'Ninguna pregunta está de más antes de invertir. Te ayudamos a conseguir los antecedentes que te falten.', 'Tengo una duda', 'Quiero resolver una duda'))

# ---------------- 4.1 Mi primera inversión ----------------
page('mi-primera-inversion.html', 'Mi primera inversión',
     'Dar el primer paso da vértigo, y está bien. Preguntas y conceptos para preparar tu primera inversión con calma.',
     hero('Recursos / Mi primera inversión', 'Tu primera inversión, paso a paso',
          'Dar el primer paso da vértigo, y está bien. Partamos por algunas preguntas y conceptos que te van a ayudar.', 'Recursos') + f'''
<section class="section"><div class="container">
  <div class="title"><span class="eyebrow">Para prepararte</span><h2>Antes de empezar, pregúntate esto</h2></div>
  <div class="grid-3">
    <article class="card"><div class="card-num">01</div><h3>¿Qué quiero lograr con esta inversión?</h3></article>
    <article class="card"><div class="card-num">02</div><h3>¿Cuánto puedo destinar sin tocar lo que necesito para mis gastos e imprevistos?</h3></article>
    <article class="card"><div class="card-num">03</div><h3>¿Por cuánto tiempo puedo dejar ese dinero invertido?</h3></article>
  </div>
</div></section>
<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Palabras útiles</span><h2>Cinco conceptos que vas a escuchar</h2></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Concepto</th><th>Qué significa</th></tr></thead>
    <tbody>
      <tr><td>Capital</td><td>Lo que aportas a la inversión.</td></tr>
      <tr><td>Rentabilidad</td><td>Lo que gana tu capital. Fíjate siempre en el período y en los costos considerados.</td></tr>
      <tr><td>Plazo</td><td>El tiempo previsto para la inversión.</td></tr>
      <tr><td>Liquidez</td><td>Qué tan fácil es convertir tu inversión en dinero disponible.</td></tr>
      <tr><td>Respaldo</td><td>Los derechos y garantías que te da la estructura, con el alcance que indican sus documentos.</td></tr>
    </tbody></table></div>
</div></section>
<section class="section"><div class="container split">
  <div><span class="eyebrow">Tu primera conversación</span><h2>Lleva estas preguntas contigo</h2>
    <p class="muted">Ninguna está de más. Hazlas todas, a nosotros y a cualquiera con quien pienses invertir.</p>
    <div class="actions"><a class="btn btn-dark" href="como-funciona.html">Ver cómo trabajamos</a></div></div>
  <ul class="facts">
    <li>¿Quién recibe mi dinero y quién se compromete a pagarme?</li>
    <li>¿Qué documentos voy a recibir y qué derechos me dan?</li>
    <li>¿Qué costos tengo que considerar y qué pasa si necesito mi dinero antes?</li>
  </ul>
</div></section>
''' + cta('Cuéntanos qué quieres construir', 'Partimos por lo básico, sin apuro y sin tecnicismos.', AGENDAR, 'Mi primera inversión'))

# ---------------- 4.2 Experiencia ----------------
page('ya-tengo-experiencia.html', 'Ya tengo experiencia invirtiendo',
     'Criterios para evaluar cómo una alternativa con respaldo inmobiliario encaja en tu patrimonio.',
     hero('Recursos / Ya tengo experiencia invirtiendo', 'Evalúa con la mirada que ya tienes',
          'Ya sabes lo que es invertir. Estos criterios te ayudan a ver cómo encaja una alternativa en tu patrimonio.', 'Recursos') + f'''
<section class="section"><div class="container">
  <div class="table-wrap"><table>
    <thead><tr><th>Criterio</th><th>Qué revisar</th></tr></thead>
    <tbody>
      <tr><td>Base de comparación</td><td>Mismo horizonte y misma moneda. Distingue tasas mensuales de anuales.</td></tr>
      <tr><td>Resultado neto</td><td>Costos e impuestos, pagos durante el período y devolución del capital.</td></tr>
      <tr><td>Liquidez</td><td>Condiciones de salida y cuánto necesitas mantener disponible.</td></tr>
      <tr><td>Exposición</td><td>Cuánto de tu patrimonio quedaría en una empresa, inmueble o estrategia.</td></tr>
      <tr><td>Escenarios</td><td>Qué pasa si cambian los plazos, los costos, los ingresos o el valor de salida.</td></tr>
    </tbody></table></div>
</div></section>
<section class="section section-soft"><div class="container">
  <div class="title"><span class="eyebrow">Para profundizar</span><h2>Todo lo que necesitas para evaluar</h2></div>
  <div class="grid-3">
    <article class="card"><h3>Tabla comparativa</h3><p>Mínimos, respaldo y plazos de cada alternativa.</p><a class="link-arrow" href="inversiones.html#comparar">Ver la tabla</a></article>
    <article class="card"><h3>Garantías y respaldo</h3><p>Qué protege tu inversión y cómo funcionan sus resguardos.</p><a class="link-arrow" href="garantias-y-documentos.html">Ver garantías</a></article>
    <article class="card"><h3>Operación abierta</h3><p>Cómo se documenta una operación real.</p><a class="link-arrow" href="verifica-a-pulso.html#operacion-abierta">Ver la operación</a></article>
  </div>
</div></section>
''' + cta('Evalúa con todos los antecedentes', 'Te enviamos la información que necesitas para analizar una alternativa a fondo.', 'Pedir antecedentes', 'Solicitud de antecedentes para evaluar'))

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
  {qa('¿Dónde reviso la situación de Pulso ante la CMF?', 'En <a href="verifica-a-pulso.html">Verifica a Pulso</a> te explicamos nuestra situación y cómo consultarla por tu cuenta.')}
</div></section>
''' + cta('¿Tienes otra pregunta?', 'Escríbenos. Te responde una persona del equipo.', 'Hacer mi pregunta', 'Consulta al equipo'))
print('ok')
