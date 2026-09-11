# SafraCafé — Gestão Offline-First da Colheita Cafeeira

Aplicativo mobile **offline-first** construído com **Expo SDK 54 / React Native** para a **gestão
operacional e financeira da colheita cafeeira**: cadastro de trabalhadores (QR Code no crachá),
apontamento diário de balaios georreferenciado, registro de despesas com foto do recibo e
visualização da lavoura em mapa com rota traçada. Arquitetado com **DDD + Clean Architecture + TDD**.

Expo SDK 54 • React Native 0.81 • Expo Router v6 • TypeScript 5.9 • Jest + jest-expo + RNTL

---

## Funcionalidades Implementadas

- **Autenticação e Sessão**: login/logout com `AuthGateway` (interface no domínio, adapter em memória),
  sessão restaurada no boot e persistida com `expo-secure-store`, exposta no app inteiro via
  `AuthContext` (`useAuth`).
- **Cadastro de Trabalhadores**: CRUD de trabalhadores (nome, CPF, crachá e diária). Cada cadastro
  enfileira um `INSERT` na fila de sincronização. Seeds demo: `TRAB-001` José da Silva e
  `TRAB-002` Maria de Souza (diária R$ 60).
- **Apontamento de Balaio**: registro da produção diária em litros por trabalhador, com leitura QR
  do crachá ou seleção manual, geolocalização via `expo-location` e páginação da fila de sync.
- **Despesas**: registro de despesas (descrição, valor, categoria) com foto do recibo
  (`expo-image-picker`) e geolocalização.
- **Mapa**: `react-native-maps` com `Marker` + `Callout` dos apontamentos, `Polyline`,
  `MapViewDirections` e busca de destino com `GooglePlacesAutocomplete` (`app/(drawer)/(tabs)/mapas.tsx`).
- **Fila de Sincronização**: `SyncQueueItem` + `SyncPendingQueue` com `SincronizacaoService`
  (last-write-wins) e gateway de rede/`sync` em memória — pronto para a troca por SQLite/Supabase.

## Arquitetura

```
src/
  domain/          Entidades, Value Objects, serviços e interfaces (contratos) — puro, sem SDK
    entities/      Trabalhador, Apontamento, Despesa, SyncQueueItem, SyncStatus, Session
    value-objects/ Coordinates, QuantidadeBalaio, ValorMonetario
  usecases/        Casos de uso da aplicação (orquestram domínio via interfaces)
  infra/           Implementações concretas in-memory (Singleton) dos repositórios/gateways
  factory/         Container de Injeção de Dependência (Singleton)
  adapters/
    auth/          AuthContext (useAuth) + SessionStorageSecureStore (expo-secure-store)
```

Regras que nunca mudam:

- `domain/` nunca importa de `infra/`, `usecases/` ou de SDKs (`expo-*`, `react-native`, `supabase`).
- Use cases recebem repositórios/gateways **via construtor**.
- Repositórios-concretos e o container são **Singleton** (`private constructor` + `static instance` + `getInstance()`).
- **Value Objects** são imutáveis e se auto-validam no construtor; **entidades** também se auto-validam.

## Como rodar

```bash
npm install          # instala dependências
npx expo start -c    # inicia o Metro (QR Code para abrir no Expo Go)
```

**Conta demo (em memória):** `pesquisador@ecofield.app` / `123456`

```bash
npx jest             # roda os testes (TDD)
npm run lint         # ESLint
npx tsc --noEmit     # typecheck
```

## Testes

Suíte com **85 testes em 23 arquivos**, organizada na pirâmide:

| Camada | Exemplo | Técnica |
| :--- | :--- | :--- |
| Domínio | `Coordinates`, `QuantidadeBalaio`, `ValorMonetario`, `Trabalhador`, `Apontamento`, `Despesa`, `SyncStatus`, `SyncQueueItem`, `Session`, `SincronizacaoService` | Sem mock, puro |
| Use case | `CadastrarTrabalhador`, `RegistrarApontamento`, `RegistrarDespesa`, `AuthenticateUser`, `SyncPendingQueue` | Fakes in-memory |
| Adapter | `SessionStorageSecureStore` | `jest.mock('expo-secure-store')` |
| Tela | `LoginScreen` | RNTL + use case fake injetado no `AuthProvider` |

Documentação completa de engenharia em [`docs/documento-software-mobile.md`](docs/documento-software-mobile.md).
Slides da primeira apresentação em [`docs/apresentacao-primeira-entrega.md`](docs/apresentacao-primeira-entrega.md).