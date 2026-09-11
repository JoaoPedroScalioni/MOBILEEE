import { Session } from '../domain/entities/Session';
import { SessionStorage } from '../domain/gateways/SessionStorage';

export class RestoreSession {
  constructor(private readonly sessionStorage: SessionStorage) {}

  async execute(): Promise<Session | null> {
    const session = await this.sessionStorage.carregar();
    if (session && session.isValid()) {
      return session;
    }
    return null;
  }
}