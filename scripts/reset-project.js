const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appDir = path.join(root, 'app');
const exampleDir = path.join(root, 'app-example');
const assetsDir = path.join(root, 'assets');
const exampleAssetsDir = path.join(root, 'app-example', 'assets');

if (fs.existsSync(exampleDir)) {
  console.error('app-example/ já existe. Apague-o antes de rodar o reset.');
  process.exit(1);
}

if (!fs.existsSync(appDir)) {
  console.error('Pasta app/ não encontrada. Nada a resetar.');
  process.exit(1);
}

fs.renameSync(appDir, exampleDir);
fs.mkdirSync(appDir, { recursive: true });
console.log('app/ movido para app-example/ e pasta app/ recriada.');

if (fs.existsSync(assetsDir) && !fs.existsSync(exampleAssetsDir)) {
  fs.mkdirSync(exampleAssetsDir, { recursive: true });
  for (const entry of fs.readdirSync(assetsDir)) {
    fs.renameSync(path.join(assetsDir, entry), path.join(exampleAssetsDir, entry));
  }
  console.log('assets/ movidos para app-example/assets/.');
}

console.log('Reset concluído. Edite os arquivos dentro de app/ para começar.');