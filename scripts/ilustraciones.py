"""Genera ilustraciones provisorias (SVG) para el portafolio y las garantías.

Son imágenes de ejemplo con la paleta de la marca. Reemplazar por fotos reales
cuando estén disponibles (mismos nombres de archivo o actualizar scripts/build.py).
Uso: python3 scripts/ilustraciones.py
"""
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = os.path.join(R, 'assets', 'img', 'portafolio')
GAR = os.path.join(R, 'assets', 'img', 'garantias')
os.makedirs(PORT, exist_ok=True)
os.makedirs(GAR, exist_ok=True)

def svg(w, h, body, defs=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice"><defs>{defs}</defs>{body}</svg>'

def sky(id_, top, bottom):
    return f'<linearGradient id="{id_}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>'

def windows(x, y, cols, rows, w, h, gx, gy, lit='#ffd98a', dark='#2d4a47', seed=1):
    out = []
    for r in range(rows):
        for c in range(cols):
            on = ((r * 7 + c * 3 + seed) % 5) in (0, 2)
            out.append(f'<rect x="{x + c*gx}" y="{y + r*gy}" width="{w}" height="{h}" rx="1.5" fill="{lit if on else dark}" opacity="{0.95 if on else 0.75}"/>')
    return ''.join(out)

def tree(x, y, s=1, c='#2f5d46'):
    return f'<g transform="translate({x} {y}) scale({s})"><rect x="-3" y="0" width="6" height="22" fill="#4a3b2c"/><path d="M0-58L-22 4H22Z" fill="{c}"/><path d="M0-40L-18 -6H18Z" fill="{c}" opacity=".85"/></g>'

def house(x, y, w, h, wall, roof, door='#3b2f26', win='#ffd98a'):
    rh = h * .55
    return (f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{wall}"/>'
            f'<path d="M{x-12} {y+2}L{x+w/2} {y-rh}L{x+w+12} {y+2}Z" fill="{roof}"/>'
            f'<rect x="{x+w*.42}" y="{y+h*.45}" width="{w*.16}" height="{h*.55}" fill="{door}"/>'
            f'<rect x="{x+w*.12}" y="{y+h*.25}" width="{w*.18}" height="{h*.22}" fill="{win}"/>'
            f'<rect x="{x+w*.70}" y="{y+h*.25}" width="{w*.18}" height="{h*.22}" fill="{win}"/></g>')

W, H = 800, 600
props = {}

# 1. Puerto Varas: lago y volcán al atardecer
props['puerto-varas'] = svg(W, H, f'''
<rect width="800" height="600" fill="url(#s)"/>
<circle cx="610" cy="170" r="46" fill="#ffd27a" opacity=".9"/>
<path d="M120 360L330 120L380 150L420 120L620 360Z" fill="#6b7f8c"/>
<path d="M300 152L330 120L380 150L420 120L452 160L410 172L380 160L350 176Z" fill="#f4f1ea"/>
<rect y="340" width="800" height="120" fill="url(#lago)"/>
<path d="M0 450C160 420 300 470 460 440S700 430 800 450V600H0Z" fill="#3e6b4f"/>
{house(420, 390, 150, 90, '#8a5a3c', '#3b2a22')}
{tree(110, 470, 1.4)}{tree(170, 480, 1.1, '#264d3b')}{tree(660, 470, 1.3, '#264d3b')}{tree(720, 485, 1.0)}
<path d="M0 520C200 500 400 540 800 510V600H0Z" fill="#2c5440"/>''',
    sky('s', '#f2b37a', '#f7dcc0') + '<linearGradient id="lago" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa7b5"/><stop offset="1" stop-color="#4f7f8f"/></linearGradient>')

# 2. Las Condes: torres de vidrio y cordillera
props['las-condes'] = svg(W, H, f'''
<rect width="800" height="600" fill="url(#s)"/>
<path d="M0 330L120 230L210 290L330 190L450 280L560 210L680 290L800 240V420H0Z" fill="#8fa2b0"/>
<path d="M300 210L330 190L360 212L345 220Z M540 222L560 210L585 228Z" fill="#fff" opacity=".9"/>
<rect x="150" y="200" width="120" height="400" fill="#2d4f58"/>{windows(162, 216, 5, 18, 14, 12, 21, 20, seed=2)}
<rect x="300" y="120" width="150" height="480" fill="#1f3d45"/>{windows(312, 136, 6, 23, 15, 12, 22, 20, seed=5)}
<path d="M300 120L450 120L450 100L375 70L300 100Z" fill="#183139"/>
<rect x="480" y="230" width="130" height="370" fill="#35606a"/>{windows(492, 246, 5, 17, 15, 12, 23, 20, seed=3)}
<rect x="630" y="300" width="110" height="300" fill="#284a52"/>{windows(642, 316, 4, 14, 16, 12, 24, 20, seed=4)}
<rect y="560" width="800" height="40" fill="#1a2f2b"/>
{tree(80, 575, 1.1, '#3d6b4f')}{tree(770, 578, 1.0, '#3d6b4f')}''',
    sky('s', '#7fb0cf', '#f4d9b8'))

# 3. Osorno: casa sureña entre colinas
props['osorno'] = svg(W, H, f'''
<rect width="800" height="600" fill="url(#s)"/>
<ellipse cx="200" cy="130" rx="120" ry="34" fill="#fff" opacity=".7"/><ellipse cx="560" cy="100" rx="150" ry="38" fill="#fff" opacity=".6"/>
<path d="M0 360C150 300 300 330 420 300S700 280 800 320V600H0Z" fill="#6f9a6a"/>
<path d="M0 430C180 390 360 440 520 400S720 390 800 410V600H0Z" fill="#4f7d55"/>
{house(260, 330, 240, 140, '#c96e3d', '#2f3b3a', win='#fff1c9')}
<rect x="300" y="365" width="20" height="35" fill="#fff1c9"/>
<path d="M0 520C220 495 480 545 800 505V600H0Z" fill="#3a6545"/>
{tree(120, 470, 1.5, '#2f5d46')}{tree(180, 485, 1.1)}{tree(620, 470, 1.6, '#264d3b')}{tree(690, 490, 1.2)}''',
    sky('s', '#a9c4cf', '#e9eef0'))

# 4. Viña del Mar: edificios frente al mar al atardecer
props['vina-del-mar'] = svg(W, H, f'''
<rect width="800" height="600" fill="url(#s)"/>
<circle cx="200" cy="300" r="70" fill="#ffc97a" opacity=".9"/>
<rect y="330" width="800" height="270" fill="url(#mar)"/>
<path d="M0 350H800" stroke="#fff" stroke-opacity=".25"/>
<rect x="430" y="150" width="110" height="260" fill="#e8e1d6"/>{windows(442, 166, 4, 11, 18, 14, 25, 22, lit='#ffcf8a', dark='#9fb3bd', seed=1)}
<rect x="560" y="200" width="100" height="210" fill="#d9cfc1"/>{windows(572, 216, 4, 9, 15, 14, 22, 22, lit='#ffcf8a', dark='#9fb3bd', seed=6)}
<rect x="680" y="240" width="90" height="170" fill="#efe7db"/>{windows(690, 256, 3, 7, 18, 14, 26, 22, lit='#ffcf8a', dark='#9fb3bd', seed=3)}
<path d="M380 410C500 395 650 400 800 395V600H380Z" fill="#c9b48f"/>
<path d="M0 470C200 455 350 480 520 470S760 465 800 475V600H0Z" fill="#3e7f8f" opacity=".35"/>''',
    sky('s', '#f0a37a', '#fbe0c4') + '<linearGradient id="mar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b9bb0"/><stop offset="1" stop-color="#2f6f82"/></linearGradient>')

# 5. Providencia: edificio residencial con árboles
props['providencia'] = svg(W, H, f'''
<rect width="800" height="600" fill="url(#s)"/>
<rect x="250" y="110" width="300" height="490" fill="#eae4da"/>
''' + ''.join(f'<rect x="262" y="{130+i*54}" width="276" height="10" fill="#cfc6b8"/>' for i in range(8)) + windows(275, 145, 6, 8, 30, 30, 44, 54, lit='#ffd98a', dark='#6f8a8a', seed=2) + f'''
<rect x="250" y="95" width="300" height="18" fill="#d7cfc2"/>
<circle cx="150" cy="470" r="90" fill="#4f8a5a"/><circle cx="90" cy="520" r="70" fill="#3e7a4d"/><rect x="146" y="480" width="10" height="120" fill="#4a3b2c"/>
<circle cx="660" cy="480" r="85" fill="#4f8a5a"/><circle cx="730" cy="530" r="65" fill="#3e7a4d"/><rect x="656" y="490" width="10" height="110" fill="#4a3b2c"/>
<rect y="580" width="800" height="20" fill="#5e6b62"/>''',
    sky('s', '#8cbad6', '#e6f0f2'))

# 6. Chicureo: casa moderna con jardín y cordillera
props['chicureo'] = svg(W, H, f'''
<rect width="800" height="600" fill="url(#s)"/>
<path d="M0 300L140 200L260 270L390 170L520 260L640 200L800 280V420H0Z" fill="#9aa9a6"/>
<path d="M370 186L390 170L412 188Z M620 214L640 200L662 216Z" fill="#fff"/>
<rect y="400" width="800" height="200" fill="#7fa86b"/>
<rect x="220" y="300" width="380" height="140" fill="#f4f1ea"/>
<rect x="200" y="288" width="420" height="18" fill="#2b3a37"/>
<rect x="250" y="330" width="150" height="90" fill="#3d5c66"/><rect x="250" y="330" width="150" height="90" fill="#ffd98a" opacity=".55"/>
<rect x="430" y="330" width="60" height="110" fill="#5a4636"/>
<rect x="510" y="330" width="70" height="60" fill="#3d5c66"/>
<rect x="160" y="440" width="500" height="14" fill="#cfc6b8"/>
<rect x="600" y="450" width="160" height="40" rx="6" fill="#5fb3c9"/>
{tree(110, 450, 1.3, '#3d6b4f')}{tree(690, 420, 1.1, '#2f5d46')}
<path d="M0 520C200 500 500 540 800 515V600H0Z" fill="#5f8f55"/>''',
    sky('s', '#9cc6e0', '#f7e6cc'))

for name, content in props.items():
    open(os.path.join(PORT, f'{name}.svg'), 'w').write(content)

# ---------- Fondos de garantías (oscuros, quedan detrás del texto) ----------
GW, GH = 1200, 800
DEF = sky('g', '#16382f', '#0b1d19') + '<radialGradient id="r" cx=".8" cy=".2" r=".7"><stop offset="0" stop-color="#c7d95d" stop-opacity=".35"/><stop offset="1" stop-color="#c7d95d" stop-opacity="0"/></radialGradient>'
BASE = '<rect width="1200" height="800" fill="url(#g)"/><rect width="1200" height="800" fill="url(#r)"/>'
L = 'fill="none" stroke="#c7d95d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
L2 = 'fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'
gar = {
 'pagare': BASE + f'''<g transform="translate(700 140) rotate(-6)"><rect width="380" height="500" rx="18" fill="#f4f1ea" opacity=".08" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>
   <path d="M50 90H330M50 150H330M50 210H260M50 270H300" {L2}/><path d="M60 400C100 350 130 440 170 390S240 360 280 400" {L}/><path d="M50 430H330" {L2}/></g>
   <g transform="translate(980 520) rotate(35)"><rect x="-10" y="-150" width="20" height="200" rx="8" fill="#c7d95d" opacity=".8"/><path d="M-10 50L0 80L10 50Z" fill="#ffc33f"/></g>''',
 'hipoteca': BASE + f'''<g transform="translate(720 170)"><path d="M0 220L220 40L440 220" {L}/><path d="M50 180V470H390V180" {L2}/>
   <rect x="160" y="270" width="120" height="110" rx="14" fill="#c7d95d" opacity=".85"/><path d="M185 270V230a35 35 0 0 1 70 0V270" fill="none" stroke="#c7d95d" stroke-width="12"/><circle cx="220" cy="315" r="12" fill="#0e2c28"/><rect x="214" y="320" width="12" height="30" fill="#0e2c28"/></g>''',
 'titulo': BASE + f'''<g transform="translate(700 180)"><path d="M0 200L200 40L400 200V470H0Z" {L2}/>
   <g transform="translate(250 330) rotate(-35)"><circle r="70" fill="none" stroke="#c7d95d" stroke-width="14"/><circle r="22" fill="#c7d95d" opacity=".6"/>
   <path d="M70 0H300M230 0V45M270 0V35" fill="none" stroke="#c7d95d" stroke-width="14" stroke-linecap="round"/></g></g>''',
 'mutuo': BASE + f'''<g transform="translate(690 130)"><rect x="60" y="40" width="330" height="440" rx="16" fill="#fff" opacity=".06" stroke="#fff" stroke-opacity=".25" stroke-width="3" transform="rotate(8 225 260)"/>
   <rect x="0" y="60" width="330" height="440" rx="16" fill="#f4f1ea" opacity=".09" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
   <path d="M40 140H290M40 190H290M40 240H220M40 290H260M40 340H200" {L2}/>
   <circle cx="250" cy="420" r="46" fill="none" stroke="#c7d95d" stroke-width="6"/><path d="M228 420l14 14 28-30" {L}/></g>''',
}
for name, body in gar.items():
    open(os.path.join(GAR, f'{name}.svg'), 'w').write(svg(GW, GH, body, DEF))
print('ilustraciones:', len(props), 'propiedades,', len(gar), 'garantías')
