import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Session } from '../../domain/entities/Session';
import { User } from '../../domain/entities/User';
import { SessionStorage } from '../../domain/gateways/SessionStorage';
import { container } from '../../factory/container';
import { AutenticarUsuarioUseCase } from '../../usecases/AutenticarUsuarioUseCase';
import { RestoreSession } from '../../usecases/RestoreSession';
import { SignOut } from '../../usecases/SignOut';

export type PapelUsuario = 'aluno' | 'orientador' | 'coordenador';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  papel: PapelUsuario;
  status: AuthStatus;
  login: (email: string, password: string, papel?: PapelUsuario) => Promise<void>;
  logout: () => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
  autenticarUseCase?: AutenticarUsuarioUseCase;
  restoreSessionUseCase?: RestoreSession;
  signOutUseCase?: SignOut;
  sessionStorage?: SessionStorage;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  autenticarUseCase,
  restoreSessionUseCase,
  signOutUseCase,
  sessionStorage,
}: AuthProviderProps) {
  const auth = autenticarUseCase ?? container.autenticarUsuarioUseCase;
  const restore = restoreSessionUseCase ?? container.restoreSession;
  const clear = signOutUseCase ?? container.signOut;
  const storage = sessionStorage ?? container.sessionStorage;

  const [session, setSession] = useState<Session | null>(null);
  const [papel, setPapel] = useState<PapelUsuario>('aluno');
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;
    restore
      .execute()
      .then((s) => {
        if (!active) return;
        setSession(s);
        setStatus(s ? 'authenticated' : 'unauthenticated');
      })
      .catch(() => {
        if (active) {
          setSession(null);
          setStatus('unauthenticated');
        }
      });

    return () => {
      active = false;
    };
  }, [restore]);

  const login = useCallback(
    async (email: string, password: string, papelEscolhido: PapelUsuario = 'aluno') => {
      const s = await auth.execute({ email, password });
      await storage.salvar(s);
      setSession(s);
      setPapel(papelEscolhido);
      setStatus('authenticated');
    },
    [auth, storage]
  );

  const logout = useCallback(async () => {
    await clear.execute();
    setSession(null);
    setStatus('unauthenticated');
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      papel,
      status,
      login,
      logout,
    }),
    [session, papel, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  return context;
}
