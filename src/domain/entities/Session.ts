import { User } from './User';

export class Session {
  constructor(
    public token: string,
    public user: User,
    public expiresAt: number,
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

  atualizarToken(token: string): void {
    this.token = token;
    this.validate();
  }

  isValid(agora: number = Date.now()): boolean {
    return this.expiresAt > agora;
  }
}