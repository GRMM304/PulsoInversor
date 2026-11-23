"""SEO de www.pulsoinversor.cl: títulos, descripciones, URL canónica, Open Graph, datos estructurados (JSON-LD)
y ajustes del HTML final (enlaces internos sin .html, imágenes diferidas, preguntas frecuentes).

Lo usa scripts/build.py desde page(). Para cambiar el título o la descripción de una página en Google, edita SEO.
Reglas: título de hasta 60 caracteres y descripción de hasta 155; nunca "seguro", "garantizado" ni "sin riesgo".
"""
import html as _html
import json
import re

DOMINIO = 'https://www.pulsoinversor.cl'
MARCA = 'Pulso Inversor'
OG_IMAGEN = DOMINIO + '/assets/img/og-pulso-inversor.jpg'  # 1200 × 630
# Google Analytics 4: ID de medición (G-…). Con None no se carga Analytics.
GA4_ID = 'G-S1Q53460X9'

# slug: (título en Google, descripción en Google)
SEO = {
    'index.html': (
        'Pulso Inversor: invierte con respaldo inmobiliario en Chile',
        'Invierte en operaciones privadas respaldadas por propiedades, con documentos firmados ante notario y un '
        'asesor que te acompaña. Simula tu inversión hoy.'),
    'como-funciona.html': (
        'Cómo invertir con respaldo inmobiliario | Pulso Inversor',
        'Paso a paso: cómo se estructura una inversión con Pulso Inversor, qué propiedad la respalda, qué firmas ante '
        'notario y cómo se definen retorno y plazo.'),
    'inversiones.html': (
        'Alternativas de inversión inmobiliaria | Pulso Inversor',
        'Renta de Capital, Producción de Capital y Arquitectura de Capital: montos, plazos, garantías y para quién es '
        'cada estrategia de inversión.'),
    'garantias-y-documentos.html': (
        'Garantías: hipoteca, título y pagaré | Pulso Inversor',
        'Qué protege tu inversión: hipoteca, título de propiedad, pagaré y contrato de mutuo, y cómo funcionan los '
        'resguardos si una operación no se paga a tiempo.'),
    'simuladores.html': (
        'Simulador de inversión inmobiliaria | Pulso Inversor',
        'Simula tu inversión en Renta de Capital y compárala con un depósito a plazo. Recibe el resultado en PDF y '
        'revísalo con un asesor de Pulso Inversor.'),
    'inversion-circular.html': (
        'Inversión Circular: renta mensual con tu propiedad',
        'Transforma el capital detenido en tu propiedad en una inversión con intereses fijos cada mes. Conoce cómo '
        'funciona y simula tu caso.'),
    'nosotros.html': (
        'Quiénes somos: equipo y trayectoria | Pulso Inversor',
        'Desde 2016 estructuramos inversiones respaldadas por propiedades. Conoce la historia, el equipo y la forma de '
        'trabajar de Pulso Inversor.'),
    'verifica-a-pulso.html': (
        'Verifica a Pulso Inversor antes de invertir',
        'Por qué Pulso Inversor no está en la CMF, cómo reconocer una estafa, cómo revisar una operación antes de '
        'firmar y los datos oficiales de la empresa.'),
    'mi-primera-inversion.html': (
        'Mi primera inversión fuera del banco | Pulso Inversor',
        None),  # se mantiene la descripción de build.py
    'ya-tengo-experiencia.html': (
        'Para inversionistas con experiencia | Pulso Inversor',
        'Operaciones desde $25 millones con una propiedad identificada y una hipoteca inscrita a tu favor o la '
        'propiedad a tu nombre. Revísalo con tu abogado.'),
    'preguntas-frecuentes.html': (
        'Preguntas frecuentes sobre invertir | Pulso Inversor',
        None),
    'noticias.html': (
        'Noticias y blog | Pulso Inversor',
        'Noticias de Pulso Inversor y de las empresas de Grupo Matchmaking: encuentros con inversionistas, novedades '
        'y artículos para invertir con más información.'),
    'privacidad.html': (None, None),
}

NO_INDEXAR = {'simuladores-equipo.html', '404.html', 'inversion-circular.html', 'reunion-agendada.html', 'noticia-plantilla.html', 'tu-dinero-en-el-banco.html', 'instagram.html'}

REDES = ['https://www.instagram.com/pulsoinversorcl', 'https://www.facebook.com/pulsoinversor.cl/',
         'https://www.linkedin.com/company/pulsoinversor/']

ORGANIZACION = {
    '@type': ['Organization', 'FinancialService'],
    '@id': DOMINIO + '/#organizacion',
    'name': MARCA,
    'legalName': 'Pulso Inversor SpA',
    'url': DOMINIO + '/',
    'logo': {'@type': 'ImageObject', 'url': DOMINIO + '/assets/img/app/icon-512.png', 'width': 512, 'height': 512},
    'image': OG_IMAGEN,
    'description': 'Inversiones privadas respaldadas por propiedades en Chile: operaciones con hipoteca, título de '
                   'propiedad o pagaré, documentos firmados ante notario y asesoría personal.',
    'email': 'contacto@pulsoinversor.cl',
    'telephone': '+56958792038',
    'areaServed': {'@type': 'Country', 'name': 'Chile'},
    'knowsLanguage': 'es',
    'sameAs': REDES,
    'parentOrganization': {'@type': 'Organization', 'name': 'Grupo MatchMaking'},
    'contactPoint': {'@type': 'ContactPoint', 'contactType': 'customer service', 'telephone': '+56958792038',
                     'email': 'contacto@pulsoinversor.cl', 'availableLanguage': 'es', 'areaServed': 'CL'},
}

SITIO_WEB = {
    '@type': 'WebSite',
    '@id': DOMINIO + '/#sitio',
    'name': MARCA,
    'url': DOMINIO + '/',
    'inLanguage': 'es-CL',
    'publisher': {'@id': DOMINIO + '/#organizacion'},
}


def url_de(slug):
    return DOMINIO + '/' + ('' if slug == 'index.html' else slug[:-5])


def titulo_y_desc(slug, titulo_base, desc_base):
    t, d = SEO.get(slug, (None, None))
    if not t:
        t = 'Pulso Inversor · Inversiones con garantía real' if slug == 'index.html' else f'{titulo_base} · {MARCA}'
    return t, (d or desc_base)


def _ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '</script>'


# Páginas que cuentan como ViewContent en el píxel de Meta (sirven para audiencias de remarketing).
CONTENIDO_META = {
    'inversiones.html': 'Inversiones', 'garantias-y-documentos.html': 'Garantías y respaldo',
    'como-funciona.html': 'Cómo funciona', 'simuladores.html': 'Simuladores',
    'inversion-circular.html': 'Inversión Circular', 'mi-primera-inversion.html': 'Mi primera inversión',
    'ya-tengo-experiencia.html': 'Ya tengo experiencia', 'verifica-a-pulso.html': 'Verifica a Pulso Inversor',
    'nosotros.html': 'Nosotros', 'preguntas-frecuentes.html': 'Preguntas frecuentes', 'noticias.html': 'Noticias', 'tu-dinero-en-el-banco.html': 'Tu dinero en el banco',
}


# Con la configuración básica de Meta solo llega el NOMBRE del evento: un evento propio por interés permite
# audiencias segmentadas (quién vio cada estrategia o cada ruta). Se envía una vez por sesión.
INTERES_POR_PAGINA = {
    'mi-primera-inversion.html': 'PerfilPrimeraVez',
    'ya-tengo-experiencia.html': 'PerfilConExperiencia',
    'inversion-circular.html': 'VioInversionCircular',
    'verifica-a-pulso.html': 'VerificoEmpresa',
}
INTERES_JS = ("window.pulsoInteres=function(n){try{var k='pi_'+n;if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');}catch(e){}"
              "if(window.fbq)fbq('trackCustom',n);if(window.pulsoMedir)pulsoMedir('interes',{tema:n});};")


def vista_contenido(slug):
    n = CONTENIDO_META.get(slug)
    out = INTERES_JS
    if n:
        out += f"\nfbq('track', 'ViewContent', {{content_name: '{n}', content_category: 'Página'}});"
    if slug in INTERES_POR_PAGINA:
        out += f"\npulsoInteres('{INTERES_POR_PAGINA[slug]}');"
    return out


def analytics():
    """Etiqueta de Google Analytics 4 y pulsoMedir(evento, datos), que usan main.js, simuladores.js y lorenzo.js."""
    medir = "<script>window.pulsoMedir=function(n,p){try{if(window.gtag)gtag('event',n,Object.assign({pagina:location.pathname},p||{}));}catch(e){}};</script>"
    if not GA4_ID:
        return medir
    return (f'<script async src="https://www.googletagmanager.com/gtag/js?id={GA4_ID}"></script>\n'
            "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());"
            f"gtag('config','{GA4_ID}');</script>\n" + medir)


def cabecera(slug, titulo, desc, nombre_corto):
    """Etiquetas para <head>: canónica, robots, Open Graph, Twitter y JSON-LD."""
    url = url_de(slug)
    t, d = _html.escape(titulo, quote=True), _html.escape(desc, quote=True)
    robots = 'noindex, nofollow' if slug in NO_INDEXAR else 'index, follow, max-image-preview:large, max-snippet:-1'
    grafo = [ORGANIZACION, SITIO_WEB, {
        '@type': 'WebPage', '@id': url + '#pagina', 'url': url, 'name': titulo, 'description': desc,
        'inLanguage': 'es-CL', 'isPartOf': {'@id': DOMINIO + '/#sitio'}, 'about': {'@id': DOMINIO + '/#organizacion'},
        'primaryImageOfPage': OG_IMAGEN,
    }]
    if slug != 'index.html' and slug not in NO_INDEXAR:
        grafo.append({'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': DOMINIO + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': nombre_corto, 'item': url},
        ]})
    return '\n'.join([
        f'<meta name="robots" content="{robots}">',
        f'<link rel="canonical" href="{url}">',
        '<meta property="og:type" content="website">',
        '<meta property="og:locale" content="es_CL">',
        f'<meta property="og:site_name" content="{MARCA}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        f'<meta property="og:image" content="{OG_IMAGEN}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{MARCA}: inversiones respaldadas por propiedades">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{t}">',
        f'<meta name="twitter:description" content="{d}">',
        f'<meta name="twitter:image" content="{OG_IMAGEN}">',
        _ld({'@context': 'https://schema.org', '@graph': grafo}),
        analytics(),
    ])


_PAGINA_INTERNA = re.compile(r'href="(?:\./)?(index|[a-z0-9-]+)\.html(#[^"]*)?"')


def _enlace_limpio(m):
    nombre, ancla = m.group(1), m.group(2) or ''
    return f'href="/{"" if nombre == "index" else nombre}{ancla}"'


def _faq(html):
    """FAQPage a partir de los <details> de la página (pregunta = <summary>, respuesta = .details-body)."""
    items = []
    for m in re.finditer(r'<details[^>]*>\s*<summary[^>]*>(.*?)</summary>\s*<div class="details-body">(.*?)</div>\s*</details>', html, re.S):
        q = re.sub(r'\s+', ' ', _html.unescape(re.sub('<[^>]+>', '', m.group(1)))).strip()
        a = re.sub(r'\s+', ' ', _html.unescape(re.sub('<[^>]+>', ' ', m.group(2)))).strip()
        if q and a:
            items.append({'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}})
    return items


def _diferir_imagenes(html):
    """loading="lazy" en las imágenes que no se ven al cargar (todo lo que va después de la primera sección)."""
    i = html.find('<main')
    j = html.find('</section>', i) if i >= 0 else -1
    if j < 0:
        return html
    def lazy(m):
        tag = m.group(0)
        if 'loading=' in tag or 'facebook.com/tr' in tag:
            return tag
        return tag[:-1].rstrip('/').rstrip() + ' loading="lazy" decoding="async">'
    return html[:j] + re.sub(r'<img\b[^>]*>', lazy, html[j:])


def html_final(html, slug):
    html = html.replace('<html lang="es">', '<html lang="es-CL">', 1)
    html = _PAGINA_INTERNA.sub(_enlace_limpio, html)
    # Separa título y bajada del <h1> para que Google lea "detrás. Míralo…" y no "detrásMíralo".
    html = html.replace('<span class="h-sub">', ' <span class="h-sub">')
    html = _diferir_imagenes(html)
    if slug in ('404.html', 'noticia-plantilla.html'):  # se muestran en cualquier ruta: los archivos van con ruta absoluta
        html = re.sub(r'((?:href|src)=")(?!https?:|/|#|mailto:|tel:|data:|javascript:)', r'\1/', html)
    if slug == 'preguntas-frecuentes.html':
        items = _faq(html)
        if items:
            html = html.replace('</head>', _ld({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': items}) + '\n</head>', 1)
    return html
