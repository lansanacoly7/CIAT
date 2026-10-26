import os
import pathlib
import subprocess
import numpy as np
import matplotlib.textpath
from matplotlib.font_manager import FontProperties
from PIL import Image

# Directory setup
LOGO_DIR = pathlib.Path('logo').resolve()
LOGO_DIR.mkdir(parents=True, exist_ok=True)
chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

# Official Color Codes from Charte Graphique
COLOR_BROWN = '#5A3A22'
COLOR_GOLD = '#D4AA70'
COLOR_WHITE = '#FFFFFF'

# Helper function to convert text to pure vector SVG path
def text_to_svg_path(text, font_prop, size, x_offset=0, y_offset=0, tracking=0):
    total_d = []
    curr_x = x_offset
    for char in text:
        tp = matplotlib.textpath.TextPath((0, 0), char, prop=font_prop, size=size)
        codes = tp.codes
        verts = tp.vertices
        d_char = []
        i = 0
        while i < len(codes):
            code = codes[i]
            if code == 1: # MOVETO
                vx, vy = verts[i]
                d_char.append(f'M {curr_x + vx:.2f} {y_offset - vy:.2f}')
                i += 1
            elif code == 2: # LINETO
                vx, vy = verts[i]
                d_char.append(f'L {curr_x + vx:.2f} {y_offset - vy:.2f}')
                i += 1
            elif code == 3: # CURVE3
                cx, cy = verts[i]
                ex, ey = verts[i+1]
                d_char.append(f'Q {curr_x + cx:.2f} {y_offset - cy:.2f} {curr_x + ex:.2f} {y_offset - ey:.2f}')
                i += 2
            elif code == 4: # CURVE4
                c1x, c1y = verts[i]
                c2x, c2y = verts[i+1]
                ex, ey = verts[i+2]
                d_char.append(f'C {curr_x + c1x:.2f} {y_offset - c1y:.2f} {curr_x + c2x:.2f} {y_offset - c2y:.2f} {curr_x + ex:.2f} {y_offset - ey:.2f}')
                i += 3
            elif code == 79: # CLOSEPOLY
                d_char.append('Z')
                i += 1
            else:
                i += 1
        total_d.append(' '.join(d_char))
        char_width = tp.get_extents().width
        curr_x += char_width + tracking
    return ' '.join(total_d), curr_x

# Mathematical definitions for the Symbol
def get_symbol_path(cx, cy, r_out, r_in):
    cos45 = np.cos(np.pi / 4)
    sin45 = np.sin(np.pi / 4)
    
    x1 = cx + r_out * cos45
    y1 = cy - r_out * sin45
    
    x2 = cx + r_in * cos45
    y2 = cy - r_in * sin45
    
    x3 = cx + r_in * cos45
    y3 = cy + r_in * sin45
    
    x4 = cx + r_out * cos45
    y4 = cy + r_out * sin45
    
    return f"""M {x1:.2f} {y1:.2f} L {x2:.2f} {y2:.2f} A {r_in} {r_in} 0 1 0 {x3:.2f} {y3:.2f} L {x4:.2f} {y4:.2f} A {r_out} {r_out} 0 1 1 {x1:.2f} {y1:.2f} Z"""

# 1. SQUARE SYMBOL (viewBox: 0 0 1024 1024)
# Optimal optical center: cx=530, cy=512, r_out=430, r_in=255, r_core=140
sym_cx, sym_cy = 530, 512
sym_rout, sym_rin, sym_rcore = 430, 255, 140
sym_c_path = get_symbol_path(sym_cx, sym_cy, sym_rout, sym_rin)

# 2. HORIZONTAL LOCKUP (viewBox: 0 0 1024 340)
# Symbol scaled: cx=170, cy=170, r_out=125, r_in=74, r_core=41
h_cx, h_cy = 170, 170
h_rout, h_rin, h_rcore = 125, 74, 41
h_c_path = get_symbol_path(h_cx, h_cy, h_rout, h_rin)

# Text path for 'CIAT' in Century Gothic Bold
fp_ciat = FontProperties(fname=r'C:\Windows\Fonts\GOTHICB.TTF')
# We position 'CIAT' starting at x=350, y=228 (optical baseline), size=165, tracking=44
h_text_path, text_end_x = text_to_svg_path('CIAT', fp_ciat, 165, x_offset=345, y_offset=228, tracking=44)

# Assets dictionary defining each deliverable
assets = {}

# Deliverable 1: Symbole seul, format carré (Couleurs officielles)
assets['ciat_symbole'] = {
    'svg': f'''<svg viewBox="0 0 1024 1024" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- CIAT - Centre d'Innovation, d'Application et de Transfert -->
  <!-- Symbole officiel format carré -->
  <g id="ciat-symbol">
    <!-- Berceau d'application et projection de transfert -->
    <path id="c-frame" d="{sym_c_path}" fill="{COLOR_BROWN}" />
    <!-- Noyau d'innovation / Graine créative -->
    <circle id="innovation-core" cx="{sym_cx}" cy="{sym_cy}" r="{sym_rcore}" fill="{COLOR_GOLD}" />
  </g>
</svg>''',
    'width': 1024,
    'height': 1024
}

# Deliverable 2: Symbole + 'CIAT' en horizontal (Couleurs officielles)
assets['ciat_horizontal'] = {
    'svg': f'''<svg viewBox="0 0 1024 340" width="1024" height="340" xmlns="http://www.w3.org/2000/svg">
  <!-- CIAT - Logo officiel horizontal -->
  <g id="ciat-logo-horizontal">
    <!-- Symbole CIAT -->
    <g id="symbol">
      <path id="c-frame" d="{h_c_path}" fill="{COLOR_BROWN}" />
      <circle id="innovation-core" cx="{h_cx}" cy="{h_cy}" r="{h_rcore}" fill="{COLOR_GOLD}" />
    </g>
    <!-- Typographie CIAT (formes vectorielles pures) -->
    <path id="ciat-wordmark" d="{h_text_path}" fill="{COLOR_BROWN}" />
  </g>
</svg>''',
    'width': 1024,
    'height': 340
}

# Deliverable 3: Version monochrome brune (Symbole seul carré)
assets['ciat_monochrome_symbole'] = {
    'svg': f'''<svg viewBox="0 0 1024 1024" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- CIAT - Version monochrome brune (format carré) -->
  <g id="ciat-monochrome-symbol">
    <path id="c-frame" d="{sym_c_path}" fill="{COLOR_BROWN}" />
    <circle id="innovation-core" cx="{sym_cx}" cy="{sym_cy}" r="{sym_rcore}" fill="{COLOR_BROWN}" />
  </g>
</svg>''',
    'width': 1024,
    'height': 1024
}

# Deliverable 3 (suite) : Version monochrome brune (Horizontal)
assets['ciat_monochrome_horizontal'] = {
    'svg': f'''<svg viewBox="0 0 1024 340" width="1024" height="340" xmlns="http://www.w3.org/2000/svg">
  <!-- CIAT - Version monochrome brune (horizontal) -->
  <g id="ciat-monochrome-horizontal">
    <g id="symbol">
      <path id="c-frame" d="{h_c_path}" fill="{COLOR_BROWN}" />
      <circle id="innovation-core" cx="{h_cx}" cy="{h_cy}" r="{h_rcore}" fill="{COLOR_BROWN}" />
    </g>
    <path id="ciat-wordmark" d="{h_text_path}" fill="{COLOR_BROWN}" />
  </g>
</svg>''',
    'width': 1024,
    'height': 340
}

# Deliverable 4: Version blanche pour fond sombre (Symbole seul carré)
assets['ciat_blanc_symbole'] = {
    'svg': f'''<svg viewBox="0 0 1024 1024" width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- CIAT - Version blanche pour fond sombre (format carré) -->
  <g id="ciat-blanc-symbol">
    <path id="c-frame" d="{sym_c_path}" fill="{COLOR_WHITE}" />
    <circle id="innovation-core" cx="{sym_cx}" cy="{sym_cy}" r="{sym_rcore}" fill="{COLOR_WHITE}" />
  </g>
</svg>''',
    'width': 1024,
    'height': 1024
}

# Deliverable 4 (suite) : Version blanche pour fond sombre (Horizontal)
assets['ciat_blanc_horizontal'] = {
    'svg': f'''<svg viewBox="0 0 1024 340" width="1024" height="340" xmlns="http://www.w3.org/2000/svg">
  <!-- CIAT - Version blanche pour fond sombre (horizontal) -->
  <g id="ciat-blanc-horizontal">
    <g id="symbol">
      <path id="c-frame" d="{h_c_path}" fill="{COLOR_WHITE}" />
      <circle id="innovation-core" cx="{h_cx}" cy="{h_cy}" r="{h_rcore}" fill="{COLOR_WHITE}" />
    </g>
    <path id="ciat-wordmark" d="{h_text_path}" fill="{COLOR_WHITE}" />
  </g>
</svg>''',
    'width': 1024,
    'height': 340
}

# Generate all SVGs, HTML render wrappers, and 1024px PNGs
for name, data in assets.items():
    svg_content = data['svg']
    w = data['width']
    h = data['height']
    
    # Write clean SVG
    svg_file = LOGO_DIR / f'{name}.svg'
    svg_file.write_text(svg_content, encoding='utf-8')
    print(f'Wrote {svg_file.name}')
    
    # HTML wrapper for exact pixel rasterization with zero margins and transparent background
    html_content = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ width: {w}px; height: {h}px; background: transparent; overflow: hidden; }}
  svg {{ display: block; width: {w}px; height: {h}px; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>'''
    html_file = LOGO_DIR / f'{name}.html'
    html_file.write_text(html_content, encoding='utf-8')
    
    # Rasterize to 1024px PNG with transparent background
    png_file = LOGO_DIR / f'{name}.png'
    subprocess.run([
        chrome, '--headless=new',
        f'--screenshot={png_file}',
        f'--window-size={w},{h}',
        '--default-background-color=00000000',
        html_file.as_uri()
    ], capture_output=True)
    
    print(f'Rendered {png_file.name} ({w}x{h} px)')

# Also generate 32px test icons for both symbol versions to verify favicon/app icon sharpness
for sym_name in ['ciat_symbole', 'ciat_monochrome_symbole', 'ciat_blanc_symbole']:
    p = LOGO_DIR / f'{sym_name}.png'
    if p.exists():
        img = Image.open(p)
        img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
        img_32.save(LOGO_DIR / f'{sym_name}_32px.png')
        print(f'Generated {sym_name}_32px.png')

print("All official brand deliverables generated successfully!")
