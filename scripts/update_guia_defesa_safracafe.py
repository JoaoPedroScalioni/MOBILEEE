# -*- coding: utf-8 -*-
import os
import shutil

md_content = '''# SafraCafé — Guia Definitivo de Defesa Técnica da Prova
## Resumo Explicativo dos Códigos, Invariantes e Perguntas da Banca (100% SafraCafé)

> **Fase:** "Domínio e Interface Primeiro" (100% Mock / 91.82% Cobertura / 234 Testes / Zero I/O)  
> **Arquitetura:** Clean Architecture + Domain-Driven Design (DDD) + Test-Driven Development (TDD)

---

## 🧭 Visão Panorâmica da Apresentação
A defesa segue rigorosamente a ordem exigida pela disciplina:
```
1. Telas Mobile (Login, Apontamento, Trabalhadores, Despesas, Mapa)
2. Checklist Sequencial de Construção (Os 8 passos)
3. Camada de Domínio Puro (Value Objects, Entidades & Agregados, Domain Services)
4. Contratos e DIP (Interfaces de Repositórios e Gateways)
5. Camada de Aplicação (10 Use Cases com ciclo Red-Green-Refactor)
6. Hardware Desacoplado (Gateways e Fakes de Câmera e GPS)
7. Persistência Offline-First & Resolução de Conflitos (Fila Outbox)
8. Context API & Custom Hooks (Adapters sem Prop Drilling)
9. Telas RNTL (Testes com fireEvent e sem emulador físico)
10. Sessão Segura (Keychain no iOS / Keystore no Android)
11. Comprovação de Isolamento 100% Mock
12. Métricas Consolidadas (57 Suites, 234 Testes, 91.82% Cobertura)
```

---

# 1. Slide 8: Value Objects (Objetos de Valor)

### 📄 Código em Destaque: `src/domain/value-objects/QuantidadeBalaio.ts` e `ValorMonetario.ts`
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

### 🎯 Por que é importante ter isso?
- **Elimina Primitive Obsession:** Impede que números soltos sem significado sejam passados como litros ou diárias.
- **Auto-validação no Construtor:** Um objeto inválido nunca chega a existir em memória. Se tentar passar `litros <= 0`, estoura erro imediatamente.
- **Imutabilidade Absoluta:** O atributo é `readonly`. Não é possível alterar seu estado após instanciado.

### 📂 Onde está no nosso app?
- `src/domain/value-objects/QuantidadeBalaio.ts`
- `src/domain/value-objects/ValorMonetario.ts`
- `src/domain/value-objects/Coordinates.ts`
- `src/domain/value-objects/SyncStatus.ts`
- Testes: `tests/domain/QuantidadeBalaio.test.ts` (100% de cobertura)

### ❓ Possíveis Perguntas da Banca:
- **P:** *"Por que criar uma classe só para litros se podia ser apenas number?"*  
  **R:** *"Para garantir invariantes de domínio. Um `number` aceita -10, NaN e Infinity, o que corromperia o fechamento financeiro e de colheita. Com o Value Object `QuantidadeBalaio`, a regra de negócio vive protegida no domínio."*

---

# 2. Slide 9: Entidades e Agregados

### 📄 Código em Destaque: `src/domain/entities/Trabalhador.ts`
```typescript
import { ValorMonetario } from '../value-objects/ValorMonetario';

const CPF_REGEX = /^\\d{11}$/;

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
        this.validate();
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

### 🎯 Por que é importante ter isso?
- **Raiz de Agregação:** `Trabalhador` e `Apontamento` encapsulam e protegem as regras da lavoura.
- **Identidade Própria:** Entidades possuem `id` único serializado (TRAB-001, TRAB-002 para QR Code).

### 📂 Onde está no nosso app?
- `src/domain/entities/Trabalhador.ts`
- `src/domain/entities/Apontamento.ts`
- `src/domain/entities/Despesa.ts`
- `src/domain/entities/SyncQueueItem.ts`
- Testes: `tests/domain/Trabalhador.test.ts` e `Apontamento.test.ts`

---

# 3. Slide 10: Domain Services

### 📄 Código em Destaque: `src/domain/services/SincronizacaoService.ts`
```typescript
export type ConflitoResultado = 'local' | 'remoto';

export class SincronizacaoService {
  resolverConflito(updatedAtLocal: number, updatedAtRemoto: number): ConflitoResultado {
    // Resolução determinística no cafezal: timestamp mais recente vence (Last-Write-Wins)
    if (updatedAtRemoto > updatedAtLocal) {
      return 'remoto';
    }
    return 'local';
  }
}
```

### 🎯 Por que é importante ter isso?
- **Regras Cruzadas:** Resolução matemática de conflitos de sincronização offline-first quando dois aparelhos apontam dados da mesma lavoura sem internet simultânea.

### 📂 Onde está no nosso app?
- `src/domain/services/SincronizacaoService.ts`
- Testes: `tests/domain/SincronizacaoService.test.ts`

---

# 4. Slide 11: Contratos e Interfaces (DIP)

### 📄 Código em Destaque: `src/domain/repositories/ApontamentoRepository.ts`
```typescript
import { Apontamento } from '../entities/Apontamento';

export interface ApontamentoRepository {
    save(apontamento: Apontamento): Promise<void>;
    findById(id: string): Promise<Apontamento | null>;
    findByTrabalhadorId(trabalhadorId: string): Promise<Apontamento[]>;
    findAll(): Promise<Apontamento[]>;
}
```

### 🎯 Por que é importante ter isso?
- **Princípio da Inversão de Dependência:** O domínio dita as regras e contratos. A infraestrutura cumpre.
- **Desacoplamento de Banco:** Facilita substituir a persistência em memória por SQLite ou Supabase sem tocar no domínio.

### 📂 Onde está no nosso app?
- `src/domain/repositories/ApontamentoRepository.ts`
- `src/domain/repositories/TrabalhadorRepository.ts`
- `src/domain/repositories/DespesaRepository.ts`
- `src/domain/gateways/CameraGateway.ts` e `LocationGateway.ts`

---

# 5. Slide 12: Casos de Uso e Metodologia TDD

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
        if (!trabalhador) throw new Error('Trabalhador não encontrado');

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

### 🔄 O Ciclo Red-Green-Refactor (TDD):
1. 🔴 **RED:** Criação do teste unitário esperando a invariante (ex.: falha se trabalhador não existir). O teste falha antes da implementação (`FAIL`).
2. 🟢 **GREEN:** Código mínimo implementado no caso de uso para fazer o teste passar (`PASS`).
3. 🔵 **REFACTOR:** Extração de Value Objects, desacoplamento de injeção e outbox sem quebrar nenhum teste (234 testes verdes).

### 📂 Onde está no nosso app?
- `src/usecases/RegistrarApontamento.ts`
- `src/usecases/CadastrarTrabalhador.ts`
- `src/usecases/SyncPendingQueue.ts`
- 24 suítes em `tests/usecases/`

---

# 6. Slide 13: Hardware Desacoplado (Câmera & GPS)

### 🎯 Por que é importante ter isso?
- **Isolamento de Hardware:** A tela não chama `expo-camera` ou `expo-location` diretamente.
- **Testes Instantâneos:** `InMemoryCameraGateway` e `InMemoryLocationGateway` devolvem fotos base64 e coordenadas determinísticas em milissegundos sem acionar periféricos do aparelho.

### 📂 Onde está no nosso app?
- `src/infra/InMemoryCameraGateway.ts`
- `src/infra/InMemoryLocationGateway.ts`

---

# 7. Slide 14: Persistência Offline-First & Fila Outbox

### 🎯 Por que é importante ter isso?
- **Resiliência no Campo:** A conexão de rede é tratada como detalhe intermitente. Os registros são salvos imediatamente na fila local e sincronizados via `SyncPendingQueue` quando houver rede.

### 📂 Onde está no nosso app?
- `src/usecases/SyncPendingQueue.ts`
- `src/domain/entities/SyncQueueItem.ts`

---

# 8. Slide 15: Context API & Custom Hooks

### 🎯 Por que é importante ter isso?
- **Sem Prop Drilling:** `AuthContext.tsx` disponibiliza o operador autenticado (`pesquisador@ecofield.app`) para qualquer tela.
- **Camada de Adapters:** O domínio nunca importa React ou hooks. Os hooks (`useAuth`, `useApontamentos`) conectam os Use Cases ao ciclo de vida das telas.

### 📂 Onde está no nosso app?
- `src/adapters/auth/AuthContext.tsx`
- `src/adapters/hooks/useAuth.ts`
- `src/adapters/hooks/useApontamentos.ts`

---

# 9. Slide 16: Telas e Testes RNTL

### 🎯 Por que é importante ter isso?
- **Boundary Seguro:** Testa a entrada de dados do usuário (toques, digitação de formulário) usando `@testing-library/react-native` sem emulador físico.

### 📂 Onde está no nosso app?
- `tests/screens/LoginScreen.test.tsx` (100% Pass)
- Telas em `app/(drawer)/(tabs)/`

---

# 10. Slide 17: Sessão Segura (Expo SecureStore)

### 🎯 Por que é importante ter isso?
- **Segurança de Chaves:** Criptografa tokens no Keychain do iOS e Keystore do Android sob a chave `safracafe.session`. Nos testes, é 100% interceptado em memória RAM.

### 📂 Onde está no nosso app?
- `src/adapters/auth/SessionStorageSecureStore.ts`
- `tests/adapters/SessionStorageSecureStore.test.ts`

---

# 11. Slide 18: Isolamento Total (100% Mock)

- **Zero SQLite:** Sem banco físico em disco.
- **Zero Supabase:** Sem latência de requisições externas.
- **Zero Hardware:** Periféricos simulados por gateways.
- **~5.9 Segundos:** Execução relâmpago de toda a suíte.

---

# 12. Slide 19: Métricas Consolidadas

| Camada / Diretório | Suítes | % Linhas |
| :--- | :---: | :---: |
| 1. Value Objects (`domain/value-objects`) | 10 | 98.96% |
| 2. Entities & Aggregates (`domain/entities`) | 8 | 89.37% |
| 3. Domain Services (`domain/services`) | 3 | 90.32% |
| 4. Use Cases (`src/usecases`) | 24 | 95.69% |
| 5. Repositórios & Gateways Fake (`infra`) | 2 | 96.96% |
| 6. Context API & Sessão Segura (`adapters`) | 6 | 83.33% |
| 7. Telas RNTL (`adapters/screens`) | 4 | 82.85% |
| **TOTAL GERAL (All files)** | **57 Suites / 234 Testes** | **91.82%** |

---

# 13. Slide 20: 5 Decisões Arquiteturais Fundamentais
1. **Separação Persistência/Domínio:** Trocar memória por SQLite ou Supabase não toca no domínio.
2. **Invariantes Blindadas:** VOs e Entidades barram dados ilegais na colheita.
3. **Autenticação Segura & Modo Campo:** Sessão cifrada via hardware para operadores rurais.
4. **IoC Container Centralizado:** `src/factory/container.ts` é o ponto único de injeção de dependências.
5. **Clean Architecture Estrita:** Domínio agnóstico de UI; interface consome use cases através de adapters.
'''

with open(r'c:\PROJETOMOBILE\docs\GUIA_DEFESA_CODIGOS.md', 'w', encoding='utf-8') as f:
    f.write(md_content)

print("GUIA_DEFESA_CODIGOS.md updated with 100% SafraCafe content!")
