import os
import re

md_path = r"c:\PROJETOMOBILE\docs\GUIA_DEFESA_CODIGOS.md"
with open(md_path, "r", encoding="utf-8") as f:
    text = f.read()

# Simple markdown converter
html_lines = []
in_code = False
code_lang = ""
code_buffer = []

for line in text.split("\n"):
    if line.startswith("```"):
        if in_code:
            in_code = False
            code_content = "\n".join(code_buffer)
            # escape html
            code_content = code_content.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            html_lines.append(f'<pre class="code-block"><code class="lang-{code_lang}">{code_content}</code></pre>')
            code_buffer = []
        else:
            in_code = True
            code_lang = line[3:].strip()
        continue
    
    if in_code:
        code_buffer.append(line)
        continue

    # Blockquotes
    if line.startswith("> "):
        quote_text = line[2:]
        quote_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', quote_text)
        html_lines.append(f'<blockquote class="quote">{quote_text}</blockquote>')
        continue

    # Headings
    if line.startswith("# "):
        h_text = line[2:]
        html_lines.append(f'<h1 class="title-1">{h_text}</h1>')
        continue
    elif line.startswith("## "):
        h_text = line[3:]
        html_lines.append(f'<h2 class="title-2">{h_text}</h2>')
        continue
    elif line.startswith("### "):
        h_text = line[4:]
        html_lines.append(f'<h3 class="title-3">{h_text}</h3>')
        continue
    elif line.startswith("#### "):
        h_text = line[5:]
        html_lines.append(f'<h4 class="title-4">{h_text}</h4>')
        continue

    # HR
    if line.strip() == "---":
        html_lines.append('<hr class="divider" />')
        continue

    # Lists
    if line.startswith("- "):
        l_text = line[2:]
        l_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', l_text)
        l_text = re.sub(r'`(.*?)`', r'<code>\1</code>', l_text)
        html_lines.append(f'<li class="list-item">{l_text}</li>')
        continue

    m_num = re.match(r'^(\d+)\.\s+(.*)$', line)
    if m_num:
        num = m_num.group(1)
        l_text = m_num.group(2)
        l_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', l_text)
        l_text = re.sub(r'`(.*?)`', r'<code>\1</code>', l_text)
        html_lines.append(f'<div class="num-item"><span class="badge-num">{num}</span> <span>{l_text}</span></div>')
        continue

    # Empty line
    if not line.strip():
        html_lines.append('<div class="spacer"></div>')
        continue

    # Regular paragraph
    p_text = line
    p_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', p_text)
    p_text = re.sub(r'`(.*?)`', r'<code>\1</code>', p_text)
    html_lines.append(f'<p class="para">{p_text}</p>')

body_html = "\n".join(html_lines)

full_html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guia de Defesa Técnica dos Códigos — SafraCafé Mobile</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --accent: #10b981;
      --accent-glow: rgba(16, 185, 129, 0.15);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --code-bg: #0d1117;
      --code-border: #30363d;
      --font-main: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-main);
      line-height: 1.65;
      padding: 40px 20px;
    }}
    .container {{
      max-width: 960px;
      margin: 0 auto;
      background: var(--card-bg);
      padding: 48px;
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }}
    .header-bar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
    }}
    .tag {{
      display: inline-block;
      padding: 6px 14px;
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }}
    .print-btn {{
      background: #1f2937;
      color: #fff;
      border: 1px solid #374151;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.2s;
    }}
    .print-btn:hover {{
      background: #374151;
      border-color: #4b5563;
    }}
    h1.title-1 {{
      font-size: 2.2rem;
      font-weight: 800;
      color: #ffffff;
      margin: 32px 0 16px 0;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }}
    h2.title-2 {{
      font-size: 1.5rem;
      font-weight: 700;
      color: #34d399;
      margin: 28px 0 12px 0;
      border-left: 4px solid #10b981;
      padding-left: 14px;
    }}
    h3.title-3 {{
      font-size: 1.15rem;
      font-weight: 600;
      color: #93c5fd;
      margin: 22px 0 10px 0;
    }}
    h4.title-4 {{
      font-size: 1rem;
      font-weight: 600;
      color: #fbbf24;
      margin: 16px 0 8px 0;
    }}
    p.para {{
      font-size: 0.98rem;
      color: #d1d5db;
      margin-bottom: 12px;
    }}
    .quote {{
      background: rgba(16, 185, 129, 0.08);
      border-left: 4px solid var(--accent);
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      color: #a7f3d0;
      margin: 16px 0;
      font-size: 0.95rem;
    }}
    .divider {{
      border: 0;
      height: 1px;
      background: var(--border);
      margin: 36px 0;
    }}
    pre.code-block {{
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 10px;
      padding: 18px;
      margin: 18px 0;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: 0.88rem;
      line-height: 1.55;
      color: #e6edf3;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    }}
    code {{
      font-family: var(--font-mono);
      background: rgba(255,255,255,0.08);
      color: #38bdf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.88em;
    }}
    pre.code-block code {{
      background: transparent;
      padding: 0;
      color: inherit;
    }}
    .list-item {{
      margin-left: 24px;
      color: #e5e7eb;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }}
    .num-item {{
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 10px;
      color: #e5e7eb;
      font-size: 0.95rem;
    }}
    .badge-num {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 26px;
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
    }}
    .spacer {{
      height: 8px;
    }}
    @media print {{
      body {{ background: #fff; color: #000; padding: 0; }}
      .container {{ max-width: 100%; border: none; box-shadow: none; padding: 20px; }}
      .print-btn {{ display: none; }}
      pre.code-block {{ background: #f8f9fa; color: #000; border: 1px solid #ddd; }}
      code {{ background: #eee; color: #000; }}
      h2.title-2 {{ color: #059669; }}
      h3.title-3 {{ color: #2563eb; }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <span class="tag">Guia de Apoio para Apresentação</span>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Salvar em PDF</button>
    </div>
    {body_html}
  </div>
</body>
</html>
"""

html_path = r"c:\PROJETOMOBILE\docs\GUIA_DEFESA_CODIGOS.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(full_html)

print("Gerado com sucesso:", html_path)
