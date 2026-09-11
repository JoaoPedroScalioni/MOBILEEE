import * as Crypto from "expo-crypto";
import { Session } from "../domain/entities/Session";
import { User } from "../domain/entities/User";
import { AuthGateway, CredenciaisAuth } from "../domain/gateways/AuthGateway";

const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;

interface ContaArmazenada {
    user: User;
    password: string;
}

export class InMemoryAuthGateway implements AuthGateway {
    private readonly contas = new Map<string, ContaArmazenada>();
    private readonly ativas = new Set<string>();
    private static instance: InMemoryAuthGateway;

    private constructor() {
        this.semearContaDemo();
    }

    public static getInstance(): InMemoryAuthGateway {
        if (!InMemoryAuthGateway.instance) {
            InMemoryAuthGateway.instance = new InMemoryAuthGateway();
        }
        return InMemoryAuthGateway.instance;
    }

    private semearContaDemo(): void {
        const user = new User(
            Crypto.randomUUID(),
            "Pesquisador CEFET",
            "pesquisador@ecofield.app",
        );
        this.contas.set(user.email, { user, password: "123456" });
    }

    async signIn(credentials: CredenciaisAuth): Promise<Session> {
        const conta = this.contas.get(credentials.email);
        if (!conta || conta.password !== credentials.password) {
            throw new Error("Credenciais inválidas");
        }
        const session = new Session(
            Crypto.randomUUID(),
            conta.user,
            Date.now() + DURACAO_SESSAO_MS,
        );
        this.ativas.add(conta.user.id);
        return session;
    }

    async signUp(name: string, email: string, password: string): Promise<Session> {
        if (this.contas.has(email)) {
            throw new Error("E-mail já cadastrado");
        }
        const user = new User(Crypto.randomUUID(), name, email);
        this.contas.set(email, { user, password });
        const session = new Session(Crypto.randomUUID(), user, Date.now() + DURACAO_SESSAO_MS);
        this.ativas.add(user.id);
        return session;
    }

    async signOut(): Promise<void> {
        this.ativas.clear();
    }
}