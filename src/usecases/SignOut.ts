import { AuthGateway } from '../domain/gateways/AuthGateway';
import { SessionStorage } from '../domain/gateways/SessionStorage';

export class SignOut {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly sessionStorage: SessionStorage,
  ) {}

  async execute(): Promise<void> {
    await this.authGateway.signOut();
    await this.sessionStorage.limpar();
  }
}