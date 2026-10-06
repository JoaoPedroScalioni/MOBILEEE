const fs = require('fs');

const html = fs.readFileSync('c:/PROJETOMOBILE/apresentacao.html', 'utf8');

// Find sections and their titles and codes
const sections = html.split('<section id=');
sections.shift(); // remove header

sections.forEach((sec, idx) => {
  const idMatch = sec.match(/^"([^"]+)"/);
  const id = idMatch ? idMatch[1] : 'unknown';
  const h2Match = sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const h2 = h2Match ? h2Match[1].replace(/<[^>]+>/g, '').trim() : '';

  const codeHeaders = [...sec.matchAll(/(?:<span|<div)[^>]*font-mono[^>]*>([^<]+(?:ts|tsx|js|app|tests|src)[^<]*)<\/(?:span|div)>/gi)].map(m => m[1].trim());

  if (codeHeaders.length > 0) {
    console.log(`\n========================================`);
    console.log(`[SLIDE: ${id}] ${h2}`);
    console.log(`Códigos exibidos:`);
    codeHeaders.forEach(ch => console.log(`  - ${ch}`));
  }
});
