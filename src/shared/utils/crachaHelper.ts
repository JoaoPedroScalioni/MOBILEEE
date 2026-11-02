import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface DadosCracha {
  nome: string;
  cracha: string;
  cpf: string;
  diariaFormatada?: string;
}

export function gerarHtmlCracha(dados: DadosCracha): string {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dados.cracha)}`;
  const cpfFormatado = dados.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Crachá - ${dados.nome}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 20mm;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: #ffffff;
        color: #0f172a;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .badge-container {
        width: 320px;
        border: 2px solid #2d6a4f;
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        background: #ffffff;
      }
      .hole {
        width: 44px;
        height: 10px;
        background: #cbd5e1;
        border-radius: 5px;
        margin: 0 auto 16px auto;
      }
      .farm {
        font-size: 11px;
        font-weight: 800;
        color: #2d6a4f;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }
      .title {
        font-size: 17px;
        font-weight: 800;
        color: #1e293b;
        margin: 4px 0 16px 0;
      }
      .qr-box {
        background: #f8fafc;
        border: 2px dashed #94a3b8;
        border-radius: 12px;
        padding: 10px;
        display: inline-block;
        margin-bottom: 14px;
      }
      .qr-img {
        width: 180px;
        height: 180px;
        display: block;
      }
      .code {
        font-family: monospace;
        font-size: 20px;
        font-weight: 800;
        background: #f1f5f9;
        padding: 6px 16px;
        border-radius: 8px;
        display: inline-block;
        margin-bottom: 10px;
        color: #0f172a;
        border: 1px solid #cbd5e1;
      }
      .worker-name {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 4px;
      }
      .meta {
        font-size: 12.5px;
        color: #64748b;
      }
      .footer-note {
        font-size: 10px;
        color: #94a3b8;
        margin-top: 14px;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="badge-container">
      <div class="hole"></div>
      <div class="farm">Fazenda SafraCafé</div>
      <div class="title">CRACHÁ DE IDENTIFICAÇÃO</div>
      <div class="qr-box">
        <img class="qr-img" src="${qrUrl}" alt="QR Code ${dados.cracha}" />
      </div>
      <div>
        <div class="code">${dados.cracha}</div>
      </div>
      <div class="worker-name">${dados.nome}</div>
      <div class="meta">CPF: ${cpfFormatado}${dados.diariaFormatada ? ' · Diária: ' + dados.diariaFormatada : ''}</div>
      <div class="footer-note">Sistema SafraCafé Mobile · Válido para Apontamento</div>
    </div>
  </body>
</html>
  `;
}

export async function imprimirCracha(dados: DadosCracha): Promise<void> {
  const html = gerarHtmlCracha(dados);
  await Print.printAsync({ html });
}

export async function compartilharCrachaPDF(dados: DadosCracha): Promise<void> {
  const html = gerarHtmlCracha(dados);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Crachá ${dados.nome} (${dados.cracha})`,
    });
  }
}

