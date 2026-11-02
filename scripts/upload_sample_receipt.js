const url = 'https://ruujrkumwobhuzmwsqrp.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dWpya3Vtd29iaHV6bXdzcXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTk4MzIsImV4cCI6MjEwODY5NTgzMn0.junSNukDA_AGJDOOZQvYc151pLHirzke3co3mSnHaMA';

// Buffer de um JPEG válido
const jpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const buffer = Buffer.from(jpegBase64, 'base64');

async function uploadReceipts() {
  const files = ['comprovantes/recibo_combustivel.jpg', 'comprovantes/recibo_ferramentas.jpg'];

  for (const path of files) {
    try {
      const res = await fetch(`${url}/storage/v1/object/recibos/${path}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true'
        },
        body: buffer
      });
      console.log(`Upload de ${path}: HTTP ${res.status}`);
      if (res.ok) {
        console.log(`URL Pública: ${url}/storage/v1/object/public/recibos/${path}`);
      } else {
        const text = await res.text();
        console.log(`Resposta:`, text);
      }
    } catch (err) {
      console.error(`Erro ao subir ${path}:`, err.message);
    }
  }
}

uploadReceipts();

