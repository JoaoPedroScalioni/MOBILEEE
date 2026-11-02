const url = 'https://ruujrkumwobhuzmwsqrp.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dWpya3Vtd29iaHV6bXdzcXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTk4MzIsImV4cCI6MjEwODY5NTgzMn0.junSNukDA_AGJDOOZQvYc151pLHirzke3co3mSnHaMA';

async function clearMockData() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  };

  console.log('--- Limpando dados de teste do Supabase ---');

  // 1. Limpar Apontamentos de teste
  const rApt = await fetch(`${url}/rest/v1/apontamentos?id=in.(apt-001,apt-002,apt-003)`, {
    method: 'DELETE',
    headers
  });
  console.log('Apontamentos teste excluídos:', rApt.status);

  // 2. Limpar Despesas de teste
  const rDesp = await fetch(`${url}/rest/v1/despesas?id=in.(desp-001,desp-002)`, {
    method: 'DELETE',
    headers
  });
  console.log('Despesas teste excluídas:', rDesp.status);

  // 3. Limpar Trabalhadores de teste
  const rTrab = await fetch(`${url}/rest/v1/trabalhadores?id=in.(trab-001,trab-002,trab-003)`, {
    method: 'DELETE',
    headers
  });
  console.log('Trabalhadores teste excluídos:', rTrab.status);

  // 4. Limpar fotos de teste do bucket
  const rStorage = await fetch(`${url}/storage/v1/object/recibos`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prefixes: ['comprovantes/recibo_combustivel.jpg', 'comprovantes/recibo_ferramentas.jpg']
    })
  });
  console.log('Fotos de teste removidas do Storage:', rStorage.status);
}

clearMockData();

