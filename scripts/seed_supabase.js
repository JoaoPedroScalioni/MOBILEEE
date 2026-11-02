const url = 'https://ruujrkumwobhuzmwsqrp.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dWpya3Vtd29iaHV6bXdzcXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTk4MzIsImV4cCI6MjEwODY5NTgzMn0.junSNukDA_AGJDOOZQvYc151pLHirzke3co3mSnHaMA';

async function seed() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  const agora = Date.now();

  // 1. Trabalhadores
  const trabalhadores = [
    { id: 'trab-001', nome: 'José da Silva', cpf: '52998224725', cracha: 'TRAB-001', diaria: 65, updated_at: agora, sync_status: 'synced' },
    { id: 'trab-002', nome: 'Maria Oliveira', cpf: '12345678909', cracha: 'TRAB-002', diaria: 70, updated_at: agora, sync_status: 'synced' },
    { id: 'trab-003', nome: 'Sebastião Santos', cpf: '98765432100', cracha: 'TRAB-003', diaria: 60, updated_at: agora, sync_status: 'synced' },
  ];
  const rTrab = await fetch(`${url}/rest/v1/trabalhadores`, {
    method: 'POST',
    headers,
    body: JSON.stringify(trabalhadores)
  });
  console.log('Trabalhadores:', rTrab.status);

  // 2. Apontamentos com GPS
  const apontamentos = [
    { id: 'apt-001', trabalhador_id: 'trab-001', litros: 12.5, latitude: -21.2488, longitude: -44.9982, data: agora - 86400000, updated_at: agora, sync_status: 'synced' },
    { id: 'apt-002', trabalhador_id: 'trab-002', litros: 18.0, latitude: -21.2501, longitude: -44.9975, data: agora - 43200000, updated_at: agora, sync_status: 'synced' },
    { id: 'apt-003', trabalhador_id: 'trab-001', litros: 15.0, latitude: -21.2495, longitude: -44.9968, data: agora, updated_at: agora, sync_status: 'synced' },
  ];
  const rApt = await fetch(`${url}/rest/v1/apontamentos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(apontamentos)
  });
  console.log('Apontamentos:', rApt.status);

  // 3. Despesas com Foto de Comprovante e GPS
  const despesas = [
    {
      id: 'desp-001',
      descricao: 'Combustível Óleo 2T Motosserra',
      valor: 140.0,
      categoria: 'Combustível',
      latitude: -21.2488,
      longitude: -44.9982,
      data: agora - 86400000,
      foto_uri: `${url}/storage/v1/object/public/recibos/comprovantes/recibo_combustivel.jpg`,
      updated_at: agora,
      sync_status: 'synced'
    },
    {
      id: 'desp-002',
      descricao: 'Limas para Afiação de Ferramentas',
      valor: 65.0,
      categoria: 'Manutenção',
      latitude: -21.2505,
      longitude: -44.9960,
      data: agora,
      foto_uri: `${url}/storage/v1/object/public/recibos/comprovantes/recibo_ferramentas.jpg`,
      updated_at: agora,
      sync_status: 'synced'
    }
  ];
  const rDesp = await fetch(`${url}/rest/v1/despesas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(despesas)
  });
  console.log('Despesas:', rDesp.status);
}

seed();

