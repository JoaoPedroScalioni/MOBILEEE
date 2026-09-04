# Contexto do Projeto — EcoField

## Visão Geral
Aplicativo mobile de campo chamado **EcoField**, construído com **React Native + Expo Router v54**.  
Permite registrar observações geocodificadas com foto (câmera) e GPS, listar as observações salvas e visualizá-las no mapa.

## Stack Tecnológica
- **Runtime:** React Native 0.81 / React 19
- **Roteamento:** Expo Router v6 (file-based, layouts `(drawer)` + `(tabs)`)
- **Linguagem:** TypeScript 5.9
- **Testes:** Jest 29 + jest-expo + @testing-library/react-native
- **Crypto:** expo-crypto (UUID v4)
- **Localização:** expo-location
- **Câmera:** expo-camera

---

## Arquitetura: Clean Architecture + DDD

O projeto separa responsabilidades em camadas independentes. A pasta `src/` não depende do React Native — pode ser reutilizada em qualquer runtime.

```
src/
  domain/
    entities/          ← Entidades de domínio (regras de negócio)
    value-objects/     ← Objetos de valor (imutáveis, definidos por seus dados)
    repositories/      ← Interfaces (contratos) dos repositórios
  infra/               ← Implementações concretas dos repositórios
  usecases/            ← Casos de uso da aplicação (orquestram domínio + infra)
  fectorie/            ← Container de injeção de dependências (DI)
```

### Camada de Domínio (`src/domain/`)

#### Value Object: `Coordinates`
- Propriedades: `latitude: number`, `longitude: number` (ambas `readonly`)
- Validação: `latitude` ∈ [-90, 90] | `longitude` ∈ [-180, 180]
- Lança `Error('Latitude inválida')` ou `Error('Longitude inválida')` se violado

#### Entidade: `Observation`
- Propriedades: `id: string` (readonly), `coordinates: Coordinates` (readonly), `photo: string`
- Construtor chama `this.validate()` automaticamente
- Validação: `photo` deve existir e conter `'://'` (URI válida de arquivo ou rede)
- Método público: `updatePhoto(photo: string): void` — revalida após troca
- Lança `Error('Foto inválida')` se violado

#### Interface: `ObservationRepository`
```ts
save(observation: Observation): Promise<void>
findById(id: string): Promise<Observation | null>
findAll(): Promise<Observation[]>
```

### Camada de Infraestrutura (`src/infra/`)

#### `InMemoryObservationRepository`
- `implements ObservationRepository`
- Armazena dados em `private observations: Observation[] = []`
- **Padrão Singleton:** `private constructor()` + `private static instance` + `public static getInstance()`
- `findAll()` retorna `[...this.observations]` (cópia, não referência)

### Casos de Uso (`src/usecases/`)

#### `RegisterObservation`
- Input DTO: `{ latitude, longitude, photo }`
- Fluxo: cria `Coordinates` → cria `Observation` com `Crypto.randomUUID()` → chama `repository.save()`
- Injeção de dependência via construtor

#### `ListObservations`
- Sem input
- Delega para `repository.findAll()`

### Container DI (`src/fectorie/container.ts`)
- Singleton que instancia `InMemoryObservationRepository`, `RegisterObservation` e `ListObservations`
- Exporta `container` já instanciado — as telas importam diretamente

---

## Estrutura de Telas (`app/`)

```
app/
  (drawer)/
    _layout.tsx          ← Drawer navigation
    hellopage.tsx
    (tabs)/
      _layout.tsx        ← Tab navigation (câmera, lista, mapa)
      index.tsx          ← Câmera + GPS → RegisterObservation
      list.tsx           ← FlatList → ListObservations
      maps.tsx           ← Mapa (react-native-maps)
  index.tsx              ← Redirect / splash
  modal.tsx
  _layout.tsx            ← Root layout
```

---

## Padrões e Convenções

- **Sempre use o container** (`import { container } from '@/src/fectorie/container'`) nas telas — nunca instancie casos de uso diretamente nas telas.
- **Value Objects são imutáveis** — jamais altere suas propriedades após criação.
- **Entidades se auto-validam** no construtor — nunca crie uma entidade com dados inválidos.
- **Repositórios são contratos** — a infra pode ser trocada (SQLite, Firebase) sem tocar no domínio.
- Nomenclatura de testes: `describe("NomeDaEntidade", () => { it("deve...", ...) })`
- Helpers de teste: crie funções `make*` (ex: `makeCoords()`) para evitar repetição nos testes.

---

## Referência de Documentação
- Expo v54 docs: https://docs.expo.dev/versions/v54.0.0/
