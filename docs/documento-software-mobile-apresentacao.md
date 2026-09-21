# SafraCafé — Especificação Técnica de Software Mobile (Versão Apresentação)

> **Projeto:** SafraCafé — Gestão e Controle de Colheita de Café no Eito da Lavoura  
> **Objetivo deste documento:** Versão executiva e enxuta para apresentação oral e defesa perante a banca acadêmica.  
> **Stack:** Expo SDK 57 (Expo Go / Dev Client) · SQLite (Drizzle ORM) · Supabase (PostgreSQL, Auth, Storage) · GPS & Câmera Nativos.  
> **Arquitetura:** Clean Architecture + Domain-Driven Design (DDD) + Test-Driven Development (TDD). 100% Offline-First.

---

## 🎯 1. Visão Geral & Contexto da Solução

* **Problema:** A apuração da colheita de café no eito ocorre em talhões rurais sem qualquer conectividade de internet celular, gerando perda de dados, fraudes de volume e lentidão no fechamento das diárias.
* **Solução:** Aplicativo mobile **100% Offline-First** operado pelo **Apontador**, que identifica colhedores via leitura óptica de crachás (QR Code), afere balaios (litros) com **fixação compulsória de GPS sob demanda** e enfileira lançamentos na base local (Outbox Pattern) para sincronização automática com a nuvem (Supabase BaaS).
* **Atores Centrais:**
  * **Apontador:** Operador de campo autenticado.
  * **Trabalhador:** Colhedor portador do crachá físico (QR Code).
  * **Hardware Nativo:** Sensores de Câmera e GPS do dispositivo móvel.
  * **Supabase (BaaS):** PostgreSQL em nuvem, Auth e Storage de recibos.
  * **SyncEngine:** Worker assíncrono orientado a eventos de conectividade (`NetInfo`).

---

## 📋 2. Requisitos-Chave do Sistema (RF & RNF)

### 2.1 Requisitos Funcionais Essenciais (RF)

| ID | Requisito Funcional | Ator/Origem | Regra Crítica de Negócio |
|:---|:---|:---|:---|
| **RF01/02** | Cadastrar e Listar Trabalhadores | Apontador | CPF com 11 dígitos, diária $\ge 0$, crachá único. |
| **RF03** | Leitura de QR Code de Crachás | Apontador / Câmera | Preenchimento automático do colhedor na tela. |
| **RF04/05** | Registro de Apontamento + GPS | Apontador / GPS | Volume $> 0$ litros; **bloqueio absoluto sem coordenadas GPS fixadas**. |
| **RF06/07** | Lançamento de Despesas + Foto | Apontador / Câmera | Categorias fechadas, foto do recibo opcional, GPS do local. |
| **RF08/09** | Mapa da Lavoura & Rotas | Apontador / GPS | Marcadores locais, itinerário percorrido no talhão e rotas viárias. |
| **RF10** | Autenticação & Sessão | Apontador / Supabase | Sessão persistida em hardware seguro (`SecureStore`). |
| **RF11/12** | Fila Outbox & Conflitos | Sistema de Sync | Fila local transitória; desempate *Last-Write-Wins* via `updatedAt`. |

### 2.2 Requisitos Não Funcionais (Categorias Mobile)

* **RNF01 (Offline-First):** 100% das operações de cadastro, leitura de crachá, apontamento e despesas funcionam em Modo Avião.
* **RNF02 (Sincronização Resiliente):** Lotes de até 50 registros sincronizam em $< 30\text{s}$ com retentativas exponenciais (*exponential backoff*).
* **RNF03 (Permissões Contextualizadas):** Câmera e Localização solicitadas apenas na ação de uso, nunca no cold start.
* **RNF04 (Bateria & GPS sob Demanda):** GPS acionado exclusivamente no instante do clique de gravação (1 fixação por registro; sem tracking de fundo).
* **RNF05 (Persistência Local Confiável):** Transações atômicas com SQLite local garantindo integridade ACID em modo offline.
* **RNF06 (Desempenho & Fluidez):** Tempo de inicialização a frio $< 2\text{s}$ e resposta de tela $< 100\text{ms}$ em aparelhos intermediários.
* **RNF07 (Segurança & Multitenancy):** Credenciais no `expo-secure-store` e isolamento no PostgreSQL via *Row Level Security* (`auth.uid() = usuario_id`).
* **RNF08 (Compatibilidade de Ambiente):** Android 10+ e iOS 15+.
  > [!IMPORTANT]
  > **Nota de Execução:** O módulo `react-native-maps` utiliza bibliotecas nativas de sistema, exigindo build via **Expo Dev Client** (`npx expo run:android` ou `prebuild`), não sendo suportado no Expo Go padrão.

---

## 👥 3. Diagrama de Casos de Uso

Estrutura limpa (Left-to-Right), evidenciando herança de atores, inclusões compulsórias (`<<include>>`) e extensões contextuais (`<<extend>>`):

```mermaid
flowchart LR
    %% Atores
    Visitante((Visitante))
    Apontador((Apontador))
    Sync((Sistema de Sync))
    CameraGPS((Câmera / GPS))
    SupabaseSys((Supabase BaaS))

    Apontador -.->|herda de| Visitante

    %% Casos de Uso
    UC10([UC10 Fazer Login])
    UC11([UC11 Restaurar Sessão])
    UC09([UC09 Fazer Logout])
    UC01([UC01 Cadastrar Trabalhador])
    UC02([UC02 Listar Trabalhadores])
    UC03([UC03 Registrar Apontamento])
    UC04([UC04 Capturar GPS sob Demanda])
    UC05([UC05 Ler QR do Crachá])
    UC06([UC06 Registrar Despesa])
    UC07([UC07 Anexar Foto do Recibo])
    UC08([UC08 Visualizar Mapa e Rotas])
    UC12([UC12 Sincronizar Fila Outbox])
    UC13([UC13 Resolver Conflito LWW])

    %% Relações de Autenticação
    Visitante --> UC10
    Visitante --> UC11
    Apontador --> UC09
    UC10 --- SupabaseSys

    %% Relações do Apontador
    Apontador --> UC01
    Apontador --> UC02
    Apontador --> UC03
    Apontador --> UC06
    Apontador --> UC08

    %% Inclusões e Extensões
    UC03 -.->|include| UC04
    UC05 -.->|extend| UC03
    UC06 -.->|include| UC04
    UC07 -.->|extend| UC06
    UC12 -.->|include| UC13

    %% Integrações
    UC04 --- CameraGPS
    UC05 --- CameraGPS
    UC07 --- CameraGPS
    Sync --> UC12
    UC12 --- SupabaseSys
```

---

## 🏛️ 4. Modelo de Classes & Rastreabilidade de Domínio

As entidades de domínio são objetos puros em TypeScript, contendo atributos essenciais de auditoria de operador (`apontadorId`) e controle de sincronização (`syncStatus`, `updatedAt`, `deletedAt`):

```mermaid
classDiagram
    class Apontador {
        -String id
        -String nome
        -String email
    }

    class Trabalhador {
        -String id
        -String nome
        -String cpf
        -String cracha
        -ValorMonetario diaria
        -SyncStatus syncStatus
        +marcarSincronizado() void
    }

    class Apontamento {
        -String id
        -String apontadorId
        -String trabalhadorId
        -QuantidadeBalaio quantidade
        -Coordinates coordenadas
        -int data
        -SyncStatus syncStatus
        +marcarSincronizado() void
    }

    class Despesa {
        -String id
        -String apontadorId
        -String descricao
        -ValorMonetario valor
        -CategoriaDespesa categoria
        -Coordinates coordenadas
        -String fotoUri
        -SyncStatus syncStatus
    }

    class SyncQueueItem {
        -String id
        -String entity
        -String entityId
        -String operation
        -int attempts
        -SyncStatus status
        +registrarTentativa() void
    }

    class Coordinates {
        <<ValueObject>>
        +Decimal latitude
        +Decimal longitude
    }

    class QuantidadeBalaio {
        <<ValueObject>>
        +Decimal litros
    }

    class ValorMonetario {
        <<ValueObject>>
        +Decimal valor
        +formatar() String
    }

    Apontador "1" -- "0..*" Apontamento : registra
    Apontador "1" -- "0..*" Despesa : lanca
    Trabalhador "1" -- "0..*" Apontamento : colhe
    Apontamento *-- Coordinates : georreferencia
    Despesa *-- Coordinates : localiza
    Apontamento *-- QuantidadeBalaio : quantifica
    Trabalhador *-- ValorMonetario : remunera
    Apontamento -- SyncQueueItem : enfileira
    Despesa -- SyncQueueItem : enfileira
```

---

## 🗄️ 5. Diagramas Entidade-Relacionamento (DER)

A arquitetura estabelece equivalência estrutural entre a base local do smartphone e o banco em nuvem, garantindo rastreabilidade do operador (`apontador_id` / `usuario_id`).

### 5.1 DER Local (SQLite via Drizzle ORM)
Inclui a tabela transitória de mensageria local (`SYNC_QUEUE`) e o operador ativo:

```mermaid
erDiagram
    APONTADORES ||--o{ APONTAMENTOS : registra
    APONTADORES ||--o{ DESPESAS : registra
    TRABALHADORES ||--o{ APONTAMENTOS : colhe
    APONTAMENTOS ||--o{ SYNC_QUEUE : gera
    DESPESAS ||--o{ SYNC_QUEUE : gera

    APONTADORES {
        text id PK "UUID Auth/Profiles"
        text nome "Nome do operador"
        text email "E-mail"
    }

    TRABALHADORES {
        text id PK "UUID cliente"
        text nome "Nome completo"
        text cpf "11 dígitos"
        text cracha "Código QR único"
        real diaria "R$"
        text sync_status "pending|synced|error"
    }

    APONTAMENTOS {
        text id PK "UUID cliente"
        text apontador_id FK "Operador ativo"
        text trabalhador_id FK "Colhedor"
        real litros "Volume aferido"
        real latitude "GPS compulsório"
        real longitude "GPS compulsório"
        integer data "Epoch ms"
        text sync_status "pending|synced|error"
    }

    DESPESAS {
        text id PK "UUID cliente"
        text apontador_id FK "Operador ativo"
        text descricao "Motivo"
        text categoria "Refeição|Combustível|etc"
        real valor "R$"
        real latitude "GPS"
        real longitude "GPS"
        text foto_uri "Caminho file://"
        text sync_status "pending|synced|error"
    }

    SYNC_QUEUE {
        text id PK "UUID evento"
        text entidade "Apontamento|Despesa|Trabalhador"
        text entidade_id "UUID registro"
        text operacao "INSERT|UPDATE|DELETE"
        integer tentativas "Retries"
        text status "pending|syncing|error"
    }
```

### 5.2 DER Remoto (Supabase / PostgreSQL) + RLS
Isolamento multitenant no PostgreSQL protegido por *Row Level Security*:

```mermaid
erDiagram
    PROFILES ||--o{ TRABALHADORES : gerencia
    PROFILES ||--o{ APONTAMENTOS : registra
    PROFILES ||--o{ DESPESAS : lanca
    TRABALHADORES ||--o{ APONTAMENTOS : vincula

    PROFILES {
        uuid id PK "auth.users.id"
        text email "E-mail"
        text nome "Nome"
    }

    APONTAMENTOS {
        uuid id PK "UUID cliente"
        uuid usuario_id FK "PROFILES (Operador)"
        uuid trabalhador_id FK "TRABALHADORES"
        numeric litros "Volume"
        double_precision latitude "GPS"
        double_precision longitude "GPS"
        timestamptz data "Data"
        timestamptz updated_at "LWW"
    }

    DESPESAS {
        uuid id PK "UUID cliente"
        uuid usuario_id FK "PROFILES (Operador)"
        text descricao "Motivo"
        text categoria "Categoria"
        numeric valor "R$"
        text storage_path "URL Supabase Storage"
        timestamptz updated_at "LWW"
    }
```

> **Regra RLS Central no Supabase:**
> ```sql
> CREATE POLICY "Operadores gerenciam seus proprios registros"
> ON apontamentos FOR ALL USING (auth.uid() = usuario_id);
> ```

---

## 📸 6. Instantâneo de Estado Misto (Diagrama de Objetos)

Demonstra a coexistência em campo de dados sincronizados e novos registros pendentes na Outbox:

```mermaid
classDiagram
    class operadorAtivo {
        id = "user-01"
        nome = "João Apontador"
    }
    class colhedorCadastrado {
        id = "trab-02"
        nome = "Maria de Souza"
        syncStatus = "synced"
    }
    class novoApontamento {
        id = "apont-99"
        apontadorId = "user-01"
        trabalhadorId = "trab-02"
        litros = 60.0
        latitude = -21.7542
        longitude = -43.3518
        syncStatus = "pending"
    }
    class outboxQueueItem {
        entity = "Apontamento"
        entityId = "apont-99"
        operation = "INSERT"
        status = "pending"
    }

    operadorAtivo -- novoApontamento : registrou
    colhedorCadastrado -- novoApontamento : colheu
    novoApontamento -- outboxQueueItem : enfileirou
```

---

## 🔄 7. Ciclo de Vida da Sincronização (Diagrama de Estados)

Máquina de estados finitos que governa a transição de status dos registros e itens da Outbox:

```mermaid
stateDiagram-v2
    [*] --> Pendente : Gravado localmente (Offline ou Online)
    Pendente --> Sincronizando : Conexão ativa detectada pelo SyncEngine
    Sincronizando --> Sincronizado : Confirmação do Supabase (HTTP 200)
    Sincronizando --> Erro : Falha de rede / Timeout / Servidor
    Erro --> Sincronizando : Nova tentativa com Backoff Exponencial
    Sincronizado --> [*] : Concluído
```

---

## ⚡ 8. Diagramas de Sequência (Clean Architecture)

A separação em dois fluxos garante que a gravação do operador no eito nunca sofra latência de rede.

### 8.1 Fluxo Síncrono Local (Gravação Imediata em Campo)
O Caso de Uso coordena entidades e repositórios sem importar qualquer módulo nativo de UI ou Hardware:

```mermaid
sequenceDiagram
    autonumber
    actor Apontador
    participant UI as ApontamentoScreen (View)
    participant Hook as useApontamento (Adapter)
    participant HW as Hardware Gateways (Câmera / GPS)
    participant UC as RegistrarApontamento (Use Case)
    participant DB as SQLite Repositories
    participant Outbox as SyncQueue Repo

    Apontador ->> UI: Lê crachá e digita litros colhidos
    UI ->> Hook: salvarApontamento()
    Hook ->> HW: obterLocalizacaoAtual() [Compulsório]
    HW -->> Hook: Coordinates { lat, lng }
    Hook ->> UC: execute(DTO com apontadorId, litros, coords)
    
    Note over UC: Valida invariantes de negócio e VOs
    UC ->> DB: findTrabalhadorById(id)
    UC ->> DB: save(apontamento)
    UC ->> Outbox: enqueue(itemOutbox)
    
    UC -->> Hook: Retorna entidade salva
    Hook -->> UI: Sucesso confirmado
    UI -->> Apontador: Feedback: "Salvo localmente com sucesso!"
```

### 8.2 Fluxo Assíncrono da Outbox (Background Sync & LWW)
Processamento desacoplado disparado por conectividade ativa:

```mermaid
sequenceDiagram
    autonumber
    participant Engine as SyncEngine (Background Worker)
    participant Outbox as SyncQueue Repo (SQLite)
    participant Net as NetworkGateway (NetInfo)
    participant Cloud as SyncGateway (Supabase BaaS)
    participant SVC as SincronizacaoService (LWW)

    Engine ->> Net: isConnected()?
    Net -->> Engine: true (Conectado)
    Engine ->> Outbox: carregarItensPendentes()
    
    loop Para cada item na fila
        Engine ->> Cloud: push(item.payload)
        alt Sucesso (HTTP 200)
            Cloud -->> Engine: { success: true }
            Engine ->> Outbox: delete(item.id)
        else Conflito de Versão
            Engine ->> SVC: resolverConflito(localUpdatedAt, serverUpdatedAt)
            SVC -->> Engine: Vencedor Last-Write-Wins
            Engine ->> Outbox: delete(item.id)
        else Falha Transitória
            Engine ->> Outbox: marcarErro() + reagendar com backoff
        end
    end
```

---

## 🧭 9. Fluxo de Decisões de Campo (Diagrama de Atividades)

Visão ponta a ponta horizontal (`LR`) com ramificações explícitas de permissões de sensores e conectividade:

```mermaid
flowchart LR
    Start((Início)) --> EscolhaID{Identificação}
    
    %% Ramo Leitura de Crachá
    EscolhaID -- QR Code --> PermCam{Câmera?}
    PermCam -- Sim --> Scan[Escanear Crachá] --> Preenche[Preencher Colhedor]
    PermCam -- Não --> Manual[Selecionar na Lista] --> Preenche
    EscolhaID -- Manual --> Manual

    %% Entrada e GPS Compulsório
    Preenche --> Litros[Digitar Litros] --> Salvar[Tocar em Salvar]
    Salvar --> PermGPS{GPS?}
    PermGPS -- Não --> Bloqueio["Bloquear: GPS Obrigatório"] --> Start
    PermGPS -- Sim --> FixGPS[Capturar Satélites]
    GPSOk -- Não --> RetentaGPS["Avisar: Aguarde GPS"] --> FixGPS
    
    %% Persistência Local
    GPSOk -- Sim --> GravaLocal[Persistir no SQLite] --> Outbox[Enfileirar na Outbox]
    Outbox --> Feedback["Feedback de Sucesso!"]

    %% Sincronização Assíncrona
    Feedback --> Rede{Internet Ativa?}
    Rede -- Não --> Aguarda[Aguardar Conexão] --> Rede
    Rede -- Sim --> Envio[SyncEngine Transmite Lote] --> Confirma["Marcar Sincronizado e Purgar Fila"] --> Fim((Fim))
```

---

## 🧩 10. Diagrama de Componentes (Clean Architecture)

Estrutura em 5 camadas concêntricas. As setas apontam estritamente para dentro:

```mermaid
flowchart TB
    subgraph LayerUI["1. Interface Adapters — Entrada (UI / Expo Router)"]
        direction TB
        Screens["Screens: ApontamentoScreen · TrabalhadoresScreen · DespesasScreen · MapaScreen · LoginScreen"]
        Hooks["Presentation Hooks: useApontamento · useAuth · useTrabalhadores"]
        Screens --> Hooks
    end

    subgraph LayerApp["2. Application Layer — Use Cases"]
        direction TB
        UC_Core["Use Cases: CadastrarTrabalhador · RegistrarApontamento · RegistrarDespesa"]
        UC_Sync["Use Cases de Suporte: AuthenticateUser · RestoreSession · SyncPendingQueue"]
    end

    subgraph LayerDomain["3. Domain Layer — Core Puro (Zero Dependências Externas)"]
        direction TB
        subgraph Sub_Modelos["Entidades & Value Objects"]
            Entidades["Entidades: Trabalhador · Apontamento · Despesa · Apontador · SyncQueueItem"]
            VOs["Value Objects: Coordinates · QuantidadeBalaio · ValorMonetario · SyncStatus"]
        end
        subgraph Sub_Portas["Contratos de Portas (Interfaces)"]
            P_Repos[["Portas Repositórios: TrabalhadorRepo · ApontamentoRepo · DespesaRepo · SyncQueueRepo"]]
            P_Gateways[["Portas Gateways: CameraGateway · LocationGateway · NetworkGateway · SyncGateway"]]
        end
        SVC_Sync["Domain Service: SincronizacaoService LWW"]
    end

    subgraph LayerAdapters["4. Interface Adapters — Saída (Implementações)"]
        direction TB
        A_Repos["SQLite Drizzle Repositories"]
        A_Gateways["Gateways Nativos: CameraExpo · LocationExpo · NetInfo · SupabaseClient · SecureStore"]
    end

    subgraph LayerInfra["5. Frameworks & Drivers (Borda Externa)"]
        direction TB
        F_LocalDB[("expo-sqlite + drizzle-orm")]
        F_Hardware["expo-camera + expo-location + NetInfo"]
        F_Cloud["@supabase/supabase-js (Auth, Postgres, Storage)"]
        F_NativeLibs["expo-secure-store + react-native-maps"]
    end

    %% Fluxo de Dependências Limpo
    Hooks --> LayerApp
    LayerApp --> Sub_Modelos
    LayerApp --> Sub_Portas
    LayerApp --> SVC_Sync

    %% Inversão de Dependência
    A_Repos -.->|implementa| P_Repos
    A_Gateways -.->|implementa| P_Gateways

    %% Conexões com Drivers Externos
    A_Repos --> F_LocalDB
    A_Gateways --> F_Hardware
    A_Gateways --> F_Cloud
    A_Gateways --> F_NativeLibs
    Screens -.->|renderiza mapa nativo| F_NativeLibs
```

---

## ☕ 11. Mapeamento DDD (Linguagem Ubíqua da Lavoura)

A modelagem reflete o vocabulário fidedigno da colheita cafeeira:

| Termo do Domínio | Conceito no Software | Invariante Assegurada |
|:---|:---|:---|
| **Eito** | Local físico do cafezal | Coordenadas GPS obrigatórias (`Coordinates`). |
| **Balaio** | Unidade volumétrica de colheita | Litros estritamente positivos (`QuantidadeBalaio` $> 0$). |
| **Crachá** | Identificador óptico do colhedor | Código único impresso no formato QR Code. |
| **Diária** | Remuneração acordada por dia | Valor em reais positivo (`ValorMonetario` $\ge 0$). |
| **Apontador** | Operador responsável pela pesagem | Rastreabilidade do ID do usuário autenticado em cada registro. |

---

## 📂 12. Estrutura e Organização das Pastas (Clean Architecture)

Estrutura essencial dos diretórios, evidenciando a separação concêntrica das camadas:

```text
PROJETOMOBILE/
├── app/                  # Camada de Apresentação (Expo Router: Telas, Drawer e Tabs)
│   ├── (drawer)/(tabs)/  # Telas Centrais: Apontamento (Home), Trabalhadores, Despesas e Mapas
│   └── index.tsx         # Tela de Autenticação do Apontador
│
├── src/                  # Núcleo da Aplicação (Independente de Frameworks)
│   ├── domain/           # Domínio Puro: Entidades, Value Objects e Interfaces de Portas
│   ├── usecases/         # Casos de Uso: Regras de negócio da colheita e orquestração
│   ├── adapters/         # Adaptadores de Interface: AuthContext, SecureStore e UI Helpers
│   ├── infra/            # Frameworks & Drivers: Repositórios SQLite e Gateways Nativo/Supabase
│   └── factory/          # Composição & IoC: container.ts (Injeção de Dependências)
│
└── tests/                # Testes Automatizados TDD (Domínio, Casos de Uso e Telas)
```

> **Regra de Isolamento Arquitetural:**
> * `domain/` é 100% puro em TypeScript (zero dependências externas).
> * `usecases/` dependem apenas de contratos (`domain/`) e recebem implementações via construtor.
> * `app/` acessa os casos de uso unicamente via `Container.getInstance()`.

---

## 🏗️ 13. Ponto Único de Wiring: `container.ts` (IoC Container)

Garante o **Princípio da Inversão de Dependência**. É a única classe que instancia os adapters concretos e os injeta nos construtores dos casos de uso como Singletons:

```typescript
// src/factory/container.ts (Singleton IoC)
export class Container {
  private static instance: Container;

  // Portas de Repositório e Gateways
  public readonly trabalhadorRepository: InMemoryTrabalhadorRepository;
  public readonly apontamentoRepository: InMemoryApontamentoRepository;
  public readonly despesaRepository: InMemoryDespesaRepository;
  public readonly syncQueueRepository: InMemorySyncQueueRepository;

  // Casos de Uso
  public readonly cadastrarTrabalhador: CadastrarTrabalhador;
  public readonly registrarApontamento: RegistrarApontamento;
  public readonly registrarDespesa: RegistrarDespesa;
  public readonly syncPendingQueue: SyncPendingQueue;

  private constructor() {
    // 1. Instancia Repositórios (Singletons)
    this.trabalhadorRepository = InMemoryTrabalhadorRepository.getInstance();
    this.apontamentoRepository = InMemoryApontamentoRepository.getInstance();
    this.despesaRepository = InMemoryDespesaRepository.getInstance();
    this.syncQueueRepository = InMemorySyncQueueRepository.getInstance();

    // 2. Injeta via Construtor nos Casos de Uso
    this.cadastrarTrabalhador = new CadastrarTrabalhador(this.trabalhadorRepository, this.syncQueueRepository);
    this.registrarApontamento = new RegistrarApontamento(this.apontamentoRepository, this.trabalhadorRepository, this.syncQueueRepository);
    this.registrarDespesa = new RegistrarDespesa(this.despesaRepository, this.syncQueueRepository);
    this.syncPendingQueue = new SyncPendingQueue(this.syncQueueRepository, InMemorySyncGateway.getInstance(), InMemoryNetworkGateway.getInstance(), new SincronizacaoService());
  }

  public static getInstance(): Container {
    if (!Container.instance) Container.instance = new Container();
    return Container.instance;
  }
}
```

---

## 🧪 14. Estratégia de Testes TDD (Pirâmide de Testes)

O ecossistema conta com **25 suítes de testes e 92 testes automatizados** com **100% de aprovação**:

```text
               /\
              /E2E\       Poucos testes completos (Detox / Maestro em device)
             /------\
            / Telas  \    @testing-library/react-native (Estados visuais e alertas)
           /----------\
          / Repos & GW \  SQLite in-memory real e mocks pontuais de expo-camera/location
         /--------------\
        /   Use Cases    \ Testes de Aceitação usando Fakes em memória (Rápido: ~5s)
       /------------------\
      /  Domínio Puro & VOs\ 100% sem mocks: Coordinates, QuantidadeBalaio, ValorMonetario
     /______________________\
```

### Exemplo de Rastreabilidade RF $\rightarrow$ Teste
* **RF04 / RF05:** `Coordinates.test.ts` valida rejeição de latitudes fora de $[-90, 90]$ e longitudes fora de $[-180, 180]$.
* **RF04 / RF11:** `RegistrarApontamento.test.ts` valida que a chamada grava simultaneamente no `ApontamentoRepository` e na `SyncQueueRepository`.
* **RNF01:** `SyncPendingQueue.test.ts` comprova que quando `isConnected = false`, nenhuma chamada de rede é feita e a base local se mantém intacta.

---

## 📌 15. Checklist Rápido para a Apresentação na Banca

- [x] **1. Problema e Solução:** Explicado em 1 slide (eito sem sinal $\rightarrow$ app 100% offline-first).
- [x] **2. Rastreabilidade:** Demonstrada do RF ao Caso de Uso, Entidade, Tabela SQLite e Teste Jest.
- [x] **3. Clean Architecture:** Nenhuma dependência nativa vazando para o domínio ou aplicação.
- [x] **4. Organização das Pastas:** Camadas claramente isoladas (`domain`, `usecases`, `infra`, `app`).
- [x] **5. Resiliência de Sincronização:** Outbox pattern explicado visualmente com tolerância a falhas e Last-Write-Wins.
- [x] **6. Demonstração dos Testes:** `npm test` executando 92 testes em ~6 segundos.
