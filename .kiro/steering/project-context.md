# Contexto do Projeto — SafraCafé

## Visão Geral
Aplicativo mobile chamado **SafraCafé**, construído com **React Native + Expo Router v54**.
**"Sistema Móvel Off-Line First para Gestão Operacional e Financeira da Colheita Cafeeira"**: cadastra
trabalhadores da colheita (QR Code no crachá), registra apontamentos de balaio (litros) georreferenciados,
registra despesas com foto do recibo e visualiza a lavoura no mapa com rotas — tudo offline-first.

## Stack Tecnológica
- **Runtime:** React Native 0.81 / React 19
- **Roteamento:** Expo Router v6 (file-based, layouts `(drawer)` + `(tabs)`)
- **Linguagem:** TypeScript 5.9
- **Testes:** Jest 29 + jest-expo + @testing-library/react-native
- **Crypto:** expo-crypto (UUID v4)
- **Localização:** expo-location
- **Câmera:** expo-camera (foto + QR Code do crachá)
- **Imagens:** expo-image-picker (galeria de recibo)
- **Mapas:** react-native-maps + react-native-maps-directions + react-native-google-places-autocomplete

---

## Arquitetura: Clean Architecture + DDD

O projeto separa responsabilidades em camadas independentes. A pasta `src/` não depende do React Native — pode ser reutilizada em qualquer runtime.

```
src/
  domain/
    entities/          ← Entidades de domínio (Trabalhador, Apontamento, Despesa, SyncQueueItem, User, Session)
    value-objects/     ← Objetos de valor (Coordinates, QuantidadeBalaio, ValorMonetario, SyncStatus)
    repositories/      ← Interfaces (contratos) dos repositórios
    gateways/          ← Interfaces para serviços externos (auth, sessão, rede, sync)
    services/          ← Serviços de domínio (ex.: resolução de conflitos)
  infra/               ← Implementações concretas in-memory (Singleton) — repositórios e gateways
  adapters/auth/       ← AuthContext (useAuth) + SessionStorageSecureStore (expo-secure-store)
  usecases/            ← Casos de uso da aplicação (orquestram domínio + infra)
  factory/             ← Container de injeção de dependências (DI)
```

### Camada de Domínio (`src/domain/`)

#### Value Objects
- **`Coordinates`**: `latitude` ∈ [-90, 90] | `longitude` ∈ [-180, 180]; lança `Error('Latitude inválida')` / `Error('Longitude inválida')`.
- **`QuantidadeBalaio`**: `litros` finito e > 0; lança `Error('Quantidade de balaio inválida')`.
- **`ValorMonetario`**: `valor` finito e ≥ 0; método `formatar()` → pt-BR BRL (`R$ 60,50`); lança `Error('Valor monetário inválido')`.
- **`SyncStatus`**: enum `PENDING | SYNCING | SYNCED | ERROR`.

#### Entidades
- **`Trabalhador`**: `id`, `nome`, `cpf` (`^\d{11}$`), `cracha`, `diaria: ValorMonetario`; valida id/nome/crachá vazios e CPF com 11 dígitos.
- **`Apontamento`**: `id`, `trabalhadorId`, `quantidade: QuantidadeBalaio`, `coordenadas: Coordinates`, `data` (epoch ms > 0).
- **`Despesa`**: `id`, `descricao`, `valor: ValorMonetario`, `categoria` (const `CATEGORIAS_DESPESA` = Refeição|Combustível|Insumos|Ferramentas|Transporte|Outros), `coordenadas`, `data`, `fotoUri` opcional (deve conter `'://'` se informada).
- **`SyncQueueItem`**: entidade da fila outbox (INSERT|UPDATE|DELETE) com `attempts`, `status`, `registrarTentativa/marcarSincronizado/marcarErro`.
- **`User` / `Session`**: autenticação (`Session.isValid(agora)`).

#### Interfaces de Repositório (`src/domain/repositories/`)
```ts
TrabalhadorRepository:  save / findById / findByCracha / findAll
ApontamentoRepository:  save / findById / findByTrabalhadorId / findAll
DespesaRepository:      save / findById / findAll
SyncQueueRepository:    enqueue / save / remove / findById / findPending / findAll
```

### Camada de Infraestrutura (`src/infra/`)
- `InMemoryTrabalhadorRepository` (Singleton) — seeds demo: `trab-001` José da Silva (CPF 52998224725, TRAB-001), `trab-002` Maria de Souza (CPF 11144477735, TRAB-002), diária R$ 60.
- `InMemoryApontamentoRepository`, `InMemoryDespesaRepository`, `InMemorySyncQueueRepository`, `InMemoryAuthGateway`, `InMemoryNetworkGateway`, `InMemorySyncGateway` — todos Singleton.
- `findAll()` retorna cópia (`[...itens]`), nunca a referência.

### Casos de Uso (`src/usecases/`)
- `CadastrarTrabalhador(nome, cpf, cracha, diaria)` → cria entidade + `save` + `enqueue` INSERT `'Trabalhador'`.
- `ListarTrabalhadores()` → `findAll()`.
- `RegistrarApontamento(trabalhadorId, litros, latitude, longitude)` → valida trabalhador existe (senão lança `Error('Trabalhador não encontrado')`), cria VO/entidade + `save` + `enqueue` INSERT `'Apontamento'`.
- `ListarApontamentos()` → `findAll()`.
- `RegistrarDespesa(descricao, valor, categoria, latitude, longitude, fotoUri?)` → cria entidade + `save` + `enqueue` INSERT `'Despesa'`.
- `ListarDespesas()` → `findAll()`.
- `AuthenticateUser`, `SignOut`, `RestoreSession`, `SyncPendingQueue`.
- Todos recebem repositórios/gateways **via construtor (DI)**.

### Container DI (`src/factory/container.ts`)
- Singleton que instancia os 3 repositórios in-memory + fila de sync + auth + sync e os use cases:
  `cadastrarTrabalhador`, `listarTrabalhadores`, `registrarApontamento`, `listarApontamentos`,
  `registrarDespesa`, `listarDespesas`, `authenticateUser`, `signOut`, `restoreSession`, `syncPendingQueue`.
- Exporta `container` já instanciado — as telas importam diretamente.

### Autenticação e Sessão
- `AuthenticateUser` valida credenciais via `AuthGateway` e persiste `Session` em `SessionStorage`
- Conta demo (in-memory): `pesquisador@ecofield.app` / `123456`
- `AuthContext` (`useAuth`) expõe o estado `loading | authenticated | unauthenticated` no app
- `SessionStorageSecureStore` persiste a sessão com `expo-secure-store` (chave `safracafe.session`)

### Fila de Sincronização
- `SyncQueueItem` (INSERT|UPDATE|DELETE) é enfileirado por `CadastrarTrabalhador`, `RegistrarApontamento` e `RegistrarDespesa`
- `SyncPendingQueue` drena a fila: verifica rede → envia via `SyncGateway` → aplica `SincronizacaoService`
- `SincronizacaoService.resolverConflito()` usa last-write-wins (`updatedAtLocal` vs `updatedAtRemoto`)

---

## Estrutura de Telas (`app/`)

```
app/
  (drawer)/
    _layout.tsx          ← Drawer navigation
    hellopage.tsx
    (tabs)/
      _layout.tsx        ← Tab navigation (apontamento, trabalhadores, despesas, mapas)
      index.tsx          ← Apontamento (QR crachá + litros + GPS) → RegistrarApontamento
      trabalhadores.tsx  ← Lista + modal cadastro → CadastrarTrabalhador
      despesas.tsx       ← Lista + formulário + foto recibo → RegistrarDespesa
      mapas.tsx          ← Mapa (Markers + Polyline + MapViewDirections + autocomplete)
  index.tsx              ← Login (SafraCafé) / redirect pós-auth
  modal.tsx
  _layout.tsx            ← Root layout (SafeAreaProvider + AuthProvider)
```

---

## Padrões e Convenções

- **Sempre use o container** (`import { container } from '@/src/factory/container'`) nas telas — nunca instancie casos de uso diretamente nas telas.
- **Value Objects são imutáveis** — jamais altere suas propriedades após criação.
- **Entidades se auto-validam** no construtor — nunca crie uma entidade com dados inválidos.
- **Repositórios são contratos** — a infra pode ser trocada (SQLite, Supabase) sem tocar no domínio.
- Nomenclatura de testes: `describe("NomeDaEntidade", () => { it("deve...", ...) })`
- Helpers de teste: crie funções `make*` (ex: `makeTrabalhador()`) para evitar repetição nos testes.
- Tela de Login usa `SafeAreaView` → exige `<SafeAreaProvider>` no root layout.

---

## Referência de Documentação
- Expo v54 docs: https://docs.expo.dev/versions/v54.0.0/