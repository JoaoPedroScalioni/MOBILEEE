import { Estagio } from '../entities/Estagio';

export interface EstagioRepository {
  save(estagio: Estagio): Promise<void>;
  findById(id: string): Promise<Estagio | null>;
  findByAlunoId(alunoId: string): Promise<Estagio[]>;
  list(): Promise<Estagio[]>;
}
