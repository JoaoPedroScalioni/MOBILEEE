import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Session } from "../../domain/entities/Session";
import { SessionStorage } from "../../domain/gateways/SessionStorage";
import { AuthenticateUser } from "../../usecases/AuthenticateUser";
import { RestoreSession } from "../../usecases/RestoreSession";
import { SignOut } from "../../usecases/SignOut";
import { container } from "../../factory/container";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
    session: Session | null;
    status: AuthStatus;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
    authenticateUseCase?: AuthenticateUser;
    restoreSessionUseCase?: RestoreSession;
    signOutUseCase?: SignOut;
    sessionStorage?: SessionStorage;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
    children,
    authenticateUseCase,
    restoreSessionUseCase,
    signOutUseCase,
    sessionStorage,
}: AuthProviderProps) {
    const auth = authenticateUseCase ?? container.authenticateUser;
    const restore = restoreSessionUseCase ?? container.restoreSession;
    const clear = signOutUseCase ?? container.signOut;
    const storage = sessionStorage ?? container.sessionStorage;

    const [session, setSession] = useState<Session | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    useEffect(() => {
        let active = true;
        restore
            .execute()
            .then((s) => {
                if (!active) return;
                setSession(s);
                setStatus(s ? "authenticated" : "unauthenticated");
            })
            .catch(() => {
                if (active) {
                    setSession(null);
                    setStatus("unauthenticated");
                }
            });
        return () => {
            active = false;
        };
    }, [restore]);

    const login = useCallback(
        async (email: string, password: string) => {
            const s = await auth.execute({ email, password });
            await storage.salvar(s);
            setSession(s);
            setStatus("authenticated");
        },
        [auth, storage],
    );

    const logout = useCallback(async () => {
        await clear.execute();
        setSession(null);
        setStatus("unauthenticated");
    }, [clear]);

    const value = useMemo<AuthContextValue>(
        () => ({ session, status, login, logout }),
        [session, status, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
    }
    return context;
}