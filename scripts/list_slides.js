const fs = require('fs');
const html = fs.readFileSync('apresentacao.html', 'utf8');
const sections = html.split('<section');

sections.slice(1).forEach((sec, idx) => {
    const idMatch = sec.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : `sec-${idx}`;
    const hMatch = sec.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/);
    const title = hMatch ? hMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : 'Sem título';
    const subMatch = sec.match(/<span[^>]*class="[^"]*(?:tracking-widest|text-xs|font-semibold)[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    const badge = subMatch ? subMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    console.log(`${id} | ${badge} | ${title}`);
});
