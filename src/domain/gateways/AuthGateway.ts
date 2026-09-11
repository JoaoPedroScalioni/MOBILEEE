import { Session } from '../entities/Session';

export interface CredenciaisAuth {
  email: string;
  password: string;
}

export interface AuthGateway {
  signIn(credentials: CredenciaisAuth): Promise<Session>;
  signUp(name: string, email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
}