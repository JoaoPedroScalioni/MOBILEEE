const fs = require('fs');

const html = fs.readFileSync('c:/PROJETOMOBILE/apresentacao.html', 'utf8');

// 1. Check all href anchors
const hrefMatches = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
const idMatches = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));

console.log('Total de links de ancoras (#):', hrefMatches.length);
const missingIds = hrefMatches.filter(id => !idMatches.has(id));
console.log('Ancoras sem elemento ID correspondente:', missingIds);

// 2. Sections count and list
const sections = [...html.matchAll(/<section\s+id="([^"]+)"/g)].map(m => m[1]);
console.log('Total de sections com ID:', sections.length);
console.log('Lista de IDs de seções:', sections);

const openSections = (html.match(/<section/g) || []).length;
const closeSections = (html.match(/<\/section>/g) || []).length;
console.log('Sections: abertas =', openSections, ', fechadas =', closeSections);

const openDivs = (html.match(/<div/g) || []).length;
const closeDivs = (html.match(/<\/div>/g) || []).length;
console.log('Divs: abertas =', openDivs, ', fechadas =', closeDivs);

// 3. Check for images without src
const imgTags = html.match(/<img[^>]*>/g) || [];
console.log('Total de tags <img>:', imgTags.length);
const imgNoSrc = imgTags.filter(img => !img.includes('src='));
console.log('Imgs sem atributo src:', imgNoSrc.length);

// 4. Check all JS references in switchServiceTab and switchRntlTab
const expectedIds = [
  'panel-svc-pdf', 'panel-svc-devolucao', 'panel-svc-sync',
  'btn-svc-pdf', 'btn-svc-devolucao', 'btn-svc-sync',
  'panel-rntl-assinatura', 'panel-rntl-atividades', 'panel-rntl-historico',
  'btn-rntl-assinatura', 'btn-rntl-atividades', 'btn-rntl-historico',
  'view-apont-topo', 'view-apont-reg', 'btn-apont-topo', 'btn-apont-reg',
  'image-modal', 'modal-img', 'modal-caption'
];
const missingDomIds = expectedIds.filter(id => !idMatches.has(id));
console.log('IDs DOM necessarios para scripts que faltam:', missingDomIds);

// 5. Check checklist terms
const requiredTerms = [
  'Criterio', 'Coordenada', 'Assinatura', 'CargaHoraria',
  'StatusSincronizacao', 'StatusPeriodo', 'PeriodoAvaliacao',
  'Estagio', 'TokenSupervisor', 'RegraGeracaoPdfService',
  'RegraDevolucaoService', 'SincronizacaoService', 'PeriodoAvaliacaoRepository',
  'CameraGateway', 'LocationGateway', 'AuthGateway',
  'RegistrarAtividadesUseCase', 'AvaliarDesempenhoUseCase',
  'RealizarAutoAvaliacaoUseCase', 'AssinarRelatorioUseCase',
  'AprovarRelatorioUseCase', 'DevolverRelatorioUseCase',
  'GerarPdfUseCase', 'SincronizarFilaUseCase',
  'AutenticarUsuarioUseCase', 'AcessarViaTokenUseCase',
  'AuthContext', 'SessionStorageSecureStore', 'useAuth', 'useAtividades',
  'CameraGatewayExpo', 'AssinaturaScreen', 'AtividadesFormScreen',
  'HistoricoRelatoriosScreen', 'expo-secure-store', 'Keychain', 'Keystore',
  'Prop Drilling', 'Red-Green-Refactor', 'E2E'
];

console.log('\n--- Verificação de Termos do Checklist ---');
let missingTerms = [];
requiredTerms.forEach(term => {
  const count = (html.match(new RegExp(term, 'g')) || []).length;
  if (count === 0) {
    missingTerms.push(term);
  }
});
console.log('Termos do checklist faltantes:', missingTerms.length === 0 ? 'NENHUM (100% presentes!)' : missingTerms);
