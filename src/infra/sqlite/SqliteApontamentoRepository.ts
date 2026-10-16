import { Apontamento } from '../../domain/entities/Apontamento';
import { ApontamentoRepository } from '../../domain/repositories/ApontamentoRepository';
import { Coordinates } from '../../domain/value-objects/Coordinates';
import { QuantidadeBalaio } from '../../domain/value-objects/QuantidadeBalaio';
import { DatabaseClient } from './DatabaseClient';

export class SqliteApontamentoRepository implements ApontamentoRepository {
  private static instance: SqliteApontamentoRepository;
  private readonly db: DatabaseClient;

  private constructor() {
    this.db = DatabaseClient.getInstance();
  }

  public static getInstance(): SqliteApontamentoRepository {
    if (!SqliteApontamentoRepository.instance) {
      SqliteApontamentoRepository.instance = new SqliteApontamentoRepository();
    }
    return SqliteApontamentoRepository.instance;
  }

  async save(apontamento: Apontamento): Promise<void> {
    const agora = Date.now();
    const existente = await this.findById(apontamento.id);
    if (existente) {
      await this.db.run(
        `UPDATE apontamentos
         SET trabalhador_id = ?, litros = ?, latitude = ?, longitude = ?, data = ?, updated_at = ?, sync_status = 'pending'
         WHERE id = ?`,
        [
          apontamento.trabalhadorId,
          apontamento.quantidade.litros,
          apontamento.coordenadas.latitude,
          apontamento.coordenadas.longitude,
          apontamento.data,
          agora,
          apontamento.id,
        ]
      );
    } else {
      await this.db.run(
        `INSERT INTO apontamentos (id, apontador_id, trabalhador_id, litros, latitude, longitude, data, updated_at, deleted_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending')`,
        [
          apontamento.id,
          null,
          apontamento.trabalhadorId,
          apontamento.quantidade.litros,
          apontamento.coordenadas.latitude,
          apontamento.coordenadas.longitude,
          apontamento.data,
          agora,
        ]
      );
    }
  }

  async findById(id: string): Promise<Apontamento | null> {
    const row = await this.db.getFirst(
      'SELECT * FROM apontamentos WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (!row) return null;
    return this.mapRow(row);
  }

  async findByTrabalhadorId(trabalhadorId: string): Promise<Apontamento[]> {
    const rows = await this.db.getAll(
      'SELECT * FROM apontamentos WHERE trabalhador_id = ? AND deleted_at IS NULL ORDER BY data DESC',
      [trabalhadorId]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findAll(): Promise<Apontamento[]> {
    const rows = await this.db.getAll(
      'SELECT * FROM apontamentos WHERE deleted_at IS NULL ORDER BY data DESC'
    );
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: any): Apontamento {
    return new Apontamento(
      row.id,
      row.trabalhador_id,
      new QuantidadeBalaio(Number(row.litros)),
      new Coordinates(Number(row.latitude), Number(row.longitude)),
      Number(row.data)
    );
  }
}
