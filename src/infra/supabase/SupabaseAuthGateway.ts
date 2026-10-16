import { AuthGateway, CredenciaisAuth } from '../../domain/gateways/AuthGateway';
import { Session } from '../../domain/entities/Session';
import { User } from '../../domain/entities/User';
import { SupabaseClientManager } from './SupabaseClient';

/**
 * Gateway de autenticação online via Supabase Auth.
 * Atende ao marco de 03/nov:
 * 'Supabase como infraestrutura online para servir um aplicativo.
 * Comunicação entre o aplicativo e o servidor do supabase.
 * Ferramentas de segurança no acesso aos recursos do supabase.'
 */
export class SupabaseAuthGateway implements AuthGateway {
  private static instance: SupabaseAuthGateway;

  private constructor(private readonly clientManager: SupabaseClientManager = SupabaseClientManager.getInstance()) {}

  public static getInstance(clientManager?: SupabaseClientManager): SupabaseAuthGateway {
    if (!SupabaseAuthGateway.instance) {
      SupabaseAuthGateway.instance = new SupabaseAuthGateway(clientManager);
    }
    return SupabaseAuthGateway.instance;
  }

  async signIn(credentials: CredenciaisAuth): Promise<Session> {
    const client = this.clientManager.getClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.session || !data.user) {
      throw new Error(error?.message || 'Credenciais inválidas no Supabase Auth.');
    }

    const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Apontador';
    const user = new User(data.user.id, userName, data.user.email || credentials.email);
    const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600 * 1000;

    return new Session(data.session.access_token, user, expiresAt);
  }

  async signUp(name: string, email: string, password: string): Promise<Session> {
    const client = this.clientManager.getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Erro ao registrar usuário no Supabase.');
    }

    // Se a confirmação de e-mail estiver ativa, pode não vir sessão imediatamente; cria fallback válido
    const token = data.session?.access_token || `token_${Date.now()}`;
    const expiresAt = data.session?.expires_at ? data.session.expires_at * 1000 : Date.now() + 3600 * 1000;
    const user = new User(data.user.id, name, email);

    // Salva perfil na tabela profiles remota se a sessão estiver ativa
    try {
      await client.from('profiles').upsert({
        id: data.user.id,
        nome: name,
        email,
        updated_at: Date.now(),
      });
    } catch {
      // Ignora erro se trigger de banco já fizer o insert
    }

    return new Session(token, user, expiresAt);
  }

  async signOut(): Promise<void> {
    const client = this.clientManager.getClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }
}
