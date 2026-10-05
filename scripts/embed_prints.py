import os
import base64
import re

dir_assets = 'c:/PROJETOMOBILE/assets/apresentacao'

def get_b64(filename):
    path = os.path.join(dir_assets, filename)
    with open(path, 'rb') as f:
        data = f.read()
    return 'data:image/webp;base64,' + base64.b64encode(data).decode('utf-8')

b64 = {
    'login': get_b64('00-login.webp'),
    'apont1': get_b64('01-apontamento-topo.webp'),
    'apont2': get_b64('02-apontamento-registro.webp'),
    'trab': get_b64('03-trabalhadores.webp'),
    'desp': get_b64('04-despesas.webp'),
    'mapa': get_b64('05-mapa-gps.webp'),
}

html_file = 'c:/PROJETOMOBILE/apresentacao.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add PRINTS definition right after highlight.js script if not present
if 'const PRINTS =' not in content:
    prints_script = f'''    <script>
        const PRINTS = {{
            login: "{b64['login']}",
            apontamentoTopo: "{b64['apont1']}",
            apontamentoRegistro: "{b64['apont2']}",
            trabalhadores: "{b64['trab']}",
            despesas: "{b64['desp']}",
            mapa: "{b64['mapa']}"
        }};
    </script>
'''
    content = content.replace('<script>hljs.highlightAll();</script>', '<script>hljs.highlightAll();</script>\n' + prints_script)

# 2. Slide 2: Overview thumbnails
login_b64 = b64['login']
apont1_b64 = b64['apont1']
apont2_b64 = b64['apont2']
trab_b64 = b64['trab']
desp_b64 = b64['desp']
mapa_b64 = b64['mapa']

content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/00-login\.webp" type="image/webp">\s*<img src="assets/apresentacao/00-login\.jpg" alt="Tela de Login" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{login_b64}" alt="Tela de Login" {m.group(1)}>',
    content
)

content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/01-apontamento-topo\.webp" type="image/webp">\s*<img src="assets/apresentacao/01-apontamento-topo\.jpg" alt="Tela de Apontamento" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{apont1_b64}" alt="Tela de Apontamento" {m.group(1)}>',
    content
)

content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/03-trabalhadores\.webp" type="image/webp">\s*<img src="assets/apresentacao/03-trabalhadores\.jpg" alt="Tela de Trabalhadores" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{trab_b64}" alt="Tela de Trabalhadores" {m.group(1)}>',
    content
)

content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/04-despesas\.webp" type="image/webp">\s*<img src="assets/apresentacao/04-despesas\.jpg" alt="Tela de Despesas" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{desp_b64}" alt="Tela de Despesas" {m.group(1)}>',
    content
)

content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/05-mapa-gps\.webp" type="image/webp">\s*<img src="assets/apresentacao/05-mapa-gps\.jpg" alt="Tela de Mapa" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{mapa_b64}" alt="Tela de Mapa" {m.group(1)}>',
    content
)

# Slide 3: Login detail
content = content.replace(
    "onclick=\"openImageModal('assets/apresentacao/00-login.jpg', 'Tela 0: Login e Autenticação Segura — SafraCafé')\"",
    "onclick=\"openImageModal(PRINTS.login, 'Tela 0: Login e Autenticação Segura — SafraCafé')\""
)
content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/00-login\.webp" type="image/webp">\s*<img src="assets/apresentacao/00-login\.jpg" alt="Tela de Login" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{login_b64}" alt="Tela de Login" {m.group(1)}>',
    content
)

# Slide 4: Apontamento detail
content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/01-apontamento-topo\.webp" type="image/webp">\s*<img src="assets/apresentacao/01-apontamento-topo\.jpg" alt="Apontamento Topo" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{apont1_b64}" alt="Apontamento Topo" {m.group(1)}>',
    content
)
content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/02-apontamento-registro\.webp" type="image/webp">\s*<img src="assets/apresentacao/02-apontamento-registro\.jpg" alt="Apontamento Registro" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{apont2_b64}" alt="Apontamento Registro" {m.group(1)}>',
    content
)

# Slide 5: Trabalhadores detail
content = content.replace(
    "onclick=\"openImageModal('assets/apresentacao/03-trabalhadores.jpg', 'Tela 2: Gestão de Trabalhadores — SafraCafé')\"",
    "onclick=\"openImageModal(PRINTS.trabalhadores, 'Tela 2: Gestão de Trabalhadores — SafraCafé')\""
)
content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/03-trabalhadores\.webp" type="image/webp">\s*<img src="assets/apresentacao/03-trabalhadores\.jpg" alt="Tela de Trabalhadores" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{trab_b64}" alt="Tela de Trabalhadores" {m.group(1)}>',
    content
)

# Slide 6: Despesas detail
content = content.replace(
    "onclick=\"openImageModal('assets/apresentacao/04-despesas.jpg', 'Tela 3: Controle de Despesas — SafraCafé')\"",
    "onclick=\"openImageModal(PRINTS.despesas, 'Tela 3: Controle de Despesas — SafraCafé')\""
)
content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/04-despesas\.webp" type="image/webp">\s*<img src="assets/apresentacao/04-despesas\.jpg" alt="Tela de Despesas" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{desp_b64}" alt="Tela de Despesas" {m.group(1)}>',
    content
)

# Slide 7: Mapa detail
content = content.replace(
    "onclick=\"openImageModal('assets/apresentacao/05-mapa-gps.jpg', 'Tela 4: Mapa da Lavoura & GPS — SafraCafé')\"",
    "onclick=\"openImageModal(PRINTS.mapa, 'Tela 4: Mapa da Lavoura & GPS — SafraCafé')\""
)
content = re.sub(
    r'<picture>\s*<source srcset="assets/apresentacao/05-mapa-gps\.webp" type="image/webp">\s*<img src="assets/apresentacao/05-mapa-gps\.jpg" alt="Tela de Mapa" ([^>]+)>\s*</picture>',
    lambda m: f'<img src="{mapa_b64}" alt="Tela de Mapa" {m.group(1)}>',
    content
)

# 3. Update JavaScript variables for Apontamento
content = content.replace(
    "let currentApontamentoImg = 'assets/apresentacao/01-apontamento-topo.jpg';",
    "let currentApontamentoImg = PRINTS.apontamentoTopo;"
)
content = content.replace(
    "currentApontamentoImg = 'assets/apresentacao/01-apontamento-topo.jpg';",
    "currentApontamentoImg = PRINTS.apontamentoTopo;"
)
content = content.replace(
    "currentApontamentoImg = 'assets/apresentacao/02-apontamento-registro.jpg';",
    "currentApontamentoImg = PRINTS.apontamentoRegistro;"
)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS: All prints embedded permanently as Base64 into apresentacao.html')
