# -*- coding: utf-8 -*-
with open('apresentacao.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
pattern = r'<!-- Destaque: Por que é importante & Onde está no app -->[\s\S]*?</div>\s*</div>\s*</div>'
matches = list(re.finditer(pattern, text))
print(f"Total callout blocks: {len(matches)}")
for i, m in enumerate(matches):
    start = max(0, m.start() - 150)
    context = text[start:m.start()]
    slide_id = re.findall(r'id="([^"]+)"', context)
    slide = slide_id[-1] if slide_id else 'unknown'
    print(f"{i+1}: near slide {slide}")
