import { User } from './User';

export class Session {
  constructor(
    public readonly token: string,
    public readonly user: User,
    public readonly expiresAt: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.token.trim()) {
      throw new Error('Token de sessão inválido');
    }
    if (!this.user) {
      throw new Error('Usuário da sessão inválido');
    }
    if (!(this.expiresAt > 0)) {
      throw new Error('Expiração de sessão inválida');
    }
  }

  isValid(agora: number = Date.now()): boolean {
    return this.expiresAt > agora;
  }
}