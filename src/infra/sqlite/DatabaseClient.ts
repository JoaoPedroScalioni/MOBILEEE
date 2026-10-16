export interface IDatabaseClient {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getAll<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirst<T = any>(sql: string, params?: any[]): Promise<T | null>;
  close(): Promise<void>;
}

export class DatabaseClient implements IDatabaseClient {
  private static instance: DatabaseClient;
  private db: any = null;
  private isMemoryFallback = false;
  private memoryTables: Map<string, any[]> = new Map();
  private initialized = false;
  private initializing = false;

  private constructor() {}

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  public async init(): Promise<void> {
    if (this.initialized || this.initializing) return;
    this.initializing = true;

    try {
      let database: any = null;
      try {
        const SQLite = await import('expo-sqlite');
        if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
          database = await SQLite.openDatabaseAsync('safracafe.db');
        } else if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
          database = SQLite.openDatabaseSync('safracafe.db');
        }
      } catch {
        database = null;
      }

      if (database) {
        this.db = database;
        this.isMemoryFallback = false;
      } else {
        this.activateFallback();
      }

      await this.exec('PRAGMA foreign_keys = ON;');
      await this.createTables();
      await this.seedTrabalhadoresSeNecessario();
    } finally {
      this.initialized = true;
      this.initializing = false;
    }
  }

  private activateFallback(): void {
    this.isMemoryFallback = true;
    if (!this.memoryTables.has('trabalhadores')) this.memoryTables.set('trabalhadores', []);
    if (!this.memoryTables.has('apontamentos')) this.memoryTables.set('apontamentos', []);
    if (!this.memoryTables.has('despesas')) this.memoryTables.set('despesas', []);
    if (!this.memoryTables.has('sync_queue')) this.memoryTables.set('sync_queue', []);
    if (!this.memoryTables.has('apontadores')) this.memoryTables.set('apontadores', []);
  }

  private async createTables(): Promise<void> {
    const ddl = `
      CREATE TABLE IF NOT EXISTS apontadores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trabalhadores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL,
        cracha TEXT NOT NULL UNIQUE,
        diaria REAL NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS apontamentos (
        id TEXT PRIMARY KEY,
        apontador_id TEXT REFERENCES apontadores(id),
        trabalhador_id TEXT NOT NULL REFERENCES trabalhadores(id),
        litros REAL NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        data INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS despesas (
        id TEXT PRIMARY KEY,
        apontador_id TEXT REFERENCES apontadores(id),
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        categoria TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        data INTEGER NOT NULL,
        foto_uri TEXT,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entidade TEXT NOT NULL,
        entidade_id TEXT NOT NULL,
        operacao TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        tentativas INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL
      );
    `;

    await this.exec(ddl);
  }

  private async seedTrabalhadoresSeNecessario(): Promise<void> {
    const existentes = await this.getAll('SELECT id FROM trabalhadores LIMIT 1');
    if (existentes.length === 0) {
      const agora = Date.now();
      await this.run(
        `INSERT INTO trabalhadores (id, nome, cpf, cracha, diaria, updated_at, deleted_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, NULL, 'synced'),
                (?, ?, ?, ?, ?, ?, NULL, 'synced')`,
        [
          'trab-001', 'José da Silva', '52998224725', 'TRAB-001', 60.0, agora,
          'trab-002', 'Maria de Souza', '11144477735', 'TRAB-002', 60.0, agora,
        ]
      );
    }
  }

  public async exec(sql: string): Promise<void> {
    if (this.isMemoryFallback) {
      return;
    }
    if (this.db) {
      if (typeof this.db.execAsync === 'function') {
        await this.db.execAsync(sql);
      } else if (typeof this.db.execSync === 'function') {
        this.db.execSync(sql);
      }
    }
  }

  public async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    if (!this.initialized && !this.initializing) {
      await this.init();
    }

    if (this.isMemoryFallback) {
      return this.handleMemoryRun(sql, params);
    }

    if (this.db) {
      if (typeof this.db.runAsync === 'function') {
        const result = await this.db.runAsync(sql, params);
        return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
      } else if (typeof this.db.runSync === 'function') {
        const result = this.db.runSync(sql, ...params);
        return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
      }
    }
    return { changes: 0, lastInsertRowId: 0 };
  }

  public async getAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.initialized && !this.initializing) {
      await this.init();
    }

    if (this.isMemoryFallback) {
      return this.handleMemoryGetAll<T>(sql, params);
    }

    if (this.db) {
      if (typeof this.db.getAllAsync === 'function') {
        return await this.db.getAllAsync(sql, params);
      } else if (typeof this.db.getAllSync === 'function') {
        return this.db.getAllSync(sql, ...params);
      }
    }
    return [];
  }

  public async getFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const list = await this.getAll<T>(sql, params);
    return list.length > 0 ? list[0] : null;
  }

  public async close(): Promise<void> {
    if (this.db && typeof this.db.closeAsync === 'function') {
      await this.db.closeAsync();
    }
    this.initialized = false;
    this.initializing = false;
  }

  public async clearAll(): Promise<void> {
    if (this.isMemoryFallback) {
      this.memoryTables.forEach((arr) => (arr.length = 0));
    } else {
      await this.exec('DELETE FROM sync_queue; DELETE FROM apontamentos; DELETE FROM despesas; DELETE FROM trabalhadores; DELETE FROM apontadores;');
    }
  }

  // --- Handlers para fallback em memória no Jest / Node ---
  private handleMemoryRun(sql: string, params: any[]): { changes: number; lastInsertRowId: number } {
    const normalized = sql.trim().toUpperCase();

    if (normalized.startsWith('INSERT INTO TRABALHADORES')) {
      const table = this.memoryTables.get('trabalhadores')!;
      if (params.length === 8) {
        const [id, nome, cpf, cracha, diaria, updated_at, deleted_at, sync_status] = params;
        const idx = table.findIndex(t => t.id === id);
        const row = { id, nome, cpf, cracha, diaria, updated_at, deleted_at, sync_status };
        if (idx >= 0) table[idx] = row; else table.push(row);
      } else if (params.length === 14 || params.length === 16) {
        table.push({
          id: params[0], nome: params[1], cpf: params[2], cracha: params[3],
          diaria: params[4], updated_at: params[5], deleted_at: null, sync_status: 'synced'
        });
        table.push({
          id: params[6], nome: params[7], cpf: params[8], cracha: params[9],
          diaria: params[10], updated_at: params[11], deleted_at: null, sync_status: 'synced'
        });
      }
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('UPDATE TRABALHADORES') || normalized.startsWith('UPDATE APONTAMENTOS') || normalized.startsWith('UPDATE DESPESAS') || normalized.startsWith('UPDATE SYNC_QUEUE')) {
      const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i);
      if (match) {
        const tableName = match[1].toLowerCase();
        const setPart = match[2];
        const table = this.memoryTables.get(tableName);
        if (table) {
          const setCols = setPart.split(',').map((s) => s.trim().split('=')[0].trim().toLowerCase());
          const id = params[params.length - 1];
          const row = table.find((t) => t.id === id);
          if (row) {
            setCols.forEach((col, idx) => {
              row[col] = params[idx];
            });
            return { changes: 1, lastInsertRowId: 1 };
          }
        }
      }
    }

    if (normalized.startsWith('DELETE FROM TRABALHADORES')) {
      const table = this.memoryTables.get('trabalhadores')!;
      const [id] = params;
      const idx = table.findIndex(t => t.id === id);
      if (idx >= 0) table.splice(idx, 1);
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('INSERT INTO APONTAMENTOS')) {
      const table = this.memoryTables.get('apontamentos')!;
      const [id, apontador_id, trabalhador_id, litros, latitude, longitude, data, updated_at] = params;
      table.push({ id, apontador_id, trabalhador_id, litros, latitude, longitude, data, updated_at, deleted_at: null, sync_status: 'pending' });
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('INSERT INTO DESPESAS')) {
      const table = this.memoryTables.get('despesas')!;
      const [id, apontador_id, descricao, valor, categoria, latitude, longitude, data, foto_uri, updated_at] = params;
      const idx = table.findIndex(d => d.id === id);
      const row = { id, apontador_id, descricao, valor, categoria, latitude, longitude, data, foto_uri, updated_at, deleted_at: null, sync_status: 'pending' };
      if (idx >= 0) table[idx] = row; else table.push(row);
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('UPDATE DESPESAS')) {
      const table = this.memoryTables.get('despesas')!;
      if (normalized.includes('DELETED_AT')) {
        const [deleted_at, updated_at, id] = params;
        const row = table.find(d => d.id === id);
        if (row) { row.deleted_at = deleted_at; row.updated_at = updated_at; }
      }
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('DELETE FROM DESPESAS')) {
      const table = this.memoryTables.get('despesas')!;
      const [id] = params;
      const idx = table.findIndex(d => d.id === id);
      if (idx >= 0) table.splice(idx, 1);
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('INSERT INTO SYNC_QUEUE')) {
      const table = this.memoryTables.get('sync_queue')!;
      const [id, entidade, entidade_id, operacao, payload, created_at, updated_at, tentativas, status] = params;
      const idx = table.findIndex(s => s.id === id);
      const row = { id, entidade, entidade_id, operacao, payload, created_at, updated_at, tentativas, status };
      if (idx >= 0) table[idx] = row; else table.push(row);
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('UPDATE SYNC_QUEUE')) {
      const table = this.memoryTables.get('sync_queue')!;
      const [tentativas, status, updated_at, id] = params;
      const row = table.find(s => s.id === id);
      if (row) { row.tentativas = tentativas; row.status = status; row.updated_at = updated_at; }
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (normalized.startsWith('DELETE FROM SYNC_QUEUE')) {
      const table = this.memoryTables.get('sync_queue')!;
      const [id] = params;
      const idx = table.findIndex(s => s.id === id);
      if (idx >= 0) table.splice(idx, 1);
      return { changes: 1, lastInsertRowId: 1 };
    }

    return { changes: 0, lastInsertRowId: 0 };
  }

  private handleMemoryGetAll<T>(sql: string, params: any[]): T[] {
    const normalized = sql.trim().toUpperCase();

    if (normalized.includes('FROM TRABALHADORES')) {
      let list = [...(this.memoryTables.get('trabalhadores') || [])];
      if (normalized.includes('DELETED_AT IS NULL')) {
        list = list.filter(t => !t.deleted_at);
      }
      if (normalized.includes('WHERE ID = ?')) {
        list = list.filter(t => t.id === params[0]);
      }
      if (normalized.includes('WHERE LOWER(CRACHA) = LOWER(?)')) {
        list = list.filter(t => t.cracha.toLowerCase() === String(params[0]).trim().toLowerCase());
      }
      return list as T[];
    }

    if (normalized.includes('FROM APONTAMENTOS')) {
      let list = [...(this.memoryTables.get('apontamentos') || [])];
      if (normalized.includes('DELETED_AT IS NULL')) {
        list = list.filter(a => !a.deleted_at);
      }
      if (normalized.includes('WHERE ID = ?')) {
        list = list.filter(a => a.id === params[0]);
      }
      if (normalized.includes('WHERE TRABALHADOR_ID = ?')) {
        list = list.filter(a => a.trabalhador_id === params[0]);
      }
      return list as T[];
    }

    if (normalized.includes('FROM DESPESAS')) {
      let list = [...(this.memoryTables.get('despesas') || [])];
      if (normalized.includes('DELETED_AT IS NULL')) {
        list = list.filter(d => !d.deleted_at);
      }
      if (normalized.includes('WHERE ID = ?')) {
        list = list.filter(d => d.id === params[0]);
      }
      return list as T[];
    }

    if (normalized.includes('FROM SYNC_QUEUE')) {
      let list = [...(this.memoryTables.get('sync_queue') || [])];
      if (normalized.includes('WHERE ID = ?')) {
        list = list.filter(s => s.id === params[0]);
      }
      if (normalized.includes("WHERE STATUS != 'SYNCED'")) {
        list = list.filter(s => s.status !== 'synced');
      }
      return list as T[];
    }

    return [];
  }
}
