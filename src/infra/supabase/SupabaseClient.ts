import { createClient, SupabaseClient as Client } from '@supabase/supabase-js';
import { defaultSupabaseConfig, SupabaseConfig } from './SupabaseConfig';

/**
 * Adaptador de armazenamento seguro para tokens de autenticação do Supabase.
 * Utiliza o Keychain (iOS) e Keystore (Android) via expo-secure-store,
 * atendendo aos requisitos de ferramentas de segurança do Supabase e RNF09.
 */
export const SecureStoreAuthAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const SecureStore: any = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const SecureStore: any = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Degradação em ambiente de teste
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const SecureStore: any = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Degradação em ambiente de teste
    }
  },
};

export class SupabaseClientManager {
  private static instance: SupabaseClientManager;
  private client: Client;

  private constructor(config: SupabaseConfig = defaultSupabaseConfig) {
    this.client = createClient(config.url, config.anonKey, {
      auth: {
        storage: SecureStoreAuthAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  public static getInstance(config?: SupabaseConfig): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager(config);
    }
    return SupabaseClientManager.instance;
  }

  public getClient(): Client {
    return this.client;
  }

  /**
   * Permite reconfigurar ou injetar cliente mock em cenários de teste.
   */
  public setClient(customClient: Client): void {
    this.client = customClient;
  }
}
