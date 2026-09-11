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
    }

    async carregar(): Promise<Session | null> {
        const raw = await SecureStore.getItemAsync(CHAVE_SESSAO);
        if (!raw) {
            return null;
        }
        const json = JSON.parse(raw) as SessionJson;
        return new Session(
            json.token,
            new User(json.user.id, json.user.name, json.user.email),
            json.expiresAt,
        );
    }

    async limpar(): Promise<void> {
        await SecureStore.deleteItemAsync(CHAVE_SESSAO);
    }
}