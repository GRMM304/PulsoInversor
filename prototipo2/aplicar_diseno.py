# -*- coding: utf-8 -*-
"""Prototipo 2: toma las páginas del sitio V5 (_v5/) y les aplica el diseño del Prototipo 1.

Uso:  python3 aplicar_diseno.py
Lee:  _v5/*.html, _v5/assets/css, _v5/assets/js, _v5/manifest.webmanifest, _diseno/
Crea: public/ (lo que se publica en Cloudflare). Las imágenes y videos viven directo en public/assets/img y public/assets/video.
"""
import os, re, shutil, glob

AQUI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(AQUI, '_v5')
DIS = os.path.join(AQUI, '_diseno')
OUT = os.path.join(AQUI, 'public')

WHATSAPP = '56983554676'
WHATSAPP_TXT = '+56 9 8355 4676'
EMAIL = 'contacto@pulsoinversor.cl'
RETRATOS = {
    'Felipe Rojas': 'retrato-felipe-rojas.jpg',
    'Iván Barboza': 'retrato-ivan-barboza.jpg',
    'Pamela Herrera': 'retrato-pamela-herrera.jpg',
    'Gloria Cepeda': 'retrato-gloria-cepeda.jpg',
}

# Paleta V5 -> paleta del Prototipo 1
COLORES = [
    ('#1f2a24', '#0E2C28'), ('#27392f', '#123D35'), ('#161e1a', '#111514'),
    ('#b4e04a', '#C7D95D'), ('#c6ea6e', '#D5E47C'), ('#3f6f55', '#1E5746'),
    ('#8fa36b', '#599675'), ('#c2aa62', '#F5B05E'), ('#dfe4e0', '#E3E8E2'),
    ('rgba(180,224,74', 'rgba(199,217,93'), ('rgba(31,42,36', 'rgba(14,44,40'),
]


def colores(s):
    for a, b in COLORES:
        s = re.sub(re.escape(a), b, s, flags=re.I)
    s = s.replace("'Open Sans'", 'Inter').replace('"Open Sans"', 'Inter')
    return s


CABEZA = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
          '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">\n'
          '<meta name="robots" content="noindex, nofollow">\n'
          '<link rel="stylesheet" href="assets/css/prototipo1.css">\n')


def pagina(nombre, s):
    s = colores(s)
    # Fuente: Inter en vez de Open Sans
    s = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?family=Open\+Sans[^"]*" rel="stylesheet">', '', s)

    # Logo a color con Grupo Matchmaking en la cabecera blanca
    s = re.sub(r'(<a class="pi-logo"[^>]*>)<img src="assets/img/logo-pulso-blanco\.png"[^>]*>',
               r'\1<img src="assets/img/logo-pulso-gmm.png" alt="Pulso Inversor · Una empresa de Grupo Matchmaking" width="861" height="101">', s)

    # Datos de contacto conocidos en lugar de los [REQUIERE]
    s = s.replace('<span class="ph">[REQUIERE: número]</span>', f'<a href="https://wa.me/{WHATSAPP}">{WHATSAPP_TXT}</a>')
    s = re.sub(r'<span class="ph">\[REQUIERE: correo(?: de contacto)?\]</span>', f'<a href="mailto:{EMAIL}">{EMAIL}</a>', s)
    s = s.replace('"56900000000"', f'"{WHATSAPP}"').replace("'56900000000'", f"'{WHATSAPP}'")

    # Redes: WhatsApp y correo pasan a ser enlaces reales
    # Estructura: <span class="pi-red pi-pend">SVG<span class="pi-red-t"><b>Nombre</b><small class=ph>…</small></span></span>
    def red(m):
        icono, nombre = m.group(1), m.group(2)
        if nombre == 'WhatsApp':
            return (f'<a class="pi-red" href="https://wa.me/{WHATSAPP}" target="_blank" rel="noopener" aria-label="WhatsApp de Pulso Inversor">'
                    f'{icono}<span class="pi-red-t"><b>WhatsApp</b><small>{WHATSAPP_TXT}</small></span></a>')
        if nombre == 'Correo':
            return (f'<a class="pi-red" href="mailto:{EMAIL}" aria-label="Correo de Pulso Inversor">'
                    f'{icono}<span class="pi-red-t"><b>Correo</b><small>{EMAIL}</small></span></a>')
        return m.group(0)
    s = re.sub(r'<span class="pi-red pi-pend">(<svg.*?</svg>)<span class="pi-red-t"><b>([^<]+)</b><small[^>]*>[^<]*</small></span></span>', red, s, flags=re.S)

    # Fotos del equipo: retrato real si existe; si no, iniciales (como en el Prototipo 1)
    def foto(m):
        nombre = m.group(1)
        archivo = RETRATOS.get(nombre)
        if archivo:
            return f'<img class="retrato" src="assets/img/{archivo}" alt="{nombre}" loading="lazy" width="140" height="140"><b>{nombre}</b>'
        ini = ''.join(w[0] for w in nombre.split()[:2]).upper()
        return f'<div class="foto foto-ini" aria-hidden="true">{ini}</div><b>{nombre}</b>'
    s = re.sub(r'<div class="foto">\[REQUIERE: foto\]</div><b>([^<]+)</b>', foto, s)
    s = s.replace('[REQUIERE: fotos de la propiedad]', 'Fotos de la propiedad: se muestran en la reunión')

    # Inicio: la sección «¿Por qué invertir con Pulso?» del Prototipo 1 reemplaza a la de las tres preguntas del V5
    if nombre == 'index.html':
        i = s.find('Elijas el camino que elijas')
        a, b = s.rfind('<section', 0, i), s.find('</section>', i) + len('</section>')
        assert i > 0 and a > 0, 'no se encontró la sección de las tres preguntas'
        s = s[:a] + open(os.path.join(DIS, 'por-que-pulso.html'), encoding='utf-8').read().strip() + s[b:]

    # Inicio: «Formas de invertir · Tres caminos» del Prototipo 1 reemplaza a «Según cuánto quieres mover» del V5
    if nombre == 'index.html':
        i = s.find('Según cuánto quieres mover')
        a, b = s.rfind('<section', 0, i), s.find('</section>', i) + len('</section>')
        assert i > 0 and a > 0, 'no se encontró la sección de soluciones'
        s = s[:a] + s[b:]  # se quita de su lugar original...
        # ...y va justo antes de la sección del video (testimonios)
        j = s.find('Personas reales, con nombre')
        c = s.rfind('<section', 0, j)
        assert j > 0 and c > 0, 'no se encontró la sección de testimonios'
        s = s[:c] + open(os.path.join(DIS, 'formas-de-invertir.html'), encoding='utf-8').read().strip() + '\n\n' + s[c:]

    # Inicio: «Personas reales, con nombre» del Prototipo 1 reemplaza a la prueba social del V5
    if nombre == 'index.html':
        i = s.find('Personas reales, con nombre')
        a, b = s.rfind('<section', 0, i), s.find('</section>', i) + len('</section>')
        assert i > 0 and a > 0, 'no se encontró la sección de testimonios'
        s = s[:a] + open(os.path.join(DIS, 'personas-reales.html'), encoding='utf-8').read().strip() + s[b:]

    # Inicio: «Así es el camino, a tu ritmo» rediseñado con línea de tiempo
    if nombre == 'index.html':
        i = s.find('Así es el camino, a tu ritmo')
        a, b = s.rfind('<section', 0, i), s.find('</section>', i) + len('</section>')
        assert i > 0 and a > 0, 'no se encontró la sección del camino'
        s = s[:a] + open(os.path.join(DIS, 'camino-ritmo.html'), encoding='utf-8').read().strip() + s[b:]

    # Héroe del inicio con la foto de Santiago bajo el filtro verde
    if nombre == 'index.html':
        viejo = '<h1>Con tu dinero no se juega.<br><em>Míralo antes de firmar.</em></h1>'
        assert viejo in s, 'no se encontró el título del inicio'
        s = s.replace(viejo, '<h1>Queremos que entiendas<br><em>antes de decidir.</em></h1>', 1)
        s = s.replace('<section class="hero centro">',
                      '<section class="hero centro hero-foto"><img class="hero-bg" src="assets/img/hero-santiago.jpg" '
                      'srcset="assets/img/hero-santiago-movil.jpg 1000w, assets/img/hero-santiago.jpg 1920w" sizes="100vw" alt="" fetchpriority="high">', 1)

    # Estilos del Prototipo 1 al final de <head>, para que manden sobre los de V5
    s = s.replace('</head>', CABEZA + '</head>', 1)
    return s


def main():
    os.makedirs(os.path.join(OUT, 'assets', 'css'), exist_ok=True)
    os.makedirs(os.path.join(OUT, 'assets', 'js'), exist_ok=True)

    for p in sorted(glob.glob(os.path.join(SRC, '*.html'))):
        n = os.path.basename(p)
        s = pagina(n, open(p, encoding='utf-8').read())
        open(os.path.join(OUT, n), 'w', encoding='utf-8').write(s)
        print('página', n)

    for sub in ('css', 'js'):
        for p in glob.glob(os.path.join(SRC, 'assets', sub, '*')):
            s = colores(open(p, encoding='utf-8').read())
            open(os.path.join(OUT, 'assets', sub, os.path.basename(p)), 'w', encoding='utf-8').write(s)

    m = colores(open(os.path.join(SRC, 'manifest.webmanifest'), encoding='utf-8').read())
    open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8').write(m)

    shutil.copy(os.path.join(DIS, 'prototipo1.css'), os.path.join(OUT, 'assets', 'css', 'prototipo1.css'))
    for f in ('logo-pulso-gmm.png', 'hero-santiago.jpg', 'hero-santiago-movil.jpg', 'retrato-pamela-herrera.jpg', 'retrato-gloria-cepeda.jpg', 'hero-poster.jpg', 'testimonio-gonzalo.jpg'):
        shutil.copy(os.path.join(DIS, f), os.path.join(OUT, 'assets', 'img', f))

    # Prototipo: que Google no lo indexe
    open(os.path.join(OUT, '_headers'), 'w').write('/*\n  X-Robots-Tag: noindex, nofollow\n')
    print('listo')


if __name__ == '__main__':
    main()
