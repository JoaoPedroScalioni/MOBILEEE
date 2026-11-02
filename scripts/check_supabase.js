const url = 'https://ruujrkumwobhuzmwsqrp.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dWpya3Vtd29iaHV6bXdzcXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTk4MzIsImV4cCI6MjEwODY5NTgzMn0.junSNukDA_AGJDOOZQvYc151pLHirzke3co3mSnHaMA';

async function check() {
  console.log('--- Verificando Tabelas no Supabase (ruujrkumwobhuzmwsqrp) ---');
  for (const table of ['trabalhadores', 'apontamentos', 'despesas']) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      });
      const data = await res.json();
      console.log(`\nTabela: ${table} (HTTP ${res.status})`);
      if (Array.isArray(data)) {
        console.log(`Total de registros: ${data.length}`);
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log('Resposta:', data);
      }
    } catch (err) {
      console.error(`Erro ao consultar ${table}:`, err.message);
    }
  }

  console.log('\n--- Verificando Bucket S3 (recibos) no Supabase Storage ---');
  try {
    const res = await fetch(`${url}/storage/v1/bucket/recibos`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log(`Bucket recibos: HTTP ${res.status}`);
    const data = await res.json();
    console.log(data);

    const listRes = await fetch(`${url}/storage/v1/object/list/recibos`, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: 'comprovantes', limit: 100 })
    });
    console.log(`Arquivos em comprovantes/: HTTP ${listRes.status}`);
    const files = await listRes.json();
    console.log(files);
  } catch (err) {
    console.error('Erro ao consultar storage:', err.message);
  }
}

check();

