import re

with open('apresentacao.html', 'r', encoding='utf-8') as f:
    text = f.read()

slides = ['slide1', 'slide2', 'slide3', 'slide4', 'slide5', 'slide6', 'slide7', 'slide-checklist', 
          'slide8', 'slide9', 'slide10', 'slide11', 'slide12', 'slide13', 'slide14', 'slide15', 
          'slide16', 'slide17', 'slide18', 'slide19', 'slide20']

for s in slides:
    m = re.search(r'<section[^>]*id="' + s + r'"[\s\S]*?</section>', text)
    if m:
        sec = m.group(0)
        matches = re.findall(r'(aluno|supervisor|estagio|estágio|Criterio|PeriodoAvaliacao|TokenSupervisor|RegraGeracaoPdf)', sec, re.I)
        title_m = re.search(r'<h[123][^>]*>([\s\S]*?)</h[123]>', sec)
        title = re.sub(r'<[^>]+>', '', title_m.group(1)).strip() if title_m else 'No title'
        print(f'{s} ({title}): {len(matches)} academic matches -> {set(matches)}')
    else:
        print(f'{s}: NOT FOUND')
