import { Session } from '../domain/entities/Session';
import { AuthGateway } from '../domain/gateways/AuthGateway';

export interface AuthenticateUserDTO {
  email: string;
  password: string;
}

export class AuthenticateUser {
  constructor(private readonly authGateway: AuthGateway) {}

  async execute(input: AuthenticateUserDTO): Promise<Session> {
    return this.authGateway.signIn(input);
  }
}