const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id.trim()) {
      throw new Error('Id de usuário inválido');
    }
    if (!this.name.trim()) {
      throw new Error('Nome de usuário inválido');
    }
    if (!EMAIL_REGEX.test(this.email)) {
      throw new Error('E-mail inválido');
    }
  }
}