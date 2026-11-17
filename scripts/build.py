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
      <span><a href="privacidad.html">Política de privacidad</a> · La información de este sitio es referencial y no constituye una oferta ni asegura rentabilidad.</span>
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

def page(slug, title, desc, body, scripts=''):
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
<script src="assets/js/main.js"></script>{scripts}
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

def cta_final(eyebrow='Tu siguiente paso', titulo='Cuéntanos qué quieres <span class="accent">construir</span>',
              texto='Una conversación para conocernos y ver por dónde partir. Sin apuro.', boton=None, tema=None):
    boton = boton or AGENDAR
    return f'''<section class="cta-final">
  <div class="container">
    <span class="eyebrow dark">{eyebrow}</span>
    <h2>{titulo}</h2>
    <p>{texto}</p>
    <a class="btn btn-primary btn-xl" href="{mail(tema)}" target="_blank" rel="noopener">{boton} <span aria-hidden="true">→</span></a>
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
    ('hipoteca-inteligente', 'Hipoteca Inteligente', 'Compra la casa de una familia antes de que la rematen y recibe el arriendo como retorno.',
     ('Capacidad financiera', 'Desde 2.000 UF de crédito hipotecario'),
     ('Capital y patrimonio', 'Tu capacidad bancaria genera retorno y activos')),
    ('inversion-circular', 'Inversión Inmobiliaria Circular', 'Convierte una deuda hipotecaria que te ahoga en una inversión que te da flujo cada mes.',
     ('Tu propiedad', 'El capital que hoy está detenido en tu inmueble'),
     ('Flujo mensual', 'Sin deuda, con rentabilidad fija cada mes y tu capacidad de crédito recuperada')),
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
_ICONS['hipoteca'] = '<path d="M3.5 11L12 4.5l8.5 6.5"/><path d="M5.5 9.8V20h13V9.8"/><rect x="9.5" y="13" width="5" height="4" rx="1"/><path d="M10.5 13v-1.3a1.5 1.5 0 0 1 3 0V13"/>'
_ICONS['llave'] = '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8"/><path d="M16 7l2.5 2.5M14 9l1.5 1.5"/>'
# Mecánica entregada por la usuaria el 2026-11-17. "Proyecta un Hogar" = estrategias de participación (Acción, Hipoteca, Título).
def pasos(lista):
    return '<ol class="pasos">' + ''.join(f'<li><span class="paso-n">{i+1}</span><div><strong>{t}</strong><p>{d}</p></div></li>' for i, (t, d) in enumerate(lista)) + '</ol>'

ESTRATEGIAS = [
    ('A', 'Acción', 'Acceso flexible con respaldo notarial.', 'Desde $5MM', 'Pagaré',
     'Para inversionistas que buscan menor ticket de entrada y una estructura documentada.'),
    ('H', 'Hipoteca', 'Inversión respaldada por garantía hipotecaria.', 'Desde $25MM', 'Hipoteca',
     'Para inversionistas que priorizan respaldo inmobiliario mediante hipoteca.'),
    ('T', 'Título', 'Máximo respaldo mediante título de propiedad.', 'Desde $100MM', 'Título',
     'Para inversionistas que buscan una estructura de mayor resguardo.'),
]
estrategias = ''.join(f"""<article class="aht" id="estrategia-{n.lower().replace('í','i').replace('ó','o')}">
      <span class="aht-letter" aria-hidden="true">{l}</span>
      <h3>{n}</h3>
      <p class="aht-tag">{tag}</p>
      <div class="aht-chips"><span>{mn}</span><span>{doc}</span></div>
      <p class="aht-desc">{d}</p>
      <div class="aht-btns"><a class="btn btn-primary" href="simuladores.html?serie={l}#sim-proyecta">Simular {n}</a><a class="btn btn-outline" href="{mail('Estrategia ' + n)}" target="_blank" rel="noopener">Solicitar asesoría experta</a></div>
    </article>""" for l, n, tag, mn, doc, d in ESTRATEGIAS)

TIPOS = [
    ('proyecta-un-hogar', 'Proyecta un Hogar', 'Invierte tu capital con respaldo y elige la estrategia que va contigo: Acción, Hipoteca o Título.', 'Desde $5MM'),
    ('hipoteca-inteligente', 'Hipoteca Inteligente', 'Usa tu capacidad de crédito para comprar una propiedad antes del remate y recibe el arriendo como retorno.', 'Desde 2.000 UF de crédito'),
    ('inversion-circular', 'Inversión Inmobiliaria Circular', 'Transforma el capital detenido en tu propiedad en una inversión que te da flujo cada mes.', 'Con tu propiedad'),
]
SIM_LINK = {'proyecta-un-hogar': 'simuladores.html#sim-proyecta', 'hipoteca-inteligente': 'simuladores.html#sim-hipoteca'}
def _tipo(i, a_, t, d, c):
    sim = f'<a class="btn btn-primary" href="{SIM_LINK[a_]}">Simular mi inversión</a>' if a_ in SIM_LINK else '<span class="tipo-soon">Simulador próximamente</span>'
    return f"""<article class="tipo"><span class="tipo-n">0{i+1}</span><h3>{t}</h3><p>{d}</p><span class="tipo-chip">{c}</span>
      <div class="tipo-actions">{sim}<a class="tipo-go" href="#{a_}">Ver cómo funciona <span aria-hidden="true">↓</span></a></div></article>"""
tipos = ''.join(_tipo(i, *x) for i, x in enumerate(TIPOS))

PASOS_HI = [
    ('Compras la propiedad antes del remate', 'Con tu capacidad de crédito o capital propio, evitas que una familia pierda su casa.'),
    ('La familia la arrienda de 2 a 5 años', 'Sigue viviendo ahí con un contrato de arriendo a plazo fijo.'),
    ('Recibes el arriendo cada mes', 'Ese pago es el retorno de tu inversión.'),
    ('Recompra o conservas la propiedad', 'Desde el segundo año la familia puede recomprarla con un recargo; si no, la propiedad sigue siendo tuya.'),
]
PASOS_IC = [
    ('Vendes tu propiedad', 'Se ofrece a un precio que permita una venta ágil.'),
    ('Liberas su capital', 'Si tiene una deuda hipotecaria, se salda con la venta.'),
    ('Lo inviertes en Pulso', 'El capital genera una rentabilidad fija mensual y te da un flujo de caja constante.'),
]
PERFILES = [
    ('Quiero empezar con un monto acotado', 'Acción', 'Desde $5MM · Pagaré', '#estrategia-accion'),
    ('Busco que mi inversión tenga respaldo inmobiliario', 'Hipoteca', 'Desde $25MM · Hipoteca a tu favor', '#estrategia-hipoteca'),
    ('Quiero el mayor resguardo: una propiedad a mi nombre', 'Título', 'Desde $100MM · Título de propiedad', '#estrategia-titulo'),
    ('Tengo capacidad de crédito y quiero construir patrimonio', 'Hipoteca Inteligente', 'Desde 2.000 UF de crédito', '#hipoteca-inteligente'),
    ('Tengo una propiedad y quiero que su capital trabaje', 'Inversión Circular', 'Flujo mensual con tu propiedad', '#inversion-circular'),
]
perfiles = ''.join(f"""<a class="perfil" href="{h}"><span class="perfil-q">“{q}”</span><span class="perfil-arrow" aria-hidden="true">→</span><span class="perfil-a"><small>Te recomendamos</small><strong>{r}</strong><em>{m}</em></span></a>""" for q, r, m, h in PERFILES)

page('inversiones.html', 'Inversiones',
     'Las tres formas de invertir con Pulso Inversor: Proyecta un Hogar (estrategias Acción, Hipoteca y Título), Hipoteca Inteligente e Inversión Inmobiliaria Circular.',
     hero('Cómo invertir / Inversiones', 'Encuentra la alternativa que va contigo',
          'Tres formas de invertir, cada una pensada para un momento distinto. Elige la tuya y conversemos.', 'Inversiones') + f"""
<section class="section tipos-sec"><div class="container">
  <div class="tipos">{tipos}</div>
</div></section>

<nav class="inv-nav" aria-label="Alternativas"><div class="container">
  <a href="#proyecta-un-hogar">Proyecta un Hogar</a><a href="#hipoteca-inteligente">Hipoteca Inteligente</a><a href="#inversion-circular">Inversión Circular</a><a href="#comparar">Comparar</a><a href="#para-ti">¿Cuál es para ti?</a>
</div></nav>

<section class="section section-soft inv-sec" id="proyecta-un-hogar"><div class="container">
  <div class="title center"><span class="eyebrow">01 · Para invertir tu capital</span><h2>Proyecta un Hogar</h2>
    <p class="lead">Pon tu capital a trabajar en operaciones que ayudan a familias que enfrentan un remate a mantener su hogar. Elige la estrategia que va contigo.</p></div>
  <div class="ahts">{estrategias}</div>
  {P("Montos y textos de las estrategias según la imagen entregada el 2026-11-17 (Título desde $100MM según la tabla de condiciones del 2026-11-17). Plazos por estrategia en la tabla: VALIDAR.")}
</div></section>

<section class="section inv-sec" id="hipoteca-inteligente"><div class="container inv-split">
  <div class="inv-side">
    <span class="eyebrow">02 · Para quien tiene capacidad de crédito</span><h2>Hipoteca Inteligente</h2>
    <p class="lead">Compra la casa de una familia antes de que el banco la remate y recibe el arriendo como retorno.</p>
    <ul class="inv-facts"><li><span>Desde</span><strong>2.000 UF de capacidad de crédito, o capital propio</strong></li><li><span>Plazo</span><strong>2 a 5 años</strong></li></ul>
    <div class="actions"><a class="btn btn-primary" href="simuladores.html#sim-hipoteca">Simular Hipoteca Inteligente</a></div>
  </div>
  {pasos(PASOS_HI)}
</div></section>

<section class="section section-soft inv-sec" id="inversion-circular"><div class="container inv-split">
  <div class="inv-side">
    <span class="eyebrow">03 · Para propietarios</span><h2>Inversión Inmobiliaria Circular</h2>
    <p class="lead">Transforma el capital detenido en tu propiedad en una inversión que te da flujo cada mes, y deja atrás las cargas que hoy te genera.</p>
  </div>
  {pasos(PASOS_IC)}
</div></section>

<section class="section" id="comparar"><div class="container">
  <div class="title center"><span class="eyebrow">Tabla comparativa</span><h2>Compáralas lado a lado</h2></div>
  <div class="table-wrap compare"><table>
    <thead><tr><th>Alternativa</th><th>Desde</th><th>Qué queda a tu favor</th><th>Plazos</th></tr></thead>
    <tbody>
      <tr><td>Proyecta un Hogar · Acción</td><td>$5 millones</td><td>Contrato de mutuo y pagaré</td><td>12, 18 o 24 meses</td></tr>
      <tr><td>Proyecta un Hogar · Hipoteca</td><td>$25 millones</td><td>Hipoteca inscrita a tu favor</td><td>15, 21 o 27 meses</td></tr>
      <tr><td>Proyecta un Hogar · Título</td><td>$100 millones</td><td>La propiedad inscrita a tu nombre</td><td>15, 21 o 27 meses</td></tr>
      <tr><td>Hipoteca Inteligente</td><td>2.000 UF de capacidad de crédito, o capital propio</td><td>La propiedad a tu nombre, arrendada con opción de recompra</td><td>2 a 5 años</td></tr>
      <tr><td>Inversión Inmobiliaria Circular</td><td>El capital de tu propiedad</td><td>Inversión en Pulso con rentabilidad fija mensual</td><td>Según tu contrato</td></tr>
    </tbody></table></div>
</div></section>

<section class="section section-soft" id="para-ti"><div class="container">
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
    ('llave', 'Título de propiedad', 'El inmueble queda legalmente a tu nombre.', 'Adquieres derechos de propietario sobre un bien raíz inscrito a tu nombre, según la operación.'),
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

PROPIEDADES = [
    ('puerto-varas', 'Puerto Varas', 'Casa', 42),
    ('las-condes', 'Las Condes', 'Departamento', 44),
    ('osorno', 'Osorno', 'Casa', 39),
    ('vina-del-mar', 'Viña del Mar', 'Departamento', None),
    ('providencia', 'Providencia', 'Departamento', None),
    ('chicureo', 'Chicureo', 'Casa', None),
]
def _prop(slug, c, tipo, pct):
    dato = f'<strong><span>{pct}%</span> bajo tasación*</strong>' if pct else '<strong class="prop-ej">Ejemplo</strong>'
    return f"""<article class="prop-card"><div class="prop-img" style="background-image:url(assets/img/portafolio/{slug}.svg)"></div>
      <div class="prop-info"><span><span class="prop-city">{c}</span><span class="prop-type">{tipo}</span></span>{dato}</div></article>"""
propiedades = ''.join(_prop(*x) for x in PROPIEDADES)

MECANISMOS = [
    ('Obligaciones respaldadas por pagaré', 'El inversionista puede iniciar acciones de cobro contra los obligados y, cuando corresponda, contra los avales que hayan asumido formalmente esa responsabilidad.'),
    ('Operaciones respaldadas por hipoteca', 'Se puede buscar una venta voluntaria del inmueble para pagar la deuda. Si no resulta viable, existen mecanismos judiciales para hacer efectiva la garantía.'),
    ('Operaciones con propiedad a nombre del inversionista', 'El inversionista conserva sus derechos sobre el inmueble y puede exigir las obligaciones de recompra asumidas contractualmente, de acuerdo con las condiciones de la operación.'),
]
mecanismos = ''.join(f'<article class="mec-card"><span class="mec-num">0{i+1}</span><h3>{t}</h3><p>{d}</p></article>' for i, (t, d) in enumerate(MECANISMOS))

page('garantias-y-documentos.html', 'Garantías y respaldo',
     'Qué protege tu inversión con Pulso: pagaré, hipoteca, título de propiedad y contrato de mutuo, el portafolio inmobiliario detrás de las operaciones y cómo funcionan los resguardos ante un incumplimiento.',
     f"""<section class="page-hero g-hero"><div class="container g-hero-grid">
  <div>
    <div class="breadcrumb"><a href="index.html">Inicio</a> / Cómo invertir / Garantías y respaldo</div>
    <span class="eyebrow dark">Garantías y respaldo legal</span>
    <h1>¿Qué protege tu inversión con Pulso?</h1>
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
    {P("CIFRA: la referencia decía 'Más de $1.300 millones' (pendiente de validar). Se usa la cifra que entregó la usuaria el 2026-11-16: aprox. $1.100 millones. CONFIRMAR valor vigente y qué activos incluye.")}
    {P("PRECISIÓN: no todas las propiedades del portafolio garantizan necesariamente todas las inversiones. Distinguir entre activos que garantizan obligaciones y propiedades disponibles para nuevas operaciones.")}
    <h2 class="port-title">Actualmente contamos con más de <span class="port-num">$<span data-count="1100" data-when-visible>1.100</span> millones</span> listos para estructurar tu garantía</h2>
  </div>
  {P("PROPIEDADES DE EJEMPLO con ilustraciones generadas (assets/img/portafolio/*.svg, se regeneran con scripts/ilustraciones.py). Reemplazar por fotos reales. Porcentajes bajo tasación (Puerto Varas 42%, Las Condes 44%, Osorno 39%) tomados del diseño de referencia: VALIDAR.")}
  <div class="marquee" aria-label="Propiedades del portafolio (ejemplos)">
    <div class="marquee-track">{propiedades}<div class="marquee-dup" aria-hidden="true">{propiedades}</div></div>
  </div>
  <div class="container"><p class="port-note">Imágenes ilustrativas. *Diferencia entre el precio de compra y la tasación de cada inmueble; cifras de operaciones específicas que no aseguran resultados futuros.</p></div>
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
# Lógica en assets/js/simuladores.js. Proyecta un Hogar replica www.pulsoinversor.cl (con comparación vs depósito a plazo);
# Hipoteca Inteligente replica simuladorpulsoinversor.netlify.app.
page('simuladores.html', 'Simuladores',
     'Simula tu inversión en Proyecta un Hogar (Acción, Hipoteca o Título) y compárala con un depósito a plazo, o arma tu configuración de Hipoteca Inteligente.',
     hero('Cómo invertir / Simuladores', 'Mira tus números antes de decidir',
          'Elige un simulador, completa tus datos una vez y revisa tus números con calma. Los resultados son referenciales.', 'Simuladores') + f"""
<div data-simuladores>
<section class="section" id="sim-area"><div class="container">
  <div class="title center"><span class="eyebrow">Elige tu simulador</span><h2>¿Qué quieres simular?</h2>
    <p class="lead">Toca una opción para abrir su simulador.</p></div>
  <div class="sim-picks" role="tablist" aria-label="Simuladores">
    <button type="button" class="sim-pick" role="tab" data-sim-tab="sim-proyecta" aria-selected="false">
      <span class="sim-pick-ico">A·H·T</span><strong>Proyecta un Hogar</strong><span>Invierte tu capital con Acción, Hipoteca o Título y compáralo con un depósito a plazo.</span><em>Desde $5MM</em><span class="sim-pick-go">Abrir simulador <i aria-hidden="true">↓</i></span></button>
    <button type="button" class="sim-pick" role="tab" data-sim-tab="sim-hipoteca" aria-selected="false">
      <span class="sim-pick-ico">HI</span><strong>Hipoteca Inteligente</strong><span>Arma tu configuración con tu capacidad de crédito y mira cómo termina.</span><em>Desde 2.000 UF de crédito</em><span class="sim-pick-go">Abrir simulador <i aria-hidden="true">↓</i></span></button>
    <button type="button" class="sim-pick" role="tab" data-sim-tab="sim-circular" aria-selected="false">
      <span class="sim-pick-ico">IC</span><strong>Inversión Circular</strong><span>Transforma el capital de tu propiedad en flujo mensual.</span><em>Próximamente</em><span class="sim-pick-go">Ver más <i aria-hidden="true">↓</i></span></button>
  </div>

  <div class="sim-stage" id="sim-stage" hidden>
  <div class="gate" id="sim-gate" aria-labelledby="gate-title">
    <span class="gate-lock" aria-hidden="true">🔒</span>
    <h3 id="gate-title">Completa tus datos para ver tu simulación</h3>
    <p class="gate-sub">Te los pedimos una sola vez y quedan listos para todos los simuladores.</p>
    <form class="gate-form" id="gate-form" novalidate>
      <label>Nombre y apellido<input id="gate-nombre" name="nombre" autocomplete="name" placeholder="Tu nombre" required></label>
      <label>Correo electrónico<input name="email" type="email" autocomplete="email" placeholder="nombre@correo.cl" required></label>
      <label>Teléfono / WhatsApp<span class="gate-tel"><span>+56</span><input name="telefono" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="9 1234 5678" required></span></label>
      <label class="check"><input type="checkbox" name="terminos" required><span>Acepto los términos y condiciones y la <a href="privacidad.html" target="_blank">Política de privacidad</a>.</span></label>
      <label class="check"><input type="checkbox" name="contenido" required><span>Acepto que Pulso Inversor me envíe contenido e información sobre inversiones por correo y WhatsApp.</span></label>
      <div class="hp" aria-hidden="true"><label>No completar<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <p class="gate-err" id="gate-err" role="alert"></p>
      <button class="btn btn-primary" type="submit">Ver mi simulación <span aria-hidden="true">→</span></button>
    </form>
  </div>
  {P("CASILLAS: ambas obligatorias a pedido de la usuaria. La Política de privacidad del sitio actual decía que la casilla de contenido era opcional; revisar con legal. FALTA el documento de Términos y condiciones (hoy el enlace va a la Política de privacidad).")}

<div class="sim-panel" id="sim-proyecta" data-sim-panel="sim-proyecta"><div class="sim-panel-body">
    <div class="sim-head"><h2>Proyecta un Hogar</h2><p class="muted">Elige tu estrategia, el monto y el plazo, y compara con lo que te daría un depósito a plazo.</p></div>
    <div class="pro">
      <div class="pro-form">
        <span class="pro-label">Estrategia</span>
        <div class="pro-series">
          <button type="button" data-serie="A"><b>A</b><span>Acción<small>Desde $5MM · Pagaré</small></span></button>
          <button type="button" data-serie="H"><b>H</b><span>Hipoteca<small>Desde $25MM · Hipoteca</small></span></button>
          <button type="button" data-serie="T"><b>T</b><span>Título<small>Desde $100MM · Título</small></span></button>
        </div>
        <label class="pro-label" for="p-monto">Monto a invertir</label>
        <input id="p-monto" class="pro-monto" type="text" inputmode="numeric" autocomplete="off">
        <div class="pro-chips" id="p-quick"></div>
        <p class="pro-help" id="p-min"></p>
        <p class="pro-warn" id="p-warn" hidden>El monto está bajo el mínimo; se calcula con el mínimo de la estrategia.</p>
        <span class="pro-label">Plazo</span>
        <div class="pro-chips" id="p-plazos"></div>
        <div class="pro-retiro" id="p-retiro-wrap">
          <span class="pro-label">¿Quieres la opción de retiro anticipado?</span>
          <div class="pro-yesno" role="group" aria-label="Retiro anticipado"><button type="button" class="chip-opt" data-retiro="0">No</button><button type="button" class="chip-opt" data-retiro="1">Sí</button></div>
          <p class="pro-help">Si eliges Sí, puedes retirar antes del plazo, y la tasa mensual baja 0,1 punto (por ejemplo, de 1,0% a 0,9%).</p>
        </div>
      </div>
      <div class="pro-out">
        <div class="pro-cols">
          <div class="pro-result">
            <span class="pro-tag">Con Pulso</span>
            <div class="pro-total"><small>Total a recibir</small><strong id="r-total">—</strong></div>
            <div class="pro-gain"><small>Ganas</small><strong id="r-ganancia">—</strong></div>
            <ul class="pro-list">
              <li><span>Estrategia</span><strong id="r-estrategia">—</strong></li>
              <li><span>Monto</span><strong id="r-monto">—</strong></li>
              <li><span>Plazo</span><strong id="r-plazo">—</strong></li>
              <li><span>Tasa</span><strong id="r-tasa">—</strong></li>
            </ul>
          </div>
          <div class="pro-dap">
            <span class="pro-tag bank">En un depósito a plazo</span>
            <div class="pro-total"><small>Total a recibir</small><strong id="d-total">—</strong></div>
            <div class="pro-gain bank"><small>Ganas</small><strong id="d-dap">—</strong></div>
            <ul class="pro-list">
              <li><span>Monto</span><strong id="d-monto">—</strong></li>
              <li><span>Plazo</span><strong id="d-plazo">—</strong></li>
              <li><span>Tasa</span><strong><span id="d-tasa">—</span> mensual</strong></li>
            </ul>
          </div>
        </div>
        <div class="pro-diff"><span>Con Pulso ganas</span><strong id="d-dif">—</strong><span>más que en un depósito a plazo · <b id="d-veces">—</b> su ganancia</span></div>
        <p class="pro-pref" id="p-pref" hidden>Sobre $250.000.000 puedes acceder a condiciones preferentes. Pregúntale a tu asesor.</p>
        <div class="pro-actions"><button type="button" class="btn btn-primary" id="p-enviar">Enviar mi simulación a un asesor</button><button type="button" class="btn btn-outline" id="p-whatsapp">Enviar por WhatsApp</button></div>
        <p class="pro-status" id="p-status" role="status"></p>
        <p class="pro-note">Referencial. Depósito a plazo calculado a 30 días, renovado cada mes. <span id="r-nota-uf">Hipoteca y Título se reajustan en UF (UF de hoy <span id="r-uf">—</span>, IPC estimado 4,5% anual).</span> Las condiciones finales dependen de la evaluación y del contrato.</p>
      </div>
    </div>
    {P("TASA del depósito a plazo (DAP_MENSUAL en assets/js/simuladores.js): 0,40% mensual referencial; CONFIRMAR el valor a usar.")}
  </div></div>

  <div class="sim-panel" id="sim-hipoteca" data-sim-panel="sim-hipoteca" hidden><div class="sim-panel-body">
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
    <p class="pro-note">Simulación referencial en UF. Considera una vacancia promedio de 1 mes por año, contribuciones estimadas en 0,08% anual de la tasación y mantención y reparaciones estimadas en 0,04% anual. En la recompra, la amortización acumulada se distribuye en partes iguales entre el inversionista y Pulso. Los valores definitivos dependen de cada propiedad y de la tabla bancaria aplicable.</p>
    {P("REVISIÓN 7 pedía retirar la regla de reparto 50/50 de la amortización en la recompra porque difiere de la presentación vigente. Se replicó tal cual el simulador actual a pedido de la usuaria: CONFIRMAR.")}
    <img id="hi-logo" src="assets/img/logo-pulso-gmm.png" alt="" width="396" height="44" hidden>
  </div></div>

  <div class="sim-panel" id="sim-circular" data-sim-panel="sim-circular" hidden><div class="sim-panel-body">
    <div class="sim-soon"><span class="pill soon">Próximamente</span><h2>Inversión Inmobiliaria Circular</h2><p class="muted">Estamos preparando este simulador. Mientras tanto, un asesor puede revisar tu caso contigo.</p>
      <a class="btn btn-dark" href="{mail('Inversión Inmobiliaria Circular')}" target="_blank" rel="noopener">Agendar una reunión</a></div>
  </div></div>
  </div>
</div></section>
</div>
<section class="section section-soft"><div class="container"><p class="disclaimer" style="text-align:center;margin:0">Los resultados son referenciales y dependen de los datos y supuestos utilizados. Las condiciones de una operación se revisan en su documentación; la simulación no asegura rentabilidad.</p></div></section>
""" + cta_final('¿Prefieres ver los números con alguien?', 'Revisemos tu simulación <span class="accent">juntos</span>',
                'Un asesor te acompaña a leer los resultados y a resolver tus dudas.', AGENDAR, 'mi simulación'),
     scripts='\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>\n<script src="assets/js/simuladores.js"></script>')

# ---------------- Política de privacidad ----------------
page('privacidad.html', 'Política de privacidad',
     'Qué datos personales recoge Pulso Inversor, para qué los usa y cómo ejercer tus derechos.',
     hero('Política de privacidad', 'Política de privacidad', 'Última actualización: 17 de noviembre de 2026', 'Tus datos') + f"""
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
  <p>Usamos proveedores de servicios tecnológicos, como la plataforma de correo y gestión de contactos Brevo y Google (planillas). Ellos tratan tus datos solo por encargo nuestro y para los fines descritos aquí.</p>
  <h2>4. Cuánto tiempo los guardamos</h2>
  <p>Mientras mantengamos contacto contigo o hasta que nos pidas eliminarlos, salvo que la ley nos obligue a conservarlos por más tiempo.</p>
  <h2>5. Tus derechos</h2>
  <p>Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos, eliminarlos u oponerte a su uso, y retirar tu autorización para recibir contenido. Escríbenos a <a href="mailto:{EMAIL}">{EMAIL}</a> indicando tu nombre y lo que necesitas.</p>
  <h2>6. Contacto</h2>
  <p>Correo: <a href="mailto:{EMAIL}">{EMAIL}</a> · Teléfono: +56 2 3365 5239</p>
  <h2>7. Cambios a esta política</h2>
  <p>Si actualizamos esta política, publicaremos la nueva versión en esta página con su fecha.</p>
</div></section>
""")

# ---------------- 3.1 Nosotros ----------------
HITOS = [
    ('2016', 'Los orígenes', 'Bajo el origen empresarial de Partners &amp; Advisers y la gestión de Iván Barboza, nace el modelo Inversión Remate Seguro (IRS), que permitía a los inversionistas participar en oportunidades de remates judiciales con respaldo de activos inmobiliarios.'),
    ('2016 – 2023', 'Experiencia y especialización', 'Se consolida una profunda experiencia en evaluación comercial, análisis jurídico y gestión inmobiliaria, y el horizonte se amplía hacia el financiamiento privado.'),
    ('Fines de 2023', 'Nace Pulso Inversor SpA', 'Con la entrada en vigor de la Ley Fintech y la especialización de las actividades de Partners &amp; Advisers, se constituye oficialmente Pulso Inversor SpA y el modelo evoluciona hacia la Inversión con Garantía Real (IGR).'),
    ('Hoy', 'Parte de Grupo Matchmaking', 'Ese desarrollo impulsó la creación de Grupo Matchmaking, el grupo de empresas del que Pulso Inversor hoy forma parte fundamental.'),
]
hitos = ''.join(f'<li><span class="hito-year">{y}</span><strong>{t}</strong><p>{d}</p></li>' for y, t, d in HITOS)
PILARES_N = [
    ('Transparencia y simplicidad', 'Un modelo directo que no complica al inversionista, con condiciones contractuales claras y resultados previamente pactados.'),
    ('Seguridad y respaldo', 'Toda operación está sustentada en garantías reales (activos inmobiliarios subyacentes) o instrumentos legales sólidos.'),
    ('Rentabilidad', 'Búsqueda constante de retornos atractivos que superen a los instrumentos de ahorro convencionales.'),
    ('Inversión con sentido', 'Generamos valor más allá del dinero, con soluciones que ayudan a los propietarios frente a escenarios de pérdida patrimonial y abren nuevas oportunidades financieras.'),
]
EQUIPO = [
    ('Jessica Valenzuela', 'Jefa comercial', None),
    ('Felipe Jaña', 'Jefe de operaciones', None),
    ('William Rojas', 'Jefe de contabilidad', None),
    ('Gloria Cepeda', 'Asesora', 'assets/img/asesores/gloria.webp'),
    ('Pamela Herrera', 'Asesora', 'assets/img/asesores/pamela.webp'),
    ('Renato Vargas', 'Asesor', None),
    ('Santiago Fernández', 'Asesor internacional', None),
]
def _ini(n):
    partes = n.split()
    return (partes[0][0] + (partes[-1][0] if len(partes) > 1 else '')).upper()
crew = ''.join(
    f'''<article class="crew-card">{f'<img src="{foto}" alt="{n}" width="240" height="240" loading="lazy">' if foto else f'<span class="crew-ini" aria-hidden="true">{_ini(n)}</span>'}<strong>{n}</strong><span>{r}</span></article>'''
    for n, r, foto in EQUIPO)
pilares_n = ''.join(f'<article class="pilar"><span class="pilar-num">0{i+1}</span><h3>{t}</h3><p>{d}</p></article>' for i, (t, d) in enumerate(PILARES_N))
_ICONS['onda'] = '<path d="M3 12h3l2-5 4 10 3-7 2 2h4"/>'
_ICONS['flecha-up'] = '<path d="M4 18l6-6 4 4 6-8"/><path d="M15 8h5v5"/>'
DIFERENCIAS = [
    ('onda', 'Descorrelación del mercado bursátil', 'Al centrarse en activos alternativos inmobiliarios, las inversiones no se ven afectadas por la volatilidad diaria de la bolsa, las fluctuaciones de acciones o los conflictos macroeconómicos.'),
    ('flecha-up', 'Rentabilidad superior a la banca tradicional', 'El modelo busca al menos duplicar las tasas de los depósitos a plazo comunes, apuntando a rentabilidades desde el 0,8% mensual.'),
    ('escudo', 'Garantías tangibles', 'El capital se respalda con propiedades a nombre del inversionista, contratos de mutuo, hipotecas o pagarés, con un nivel de seguridad igual o superior al de las garantías estatales bancarias.'),
]
diferencias = ''.join(f'<article class="dif">{icon(ic)}<h3>{t}</h3><p>{d}</p></article>' for ic, t, d in DIFERENCIAS)

page('nosotros.html', 'Nosotros',
     'Desde 2016 estructuramos inversiones respaldadas por activos inmobiliarios. Conoce la historia, el enfoque, el equipo y los pilares de Pulso Inversor, parte de Grupo Matchmaking.',
     hero('Conócenos / Nosotros', 'Garantías identificables, evaluables y jurídicamente constituidas',
          'Es el principio con que nacimos en 2016 y el que sigue guiando cada operación de Pulso Inversor.', 'Quiénes somos') + f"""
{P("TEXTOS de marca entregados por la usuaria el 2026-11-16. REVISIÓN LEGAL sugerida antes de publicar: 'nivel de seguridad igual o superior al de las garantías estatales bancarias', 'no se ven afectadas por… conflictos macroeconómicos', 'inversiones seguras', 'garantizando que cada operación sea… segura', 'retornos estables', 'completamente desconectada de la volatilidad bursátil'.")}
<section class="section"><div class="container split">
  <div class="sticky-col"><span class="eyebrow">Nuestra historia</span><h2>Una trayectoria que empezó en 2016</h2>
    <p class="muted">De los remates judiciales a la Inversión con Garantía Real, siempre con el mismo principio fundacional.</p></div>
  <ol class="hitos">{hitos}</ol>
</div></section>

<section class="section section-dark enfoque"><div class="container">
  <span class="eyebrow dark">Nuestro enfoque</span>
  <p class="enfoque-quote" data-words>Buscamos facilitar el acceso al mercado de activos alternativos, conectando a quienes necesitan soluciones de liquidez con inversionistas que buscan <span class="accent">diversificar, proteger y hacer crecer su patrimonio</span>.</p>
  <div class="enfoque-cols">
    <p>Creemos en un modelo de financiamiento privado que, junto con generar retornos estables y muy atractivos, entrega herramientas reales para que los propietarios puedan reorganizar sus finanzas de manera sostenible.</p>
    <p>Nuestro propósito es consolidarnos como un actor de referencia en el mercado, con una estructura de inversión transparente, directa y completamente desconectada de la volatilidad bursátil.</p>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Nuestro equipo</span><h2>Las personas detrás de Pulso</h2></div>
  {P("FOTOS provisorias tomadas de las portadas de los videos de newpulso. Reemplazar por fotografías aprobadas.")}
  <div class="team">
    <article class="team-card"><div class="team-photo" style="background-image:url(assets/img/equipo/ivan-barboza.jpg)"></div><div class="team-body">
      <h3>Iván Barboza</h3><span class="team-role">Cofundador y experto inmobiliario</span>
      <p>Con más de una década desarrollando modelos de inversión alternativa, Iván es el arquitecto detrás de Pulso Inversor. En 2016, al alero de Partners &amp; Advisers, comenzó a estructurar operaciones respaldadas por activos inmobiliarios, buscando más transparencia, gestión profesional y solidez contractual para los inversionistas. Ese conocimiento le permitió evolucionar el modelo hacia la Inversión con Garantía Real (IGR) y liderar en 2023 el nacimiento de Pulso Inversor SpA, con el propósito de acercar a las personas a inversiones seguras y respaldadas.</p></div></article>
    <article class="team-card"><div class="team-photo" style="background-image:url(assets/img/equipo/felipe-rojas.jpg)"></div><div class="team-body">
      <h3>Felipe Rojas</h3><span class="team-role">Cofundador y estratega financiero</span>
      <p>Lleva 16 años liderando áreas de finanzas y control de gestión en compañías como LATAM, Iansa y Transbank, y suma esa visión corporativa y rigor analítico a la empresa. Su vínculo con el proyecto nació de la confianza en el modelo: comenzó como cliente, validando la rentabilidad y seguridad de las operaciones con su propio patrimonio. Hoy estructura financieramente los productos para que cada operación sea directa, segura y competitiva.</p></div></article>
  </div>
  {P("EQUIPO entregado por la usuaria el 2026-11-17. Fotos: hay de Gloria y Pamela; el resto muestra iniciales.")}
  <h3 class="team-sub">El equipo que te acompaña</h3>
  <div class="crew">{crew}</div>
</div></section>

<section class="section section-soft"><div class="container">
  <div class="title center"><span class="eyebrow">Nuestros pilares</span><h2>Lo que guía cada operación</h2></div>
  <div class="pilares">{pilares_n}</div>
</div></section>

<section class="section"><div class="container">
  <div class="title center"><span class="eyebrow">Qué nos diferencia del mercado</span><h2>Una alternativa que se sostiene en activos reales</h2></div>
  <div class="difs">{diferencias}</div>
  <p class="disclaimer" style="text-align:center">Toda inversión tiene riesgos. Las condiciones de cada operación quedan establecidas en su contrato.</p>
</div></section>
""" + cta_final())

# ---------------- 3.2 Verifica ----------------
SENALES = [
    ('No te explican de dónde sale la rentabilidad', 'En Pulso:', 'cada retorno está ligado a una operación concreta y queda escrito en el contrato que revisas antes de firmar.'),
    ('No te dicen en qué está tu dinero', 'En Pulso:', 'te mostramos una operación real, con la propiedad, su tasación y su precio de compra.'),
    ('Te apuran para firmar', 'En Pulso:', 'no te pedimos decidir en la reunión. Te llevas los documentos y lo piensas con calma.'),
]
senales = ''.join(f'<article class="senal"><span class="senal-tag">Señal {i+1}</span><h3>{t}</h3><p><strong>{k}</strong> {d}</p></article>' for i, (t, k, d) in enumerate(SENALES))

FICHA = [
    (None, 'Inmueble', 'Casa · Puerto Varas'),
    (1, 'Valor comercial (tasación)', '9.800 UF <small>Tasador independiente · marzo 2026</small>'),
    (2, 'Precio de compra', '5.900 UF <small>40% bajo la tasación</small>'),
    (3, 'Qué queda a favor del inversionista', 'Hipoteca inscrita en el Conservador de Bienes Raíces'),
    (4, 'Plazo y calendario', '18 meses <small>Intereses trimestrales · capital al vencimiento</small>'),
    (None, 'Estado', '<span class="ficha-estado">En curso</span>'),
]
ficha = ''.join(f'<div class="ficha-row">{f"<span class=ficha-mark>{n}</span>" if n else "<span></span>"}<span class="ficha-label">{l}</span><strong>{v}</strong></div>' for n, l, v in FICHA)
REVISAR = [
    'Que la tasación sea reciente y diga quién la hizo.',
    'La diferencia entre el precio de compra y el valor comercial.',
    'Qué documento queda a tu favor y dónde se inscribe.',
    'Cuándo te pagan y cuándo vuelve tu capital.',
]
revisar = ''.join(f'<li><span class="ficha-mark">{i+1}</span>{t}</li>' for i, t in enumerate(REVISAR))

RIESGOS = [
    ('Que un pago se atrase o no se cumpla', 'Cada operación tiene garantías según su instrumento: acciones de cobro con el pagaré, venta voluntaria o ejecución de la hipoteca, o exigir la recompra cuando la propiedad está a tu nombre.'),
    ('Que la propiedad baje de valor', 'Las operaciones se estructuran con una diferencia entre el precio de compra y la tasación, que puedes revisar antes de invertir. Ese margen amortigua una baja, pero no la elimina.'),
    ('Que necesites tu dinero antes', 'Antes de invertir revisamos contigo el plazo y cuánto puedes destinar sin tocar tu fondo de emergencia. Una salida anticipada depende de las condiciones de tu contrato.'),
    ('Problemas legales del inmueble', 'Los documentos se firman ante notario y la garantía o el título se inscriben en el Conservador de Bienes Raíces. Puedes pedir los certificados y revisarlos con tu abogado.'),
    ('Poner todo en un mismo lugar', 'Te recomendamos invertir una parte de tu patrimonio, no todo. El resto debería seguir en alternativas que puedas usar cuando lo necesites.'),
]
riesgos = ''.join(f'<article class="riesgo"><div class="riesgo-q"><span class="riesgo-ico" aria-hidden="true">!</span><h3>{q}</h3></div><div class="riesgo-a"><span class="riesgo-k">Cómo lo mitigamos</span><p>{a_}</p></div></article>' for q, a_ in RIESGOS)

OFICINA_DIR = None   # PENDIENTE: dirección de la oficina (activa el mapa de Google)
RUT = None           # PENDIENTE: RUT de Pulso Inversor SpA
if OFICINA_DIR:
    _mapa = f'<iframe class="of-map" title="Mapa de la oficina de Pulso Inversor" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q={urllib.parse.quote(OFICINA_DIR)}&output=embed"></iframe>'
else:
    _mapa = '<div class="of-map of-map-ilus" role="img" aria-label="Mapa ilustrativo"><span class="of-pin" aria-hidden="true"></span></div>'
_datos = [('Razón social', 'Pulso Inversor SpA')]
if RUT: _datos.append(('RUT', RUT))
if OFICINA_DIR: _datos.append(('Oficina', OFICINA_DIR + '. Puedes venir a conocernos.'))
_datos += [('WhatsApp', f'<a href="https://wa.me/{WHATSAPP}" target="_blank" rel="noopener">+56 9 8355 4676</a>'), ('Correo', f'<a href="mailto:{EMAIL}">{EMAIL}</a>'), ('Grupo', 'Una empresa de Grupo Matchmaking')]
datos = ''.join(f'<div class="of-row"><span>{k}</span><strong>{v}</strong></div>' for k, v in _datos)

page('verifica-a-pulso.html', 'Verifica a Pulso',
     'Por qué Pulso Inversor no está en la CMF, cómo reconocer una estafa, cómo revisar una operación, qué riesgos existen y cómo los mitigamos, y los datos de la empresa.',
     f"""<section class="page-hero v-hero"><div class="container">
  <div class="breadcrumb"><a href="index.html">Inicio</a> / Conócenos / Verifica a Pulso</div>
  <span class="eyebrow dark">Verifica a Pulso</span>
  <h1>¿Por qué no estamos en la CMF?</h1>
  <p class="v-answer">Pulso Inversor no requiere certificación CMF bajo esta estructura privada, contractual y personalizada. No opera como banco, corredora, administradora de fondos ni plataforma de financiamiento colectivo regulada.</p>
  <p>Tu respaldo está en los documentos que firmas. Por eso, aquí te damos lo necesario para revisarnos por tu cuenta.</p>
  <div class="actions"><a class="btn btn-secondary" href="https://www.cmfchile.cl" target="_blank" rel="noopener">Consultar registros y alertas de la CMF</a></div>
  {P("INCORPORAR enlaces oficiales directos a los registros y alertas de la CMF; por ahora se enlaza el sitio general.")}
</div></section>

<section class="section section-soft estafa"><div class="container estafa-grid">
  <figure class="estafa-video">
    <video controls playsinline preload="none" poster="assets/media/ivan-es-una-estafa.jpg"><source src="assets/media/ivan-es-una-estafa.mp4" type="video/mp4"></video>
    <figcaption><strong>«¿Esto es una estafa?»</strong> Iván Barboza responde</figcaption>
  </figure>
  <div>
    <span class="eyebrow">Para que te cuides de todos, incluidos nosotros</span>
    <h2>Tres señales de una estafa. Mídenos con ellas.</h2>
    <div class="senales">{senales}</div>
  </div>
</div></section>

<section class="section" id="operacion-abierta"><div class="container">
  <div class="title center"><span class="eyebrow">Operación abierta</span><h2>Cómo revisar una operación</h2>
    <p class="lead">Cada operación tiene su ficha. Con este ejemplo te mostramos qué mirar en cada dato antes de invertir.</p></div>
  {P("FICHA DE EJEMPLO con datos ficticios. Reemplazar por una operación real autorizada (candidata: Fundo Alhué, Curacaví) cuando se apruebe su publicación.")}
  <div class="ficha-grid">
    <article class="ficha">
      <div class="ficha-img" style="background-image:url(assets/img/portafolio/puerto-varas.svg)"><span class="ficha-badge">Ejemplo ilustrativo · datos ficticios</span></div>
      <div class="ficha-body"><span class="ficha-kicker">Ficha de la operación</span><h3>Operación de ejemplo · Puerto Varas</h3>{ficha}</div>
    </article>
    <div class="ficha-guide">
      <span class="eyebrow">Cómo leer esta ficha</span>
      <h3>Lo que deberías revisar en cualquier operación</h3>
      <ol class="ficha-check">{revisar}</ol>
      <p class="muted">Pide los certificados al Conservador de Bienes Raíces que corresponda, compara la tasación con propiedades parecidas y lleva los documentos a tu abogado antes de firmar.</p>
      <div class="actions"><a class="btn btn-dark" href="{mail('una operación real')}" target="_blank" rel="noopener">Quiero ver una operación real</a></div>
    </div>
  </div>
</div></section>

<section class="section section-soft" id="riesgos"><div class="container">
  <div class="title center"><span class="eyebrow">Riesgos y cómo los mitigamos</span><h2>Lo que puede salir mal, y qué hacemos al respecto</h2>
    <p class="lead">Toda inversión tiene riesgos. Preferimos que los conozcas ahora, junto con lo que hacemos para acotarlos.</p></div>
  {P("VALIDAR internamente que las medidas descritas coinciden con la práctica de cada operación.")}
  <div class="riesgos">{riesgos}</div>
</div></section>

<section class="oficina"><div class="container of-grid">
  <div class="of-info">
    <span class="eyebrow dark">Conócenos en persona</span>
    <h2>Datos de la empresa, a la vista</h2>
    <p>Sin intermediarios ni nombres de fantasía. Estos son nuestros datos para que los compruebes, y la invitación a reunirnos.</p>
    {P("COMPLETAR RUT y dirección de la oficina en scripts/build.py (variables RUT y OFICINA_DIR). Con la dirección se activa el mapa de Google.")}
    <div class="of-data">{datos}</div>
    <a class="btn btn-primary btn-xl" href="{mail('reunión en la oficina')}" target="_blank" rel="noopener">Agendar una reunión <span aria-hidden="true">→</span></a>
  </div>
  {_mapa}
</div></section>
""")

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
