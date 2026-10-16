import { SupabaseStorageGateway } from '../../src/infra/supabase/SupabaseStorageGateway';
import { SupabaseClientManager } from '../../src/infra/supabase/SupabaseClient';

describe('SupabaseStorageGateway (06/nov — Bucket S3 e Armazenamento de Arquivos)', () => {
  let mockSupabaseClient: any;
  let clientManager: SupabaseClientManager;
  let storageGateway: SupabaseStorageGateway;

  beforeEach(() => {
    mockSupabaseClient = {
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'recibos/recibo_001.jpg' },
            error: null,
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://xyzcompany.supabase.co/storage/v1/object/public/recibos/recibos/recibo_001.jpg' },
          }),
        }),
      },
    };

    clientManager = SupabaseClientManager.getInstance();
    clientManager.setClient(mockSupabaseClient);
    storageGateway = SupabaseStorageGateway.getInstance(clientManager, 'recibos');
  });

  it('deve realizar upload de arquivo para o Bucket S3 e retornar o caminho e URL pública', async () => {
    const result = await storageGateway.uploadFile(
      'file:///data/user/0/recibos/recibo_001.jpg',
      'recibos/recibo_001.jpg',
      'image/jpeg'
    );

    expect(result.path).toBe('recibos/recibo_001.jpg');
    expect(result.publicUrl).toContain('https://xyzcompany.supabase.co/storage/v1/object/public/recibos');
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('recibos');
  });

  it('deve lançar erro se o bucket S3 retornar falha no upload', async () => {
    mockSupabaseClient.storage.from.mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Bucket not found or permission denied' },
      }),
      getPublicUrl: jest.fn(),
    });

    await expect(
      storageGateway.uploadFile('file:///fake/path.jpg', 'recibos/fail.jpg')
    ).rejects.toThrow('Falha no upload para o Bucket S3 (recibos): Bucket not found or permission denied');
  });

  it('deve retornar a URL pública correspondente a um arquivo do bucket', () => {
    const url = storageGateway.getPublicUrl('comprovantes/recibo_999.jpg');
    expect(url).toBeDefined();
    expect(url).toContain('recibo');
  });
});
