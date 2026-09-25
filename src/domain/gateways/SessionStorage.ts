import { Session } from '../entities/Session';

export interface SessionStorage {
  salvar(session: Session): Promise<void>;
  carregar(): Promise<Session | null>;
  limpar(): Promise<void>;
  saveSession?(session: Session): Promise<void>;
  getSession?(): Promise<Session | null>;
  clearSession?(): Promise<void>;
}