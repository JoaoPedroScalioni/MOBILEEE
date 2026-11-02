import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  compartilharCrachaPDF,
  DadosCracha,
  gerarHtmlCracha,
  imprimirCracha,
} from '../../src/shared/utils/crachaHelper';

jest.mock('expo-print', () => ({
  printAsync: jest.fn().mockResolvedValue(undefined),
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///tmp/cracha.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('crachaHelper', () => {
  const dadosMock: DadosCracha = {
    nome: 'José da Silva',
    cracha: 'TRAB-001',
    cpf: '52998224725',
    diariaFormatada: 'R$ 60,00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarHtmlCracha', () => {
    it('deve gerar o template HTML com os dados do colhedor e o QR Code correspondente', () => {
      const html = gerarHtmlCracha(dadosMock);

      expect(html).toContain('José da Silva');
      expect(html).toContain('TRAB-001');
      expect(html).toContain('529.982.247-25');
      expect(html).toContain('R$ 60,00');
      expect(html).toContain('data=TRAB-001');
      expect(html).toContain('Fazenda SafraCafé');
    });

    it('deve gerar o template HTML corretamente mesmo sem diariaFormatada', () => {
      const dadosSemDiaria: DadosCracha = {
        nome: 'Maria de Souza',
        cracha: 'TRAB-002',
        cpf: '11144477735',
      };
      const html = gerarHtmlCracha(dadosSemDiaria);

      expect(html).toContain('Maria de Souza');
      expect(html).toContain('TRAB-002');
      expect(html).toContain('111.444.777-35');
      expect(html).not.toContain('Diária:');
    });
  });

  describe('imprimirCracha', () => {
    it('deve invocar Print.printAsync passando o HTML gerado', async () => {
      await imprimirCracha(dadosMock);

      expect(Print.printAsync).toHaveBeenCalledTimes(1);
      const callArg = (Print.printAsync as jest.Mock).mock.calls[0][0];
      expect(callArg.html).toContain('TRAB-001');
    });
  });

  describe('compartilharCrachaPDF', () => {
    it('deve gerar o arquivo PDF e abrir o compartilhamento nativo', async () => {
      await compartilharCrachaPDF(dadosMock);

      expect(Print.printToFileAsync).toHaveBeenCalledTimes(1);
      expect(Sharing.isAvailableAsync).toHaveBeenCalledTimes(1);
      expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///tmp/cracha.pdf', expect.objectContaining({
        mimeType: 'application/pdf',
      }));
    });
  });
});

