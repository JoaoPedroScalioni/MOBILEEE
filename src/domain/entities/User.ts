const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
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

  atualizarNome(nome: string): void {
    this.name = nome;
    this.validate();
  }

  atualizarEmail(email: string): void {
    this.email = email;
    this.validate();
  }
}