import { Trabalhador } from '../../domain/entities/Trabalhador';
import { TrabalhadorRepository } from '../../domain/repositories/TrabalhadorRepository';
import { ValorMonetario } from '../../domain/value-objects/ValorMonetario';
import { DatabaseClient } from './DatabaseClient';

export class SqliteTrabalhadorRepository implements TrabalhadorRepository {
  private static instance: SqliteTrabalhadorRepository;
  private readonly db: DatabaseClient;

  private constructor() {
    this.db = DatabaseClient.getInstance();
  }

  public static getInstance(): SqliteTrabalhadorRepository {
    if (!SqliteTrabalhadorRepository.instance) {
      SqliteTrabalhadorRepository.instance = new SqliteTrabalhadorRepository();
    }
    return SqliteTrabalhadorRepository.instance;
  }

  async save(trabalhador: Trabalhador): Promise<void> {
    const agora = Date.now();
    const sql = `
      INSERT INTO trabalhadores (id, nome, cpf, cracha, diaria, updated_at, deleted_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending')
    `;
    // Se já existir, faz update
    const existente = await this.findById(trabalhador.id);
    if (existente) {
      await this.db.run(
        `UPDATE trabalhadores
         SET nome = ?, cpf = ?, cracha = ?, diaria = ?, updated_at = ?, sync_status = 'pending'
         WHERE id = ?`,
        [
          trabalhador.nome,
          trabalhador.cpf,
          trabalhador.cracha,
          trabalhador.diaria.valor,
          agora,
          trabalhador.id,
        ]
      );
    } else {
      await this.db.run(sql, [
        trabalhador.id,
        trabalhador.nome,
        trabalhador.cpf,
        trabalhador.cracha,
        trabalhador.diaria.valor,
        agora,
        null,
        'pending',
      ]);
    }
  }

  async findById(id: string): Promise<Trabalhador | null> {
    const row = await this.db.getFirst(
      'SELECT * FROM trabalhadores WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (!row) return null;
    return this.mapRow(row);
  }

  async findByCracha(cracha: string): Promise<Trabalhador | null> {
    const row = await this.db.getFirst(
      'SELECT * FROM trabalhadores WHERE LOWER(cracha) = LOWER(?) AND deleted_at IS NULL',
      [cracha.trim()]
    );
    if (!row) return null;
    return this.mapRow(row);
  }

  async findAll(): Promise<Trabalhador[]> {
    const rows = await this.db.getAll(
      'SELECT * FROM trabalhadores WHERE deleted_at IS NULL ORDER BY nome ASC'
    );
    return rows.map((r) => this.mapRow(r));
  }

  async delete(id: string): Promise<void> {
    const agora = Date.now();
    await this.db.run(
      'UPDATE trabalhadores SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [agora, agora, id]
    );
  }

  private mapRow(row: any): Trabalhador {
    return new Trabalhador(
      row.id,
      row.nome,
      row.cpf,
      row.cracha,
      new ValorMonetario(Number(row.diaria))
    );
  }
}
