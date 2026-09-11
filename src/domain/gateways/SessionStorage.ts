import { Session } from '../entities/Session';

export interface SessionStorage {
  salvar(session: Session): Promise<void>;
  carregar(): Promise<Session | null>;
  limpar(): Promise<void>;
}