import { Session } from '../domain/entities/Session';
import { AuthGateway, CredenciaisAuth } from '../domain/gateways/AuthGateway';
import { SessionStorage } from '../domain/gateways/SessionStorage';

export class AutenticarUsuarioUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly sessionStorage?: SessionStorage
  ) {}

  async execute(credenciais: CredenciaisAuth): Promise<Session> {
    if (!credenciais.email || !credenciais.password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    const session = await this.authGateway.signIn(credenciais);
    if (this.sessionStorage) {
      if (typeof this.sessionStorage.saveSession === 'function') {
        await this.sessionStorage.saveSession(session);
      } else {
        await this.sessionStorage.salvar(session);
      }
    }

    return session;
  }
}
