# SafraCafé — Guia Definitivo de Defesa Técnica da Prova
## Resumo Explicativo dos Códigos, Invariantes e Possíveis Perguntas da Banca

> **Projeto:** SafraCafé — Gestão Offline-First da Colheita Cafeeira  
> **Fase:** "Domínio e Interface Primeiro" (100% Mock / 91.82% Cobertura / 234 Testes / Zero I/O)  
> **Arquitetura:** Clean Architecture + Domain-Driven Design (DDD) + Test-Driven Development (TDD)

---

## 🧭 Visão Panorâmica da Apresentação
A defesa foi estruturada exatamente na ordem de engenharia do SafraCafé:
```
1. Telas Mobile (Login, Colheita/Balaios, Trabalhadores, Despesas, Mapa)
2. Checklist Sequencial de Construção (Os 8 passos)
3. Camada de Domínio Puro (Value Objects, Entidades & Agregados, Domain Services)
4. Contratos e DIP (Interfaces de Repositórios e Gateways)
5. Camada de Aplicação (Use Cases orquestrados com ciclo Red-Green-Refactor)
6. Hardware Desacoplado (Gateways e Fakes de Câmera e GPS)
7. Persistência Offline-First & Resolução de Conflitos (Last-Write-Wins)
8. Context API & Custom Hooks (Adapters sem Prop Drilling)
9. Telas RNTL (Testes com fireEvent e sem emulador físico)
10. Sessão Segura (Keychain no iOS / Keystore no Android via Expo SecureStore)
11. Comprovação de Isolamento 100% Mock
12. Métricas Consolidadas (57 Suites, 234 Testes, 91.82% Cobertura)
```

---

# 1. Slide 8: Value Objects (Objetos de Valor)

### 📄 Código em Destaque: `src/domain/value-objects/QuantidadeBalaio.ts`
```typescript
export class QuantidadeBalaio {
    constructor(public readonly litros: number) {
        this.validate(); // Auto-validação defensiva no construtor (imutável)
    }

    private validate(): void {
        // Um balaio na colheita precisa ter volume finito maior que zero
        if (!Number.isFinite(this.litros) || this.litros <= 0) {
            throw new Error('Quantidade de balaio inválida');
        }
    }
}
```

### 📄 Código Complementar: `src/domain/value-objects/ValorMonetario.ts`
```typescript
export class ValorMonetario {
    constructor(public readonly valor: number) {
        this.validate();
    }

    private validate(): void {
        if (!Number.isFinite(this.valor) || this.valor < 0) {
            throw new Error('Valor monetário inválido');
        }
    }

    public formatar(): string {
        return this.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}
```

### 🔍 Partes Mais Importantes:
1. **Auto-validação no Construtor:** Impede a existência de um balaio com litragem negativa, nula ou infinita.
2. **Imutabilidade (`readonly`):** Uma vez criado, o estado nunca é mutado. Para alterar a litragem, instancia-se um novo objeto.
3. **Formatação BRL (`formatar`):** `ValorMonetario` garante formatação nativa brasileira (ex: `R$ 60,00` para diária).
4. **Igualdade Estrutural:** Dois objetos de valor são iguais se seus atributos forem equivalentes, dispensando identificador único (`id`).

### ❓ Possíveis Perguntas da Banca e Como Responder:
- **P: "Por que QuantidadeBalaio e ValorMonetario não têm um campo `id`?"**  
  **R:** *"Porque no DDD, Value Objects são definidos puramente por seus atributos, não por identidade. Dois balaios de 60 litros ou duas diárias de R$ 60,00 são conceitualmente equivalentes sem necessidade de ID."*
- **P: "Quais outros Value Objects existem no SafraCafé?"**  
  **R:** *"Temos `Coordinates` (valida latitude [-90,90] e longitude [-180,180] para GPS da lavoura) e `SyncStatus` (controla os estados da fila offline: PENDING, SYNCED e ERROR)."*

---

# 2. Slide 9: Entidades & Agregados

### 📄 Código em Destaque: `src/domain/entities/Trabalhador.ts`
```typescript
import { ValorMonetario } from '../value-objects/ValorMonetario';

const CPF_REGEX = /^\d{11}$/;

export class Trabalhador {
    private _id: string;
    private _nome: string;
    private _cpf: string;
    private _cracha: string;
    private _diaria: ValorMonetario;

    constructor(id: string, nome: string, cpf: string, cracha: string, diaria: ValorMonetario) {
        this._id = id;
        this._nome = nome;
        this._cpf = cpf;
        this._cracha = cracha;
        this._diaria = diaria;
        this.validate(); // Invariantes verificadas no ciclo de vida
    }

    get id(): string { return this._id; }
    get nome(): string { return this._nome; }
    get cpf(): string { return this._cpf; }
    get cracha(): string { return this._cracha; }
    get diaria(): ValorMonetario { return this._diaria; }

    private validate(): void {
        if (!this._id || !this._id.trim()) throw new Error('Id de trabalhador inválido');
        if (!this._nome || !this._nome.trim()) throw new Error('Nome de trabalhador inválido');
        if (!CPF_REGEX.test(this._cpf)) throw new Error('CPF de trabalhador inválido');
        if (!this._cracha || !this._cracha.trim()) throw new Error('Código de crachá inválido');
    }
}
```

### 📄 Raiz de Agregação da Colheita: `src/domain/entities/Apontamento.ts`
```typescript
export class Apontamento {
    constructor(
        private _id: string,
        private _trabalhadorId: string,
        private _quantidade: QuantidadeBalaio,
        private _coordenadas: Coordinates,
        private _data: number
    ) {
        this.validate();
    }
    // Protege invariantes: id não-vazio, trabalhador existente e data válida
}
```

### 🔍 Partes Mais Importantes:
1. **Validação Estrita de CPF:** Expressão regular exige exatamente 11 dígitos numéricos, bloqueando cadastros corrompidos.
2. **Crachá Serializado:** Códigos como `TRAB-001` e `TRAB-002` permitem leitura óptica instantânea de QR Code no campo.
3. **Agregação de Colheita (`Apontamento`):** Conecta apanhador, volume colhido em litros, localização GPS e carimbo de tempo.
4. **Proteção Contra Estados Ilegais:** A entidade lança exceção antes de salvar caso qualquer campo viole a regra de negócio.

### ❓ Possíveis Perguntas da Banca:
- **P: "Qual a diferença conceitual entre Entidade e Value Object no SafraCafé?"**  
  **R:** *"A Entidade (`Trabalhador`, `Apontamento`) possui identidade única e ciclo de vida mutável. O Value Object (`QuantidadeBalaio`, `ValorMonetario`) é imutável e sua equivalência é puramente pelo valor que carrega."*
- **P: "Como o QR Code do crachá é validado no aplicativo?"**  
  **R:** *"O leitor óptico captura o payload do crachá e o caso de uso busca o apanhador no `TrabalhadorRepository` pelo método `findByCracha()`, preenchendo o colhedor automaticamente na tela."*

---

# 3. Slide 10: Domain Services (Serviços de Domínio)

### 📄 Código em Destaque: `src/domain/services/SincronizacaoService.ts`
```typescript
export type ConflitoResultado = 'local' | 'remoto';

export class SincronizacaoService {
  resolverConflito(updatedAtLocal: number, updatedAtRemoto: number): ConflitoResultado {
    // Resolução determinística: timestamp mais recente vence (Last-Write-Wins)
    if (updatedAtRemoto > updatedAtLocal) {
      return 'remoto';
    }
    return 'local';
  }
}
```

### 🔍 Partes Mais Importantes:
1. **Estratégia Last-Write-Wins (LWW):** Se o registro remoto possuir `updatedAt` superior ao local, a versão do servidor prevalece. Caso contrário, a alteração local é enviada.
2. **Desacoplamento de Rede:** O serviço é 100% puro e opera apenas com números (timestamps), permitindo testes unitários instantâneos sem mocks de HTTP ou banco.
3. **Prevenção de Perda de Dados na Roça:** Garante consistência determinística quando múltiplos apontadores operam offline simultaneamente.

---

# 4. Slide 11: Contratos e Interfaces (DIP)

### 📄 Códigos em Destaque: `ApontamentoRepository.ts` & `TrabalhadorRepository.ts`
```typescript
export interface ApontamentoRepository {
    save(apontamento: Apontamento): Promise<void>;
    findById(id: string): Promise<Apontamento | null>;
    findByTrabalhadorId(trabalhadorId: string): Promise<Apontamento[]>;
    findAll(): Promise<Apontamento[]>;
}

export interface TrabalhadorRepository {
    save(trabalhador: Trabalhador): Promise<void>;
    findById(id: string): Promise<Trabalhador | null>;
    findByCracha(cracha: string): Promise<Trabalhador | null>;
    findAll(): Promise<Trabalhador[]>;
    delete(id: string): Promise<void>;
}
```

### 🔍 Partes Mais Importantes:
1. **Inversão de Dependência (DIP):** O domínio dita as interfaces (`repositories/` e `gateways/`). A infraestrutura apenas implementa esses contratos.
2. **Substituição Transparente:** Na prova, usamos implementações em memória (`InMemory*Repository`). No futuro, trocam-se por SQLite/Supabase sem alterar uma linha do domínio.

---

# 5. Slide 12: Casos de Uso (Application Layer)

### 📄 Código em Destaque: `src/usecases/RegistrarApontamento.ts`
```typescript
export class RegistrarApontamento {
    constructor(
        private readonly apontamentoRepository: ApontamentoRepository,
        private readonly trabalhadorRepository: TrabalhadorRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {}

    public async execute(input: RegistrarApontamentoDTO, agora: number = Date.now()) {
        const trabalhador = await this.trabalhadorRepository.findById(input.trabalhadorId);
        if (!trabalhador) {
            throw new Error('Trabalhador não encontrado');
        }

        const coordenadas = new Coordinates(input.latitude, input.longitude);
        const quantidade = new QuantidadeBalaio(input.litros);
        const id = Crypto.randomUUID();
        const apontamento = new Apontamento(id, input.trabalhadorId, quantidade, coordenadas, agora);

        await this.apontamentoRepository.save(apontamento);

        if (this.syncQueueRepository) {
            const item = new SyncQueueItem(Crypto.randomUUID(), 'Apontamento', id, 'INSERT', agora, agora);
            await this.syncQueueRepository.enqueue(item);
        }

        return apontamento;
    }
}
```

### 🔍 Partes Mais Importantes:
1. **Injeção de Dependência pelo Construtor:** Recebe `ApontamentoRepository`, `TrabalhadorRepository` e `SyncQueueRepository`.
2. **Orquestração Completa:** Valida colhedor, instancia VOs (`Coordinates`, `QuantidadeBalaio`), persiste o apontamento e enfileira na fila outbox.
3. **Testabilidade Máxima:** Testado via ciclo Red-Green-Refactor com repositórios fakes em memória.

---

# 6. Slide 14: Persistência Offline-First

### 📄 Código em Destaque: `src/usecases/SyncPendingQueue.ts`
```typescript
export class SyncPendingQueue {
  constructor(
    private readonly syncQueueRepository: SyncQueueRepository,
    private readonly syncGateway: SyncGateway,
    private readonly networkGateway: NetworkGateway,
    private readonly sincronizacaoService: SincronizacaoService,
  ) {}

  async execute(agora: number = Date.now()): Promise<SyncResultado> {
    const pendentes = await this.syncQueueRepository.findPending();
    if (!(await this.networkGateway.isConnected())) {
      return { synchronized: 0, pending: pendentes.length, offline: true };
    }

    let synchronized = 0;
    for (const item of pendentes) {
      item.registrarTentativa(agora);
      await this.syncQueueRepository.save(item);
      try {
        const resultado = await this.syncGateway.push(item);
        const conflito = this.sincronizacaoService.resolverConflito(
          item.updatedAt,
          resultado.serverUpdatedAt ?? item.updatedAt,
        );
        if (conflito === 'remoto') continue;
        await this.syncQueueRepository.remove(item.id);
        synchronized += 1;
      } catch {
        item.marcarErro(agora);
        await this.syncQueueRepository.save(item);
      }
    }
    const restantes = await this.syncQueueRepository.findPending();
    return { synchronized, pending: restantes.length, offline: false };
  }
}
```

### 🔍 Partes Mais Importantes:
1. **Checagem de Conectividade:** Se `networkGateway.isConnected()` for falso, preserva a fila intacta e encerra sem falhas.
2. **Remoção Atômica:** O item só é removido da fila local após sucesso confirmado de push no gateway remoto.
3. **Resiliência a Erros:** Em caso de exceção de rede, chama `item.marcarErro()` com contagem de retentativas.

---

# 7. Slide 15: Context API & Custom Hooks

### 📄 Código em Destaque: `src/adapters/auth/AuthContext.tsx`
```typescript
export function AuthProvider({ children, authenticateUseCase, restoreSessionUseCase, signOutUseCase }: AuthProviderProps) {
    const auth = authenticateUseCase ?? container.authenticateUser;
    const restore = restoreSessionUseCase ?? container.restoreSession;

    const [session, setSession] = useState<Session | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    useEffect(() => {
        restore.execute().then((s) => {
            setSession(s);
            setStatus(s ? "authenticated" : "unauthenticated");
        });
    }, [restore]);
}
```

### 🔍 Partes Mais Importantes:
1. **Sem Acoplamento Reverso:** Fica restrito à camada de adaptadores (`src/adapters/auth/`). Domínio e Use Cases nunca importam React.
2. **Zero Prop Drilling:** Distribui a sessão do operador cafeeiro (`pesquisador@ecofield.app`) para qualquer tela da aplicação.

---

# 8. Slide 16: Telas e Testes RNTL

### 📄 Código em Destaque: `tests/screens/LoginScreen.test.tsx`
```typescript
describe('LoginScreen (RNTL + Fakes)', () => {
    it('faz login com sucesso usando credenciais válidas e navega', async () => {
        const { getByPlaceholderText, getByText } = await renderScreen();

        fireEvent.changeText(getByPlaceholderText('Digite seu e-mail...'), 'pesquisador@ecofield.app');
        fireEvent.changeText(getByPlaceholderText('Digite sua senha...'), '123456');
        fireEvent.press(getByText('Entrar'));

        await waitFor(() => {
            expect(router.replace).toHaveBeenCalledWith('/(drawer)/(tabs)');
        });
    });
});
```

### 🔍 Partes Mais Importantes:
1. **Isolamento de Hardware:** Simula eventos reais de clique e digitação (`fireEvent`) sem precisar de emulador Android/iOS ou cliques manuais.
2. **Injeção de Fakes no Provider:** O formulário consome use cases fakes injetados, garantindo teste determinístico que roda em milissegundos.

---

# 9. Slide 17: Sessão Segura (Expo SecureStore)

### 📄 Código em Destaque: `src/adapters/auth/SessionStorageSecureStore.ts`
```typescript
import * as SecureStore from 'expo-secure-store';

const CHAVE_SESSAO = 'safracafe.session';

export class SessionStorageSecureStore implements SessionStorage {
    async salvar(session: Session): Promise<void> {
        await SecureStore.setItemAsync(CHAVE_SESSAO, JSON.stringify(session));
    }

    async carregar(): Promise<Session | null> {
        const json = await SecureStore.getItemAsync(CHAVE_SESSAO);
        if (!json) return null;
        return JSON.parse(json);
    }

    async limpar(): Promise<void> {
        await SecureStore.deleteItemAsync(CHAVE_SESSAO);
    }
}
```

### 🔍 Partes Mais Importantes:
1. **Criptografia de Hardware:** Grava o token da sessão no Keychain (iOS) e Keystore (Android), impedindo extração de credenciais.
2. **Mock nos Testes:** Em `tests/setup.ts`, `expo-secure-store` é interceptado por um Map em memória, garantindo execução contínua no Jest.

---

# 10. Slide 20: 5 Decisões Arquiteturais Fundamentais

1. **Separação Persistência/Domínio:** Repositórios em memória com `Map<string, T>` viabilizam troca transparente por SQLite/Supabase no futuro sem tocar no domínio.
2. **Invariantes Blindadas:** Raízes de agregação (`Trabalhador`, `Apontamento`) e Value Objects (`QuantidadeBalaio`, `ValorMonetario`, `Coordinates`) impedem dados corrompidos na colheita.
3. **Autenticação Segura & Modo Campo:** Criptografia no hardware (`expo-secure-store`) com login demo rápido para operadores rurais sem internet.
4. **IoC Container Centralizado:** `container.ts` é o ponto único de injeção de dependências Singleton da aplicação.
5. **Clean Architecture Estrita:** Domínio 100% puro, sem dependências de React, Expo ou bancos físicos.
