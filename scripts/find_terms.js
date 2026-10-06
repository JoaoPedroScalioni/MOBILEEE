const fs = require('fs');
const html = fs.readFileSync('apresentacao.html', 'utf8');
const sections = html.split('<section');
sections.slice(1).forEach((sec, idx) => {
    const idMatch = sec.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : 'sec-' + idx;
    const matches = sec.match(/(aluno|supervisor|estagio|estágio|Criterio|PeriodoAvaliacao|TokenSupervisor|RegraGeracaoPdf)/gi) || [];
    if (matches.length > 0) {
        console.log(`${id}: ${matches.length} matches [${[...new Set(matches)].join(', ')}]`);
    }
});
