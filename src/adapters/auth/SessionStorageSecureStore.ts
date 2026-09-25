import * as SecureStore from "expo-secure-store";
import { Session } from "../../domain/entities/Session";
import { User } from "../../domain/entities/User";
import { SessionStorage } from "../../domain/gateways/SessionStorage";

const CHAVE_SESSAO = "safracafe.session";

interface SessionJson {
    token: string;
    user: { id: string; name: string; email: string };
    expiresAt: number;
}

export class SessionStorageSecureStore implements SessionStorage {
    async salvar(session: Session): Promise<void> {
        try {
            const json: SessionJson = {
                token: session.token,
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                },
                expiresAt: session.expiresAt,
            };
            await SecureStore.setItemAsync(CHAVE_SESSAO, JSON.stringify(json));
        } catch {
            // Silencioso em caso de limitação de SecureStore
        }
    }

    async carregar(): Promise<Session | null> {
        try {
            const raw = await SecureStore.getItemAsync(CHAVE_SESSAO);
            if (!raw) {
                return null;
            }
            const json = JSON.parse(raw) as SessionJson;
            if (!json?.token || !json?.user?.id) {
                return null;
            }
            return new Session(
                json.token,
                new User(json.user.id, json.user.name, json.user.email),
                json.expiresAt,
            );
        } catch {
            return null;
        }
    }

    async limpar(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(CHAVE_SESSAO);
        } catch {
            // Silencioso
        }
    }

    async saveSession(session: Session): Promise<void> {
        return this.salvar(session);
    }

    async getSession(): Promise<Session | null> {
        return this.carregar();
    }

    async clearSession(): Promise<void> {
        return this.limpar();
    }
}