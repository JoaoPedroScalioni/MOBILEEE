import { SupabaseSyncGateway } from '../../src/infra/supabase/SupabaseSyncGateway';
import { SupabaseClientManager } from '../../src/infra/supabase/SupabaseClient';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';

describe('SupabaseSyncGateway (06/nov — Sincronização SQLite <-> Supabase Online)', () => {
  let mockSupabaseClient: any;
  let mockStorageGateway: any;
  let mockDb: any;
  let clientManager: SupabaseClientManager;
  let syncGateway: SupabaseSyncGateway;

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };

    mockStorageGateway = {
      uploadFile: jest.fn().mockResolvedValue({
        path: 'comprovantes/desp-123.jpg',
        publicUrl: 'https://xyzcompany.supabase.co/storage/v1/object/public/recibos/comprovantes/desp-123.jpg',
      }),
      getPublicUrl: jest.fn(),
    };

    mockDb = {
      getFirst: jest.fn().mockResolvedValue({
        id: 'trab-100',
        nome: 'Antônio Ferreira',
        cpf: '12345678901',
        cracha: 'CRACHA-100',
        diaria: 65.0,
        updated_at: Date.now(),
      }),
    };

    clientManager = SupabaseClientManager.getInstance();
    clientManager.setClient(mockSupabaseClient);
    syncGateway = new SupabaseSyncGateway(clientManager, mockStorageGateway as any, mockDb as any);
  });

  it('deve sincronizar trabalhador da fila outbox com o Supabase online', async () => {
    const agora = Date.now();
    const item = new SyncQueueItem(
      'sync-1',
      'trabalhadores',
      'trab-100',
      'INSERT',
      agora,
      agora
    );

    const result = await syncGateway.push(item);
    expect(result.serverUpdatedAt).toBeDefined();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('trabalhadores');
  });

  it('deve fazer upload de foto de recibo para o Bucket S3 antes de gravar despesa no Supabase', async () => {
    const agora = Date.now();
    mockDb.getFirst.mockResolvedValue({
      id: 'desp-123',
      descricao: 'Óleo 2T Motosserra',
      valor: 140.0,
      categoria: 'Combustível',
      latitude: -21.25,
      longitude: -44.99,
      foto_uri: 'file:///data/user/0/cache/recibo_temp.jpg',
      updated_at: agora,
    });

    const item = new SyncQueueItem(
      'sync-2',
      'despesas',
      'desp-123',
      'INSERT',
      agora,
      agora
    );

    const result = await syncGateway.push(item);
    expect(result.serverUpdatedAt).toBeDefined();
    expect(mockStorageGateway.uploadFile).toHaveBeenCalledWith(
      'file:///data/user/0/cache/recibo_temp.jpg',
      expect.stringContaining('comprovantes/desp-123')
    );
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('despesas');
  });

  it('deve respeitar a regra Last-Write-Wins quando o servidor tiver registro mais recente', async () => {
    const agora = Date.now();
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { updated_at: agora + 5000 },
        error: null,
      }),
    });

    const item = new SyncQueueItem(
      'sync-3',
      'apontamentos',
      'ap-123',
      'UPDATE',
      agora,
      agora
    );

    const result = await syncGateway.push(item);
    expect(result.serverUpdatedAt).toBe(agora + 5000);
  });

  it('deve propagar exclusão lógica para o Supabase', async () => {
    const agora = Date.now();
    const item = new SyncQueueItem(
      'sync-4',
      'trabalhadores',
      'trab-del-1',
      'DELETE',
      agora,
      agora
    );

    const result = await syncGateway.push(item);
    expect(result.serverUpdatedAt).toBeDefined();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('trabalhadores');
  });
});
