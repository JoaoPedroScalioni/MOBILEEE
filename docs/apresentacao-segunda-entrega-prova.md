---
marp: true
paginate: true
theme: default
size: 16:9
footer: "Sistema de Gestão e Avaliação de Estágio | Defesa e Apresentação como Prova"
---

# Sistema de Gestão e Avaliação de Estágio
## Planejamento Completo: Fase "Domínio e Interface Primeiro"
**100% Mock / Fakes In-Memory · 80%+ Cobertura de Testes · TDD Rigoroso**

Engenharia de Software Mobile · Clean Architecture, DDD & RNTL

---

# 📌 Agenda da Apresentação

1. **Visão Geral do Fluxo Incremental Desacoplado**
2. **Camada de Domínio Puro (`domain/`)**: VOs, Entidades, Agregados, Regras e Serviços
3. **Camada de Aplicação (`usecases/`)**: 10 Casos de Uso com Fakes In-Memory
4. **Camada de Adaptadores, Estado Global e Context API (`adapters/`)**:
   - `AuthContext` (eliminação de Prop Drilling para Aluno, Orientador e Coordenação)
   - `SessionStorageSecureStore` (Keystore/Keychain via `expo-secure-store`)
   - Custom Hooks de Ponte (`useAuth`, `useAtividades`)
   - `CameraGatewayExpo`
5. **Camada de UI e Rotas (`app/` e `adapters/screens/`)**:
   - Telas: `AssinaturaScreen`, `AtividadesFormScreen`, `HistoricoRelatoriosScreen`
   - Navegação com Expo Router Boundaries
6. **O que Fica em Mock / Fake nesta Fase** (Zero banco permanente ou hardware real)
7. **Estratégia de Testes e Pirâmide de Testes (51 Suítes / 168 Testes)**
8. **Checklist Sequencial de Construção**

---

# 🔄 1. Fluxo Incremental: Domínio e Interface Primeiro

Nesta etapa inicial, o desenvolvimento segue um fluxo estritamente incremental e desacoplado:

```
[1. Domínio Puro] 
      ↓ 
[2. Use Cases] 
      ↓ 
[3. Context API & Sessão Segura] 
      ↓ 
[4. Componentes/Telas com Fakes (RNTL)]
```

> **Princípio Central da Prova:** Todo o comportamento de negócio e de interface é validado via **TDD com Fakes em Memória** antes que qualquer dado toque em um banco de dados permanente (SQLite ou Supabase) ou dependa de hardware físico.

---

# 🏛️ 2. Camada de Domínio Puro (`domain/`)

O domínio contém as regras de negócio centrais e é **100% puro**, sem qualquer importação ou dependência do React, React Native, Expo ou bibliotecas de UI.

* **Value Objects (Objetos de Valor) Imutáveis:**
  * `Criterio`: Armazena nome e nota (0-10) e calcula a faixa automática (**MB** $\ge 8.5$, **B** $\ge 7.0$, **R** $\ge 5.0$, **F** $< 5.0$).
  * `Coordenada`: Armazena latitude $[-90, 90]$, longitude $[-180, 180]$ e marca temporal (`timestamp`).
  * `Assinatura`: Representa a assinatura digital (`base64`, `timestamp`, `autorId`, `papel`).
  * `CargaHoraria`: Valida horas totais, mínimas e do período com cálculo de percentual.
  * `StatusSincronizacao`: Enum (`pending` | `synced` | `error`).
  * `StatusPeriodo`: Enum do ciclo de vida (`rascunho`, `pendente_supervisor`, `pendente_assinaturas`, `aprovado`, `devolvido`).

---

# 🌳 2.1 Entidades, Agregados e Serviços de Domínio

* **`PeriodoAvaliacao` (Aggregate Root):**
  * Gerencia `AtividadesDesenvolvidas`, `AvaliacaoSupervisor`, `AutoAvaliacao` e assinaturas digitais.
  * **Invariante Protegida:** Bloqueia o registro de uma 2ª avaliação se o período já estiver como `Aprovado`.
  * **Invariante `podeGerarPdf()`:** Retorna `true` apenas com todas as assinaturas sincronizadas e status `aprovado`.
* **`Estagio` & `TokenSupervisor`:**
  * Entidades com raízes e ciclos de vida próprios.
  * O supervisor acessa diretamente via token com expiração (`expiraEm`) e revogação (`revogado`) sem ter conta de autenticação padrão.
* **Serviços de Domínio (Domain Services):**
  * `RegraGeracaoPdfService`: validação cruzada entre período, estágio e assinaturas sincronizadas.
  * `RegraDevolucaoService`: regras de justificativa mínima (5+ chars) e bloqueio de devolução pós-aprovação.
  * `SincronizacaoService`: resolução de conflitos *Last-Write-Wins*.

---

# 🚀 3. Camada de Aplicação (`usecases/`)

Contém a lógica de orquestração do sistema. Os casos de uso chamam as entidades do domínio e se comunicam através das interfaces dos repositórios e gateways, sem conter regras de negócio puras ou código de interface:

1. `RegistrarAtividadesUseCase`
2. `AvaliarDesempenhoUseCase` (com suporte a acesso via token)
3. `RealizarAutoAvaliacaoUseCase` (com verificação de titularidade do aluno)
4. `AssinarRelatorioUseCase` (assinatura digital de aluno e supervisor)
5. `AprovarRelatorioUseCase` (homologação após todas as etapas completas)
6. `DevolverRelatorioUseCase` (com justificativa de correção)
7. `GerarPdfUseCase` (orquestrando `RegraGeracaoPdfService` e `PdfGateway`)
8. `SincronizarFilaUseCase` (sincronização assíncrona off-line/on-line)
9. `AutenticarUsuarioUseCase` (login e sessão segura)
10. `AcessarViaTokenUseCase` (acesso direto do supervisor sem senha comum)

---

# 🔌 4. Adaptadores, Estado Global e Context API (`adapters/`)

Localização Arquitetural: Fica na camada de Adapters/UI. O domínio e a camada de aplicação **nunca importam a Context API**.

* **Context API (`adapters/context/AuthContext.tsx`):**
  * Elimina o *Prop Drilling* do usuário autenticado (Aluno, Orientador ou Coordenação).
  * O componente `<AuthProvider>` envolve a raiz do aplicativo e disponibiliza o estado da sessão globalmente, permitindo que qualquer tela leia o usuário logado com `useContext`.
* **Gerenciamento de Sessão Segura (`adapters/auth/SessionStorageSecureStore.ts`):**
  * Implementa a interface `SessionStorage` atuando como um wrapper sobre a biblioteca `expo-secure-store`.
  * Criptografa o token de sessão diretamente no dispositivo (Keychain no iOS / Keystore no Android), evitando o uso de armazenamento não seguro.

---

# 🌉 4.1 Custom Hooks de Ponte & Gateways de Hardware

* **Custom Hooks de Ponte (`adapters/hooks/`):**
  * Hooks como `useAuth` e `useAtividades` atuam como a fronteira entre as telas e os Use Cases.
  * Adaptam os Casos de Uso ao ciclo de vida do componente React (gerenciando estados como `idle`, `salvando`, `salvo`, `erro`) sem acoplar as telas diretamente aos Use Cases.
* **Gateways de Hardware (Adapters):**
  * `CameraGatewayExpo`: Embrulha a biblioteca nativa `expo-camera` atrás da interface declarada no domínio (`CameraGateway`), mantendo a câmera desacoplada para facilitar testes e desenvolvimento.
  * Degradação graciosa e mocks fakes em ambiente de desenvolvimento e testes.

---

# 📱 5. Camada de UI e Rotas (`app/` e `adapters/screens/`)

* **Navegação e Rotas (Expo Router - `app/`):**
  * A estrutura de arquivos em `app/` (`app/login.tsx`, `app/(aluno)/atividades.tsx`, `app/(aluno)/assinatura.tsx`, `app/(aluno)/relatorios.tsx`) funciona como a fronteira de entrada visual (**Boundary**), onde as interações de toque do usuário entram no aplicativo.
* **Layouts e Componentes Visuais:**
  * Construídos com componentes nativos `<View>` e `<Text>` e estilizados via `StyleSheet` e Flexbox (com eixos configurados em `flexDirection: column` por padrão).
* **Telas Principais:**
  * `AssinaturaScreen`: Coleta e confirmação da assinatura digital (aluno/supervisor).
  * `AtividadesFormScreen`: Formulário com inputs de descrição, carga horária e toggle de GPS sob demanda.
  * `HistoricoRelatoriosScreen`: Visão consolidada de relatórios, status de sync e emissão de PDF.

---

# 🎭 6. O que FICA EM MOCK / FAKE nesta Fase

Para garantir isolamento total e testes ultrarrápidos:

* **Sem Armazenamento Permanente Real:** Nenhuma conexão ativa com banco SQLite local (`expo-sqlite`) ou banco relacional em nuvem (`@supabase/supabase-js`).
* **Sem Acesso Nativo a Sensores:** As chamadas para APIs de Câmera (`expo-camera`) e Localização (`expo-location`) usam Gateways Fakes/Mocks em memória no ambiente de teste.
* **Fakes de Repositório & Session Stubs:**
  * Uso de estruturas `Map<string, T>` em memória para repositórios (`InMemoryPeriodoAvaliacaoRepository`, `InMemoryEstagioRepository`, `InMemoryTokenSupervisorRepository`).
  * Implementados com o padrão **Singleton** (`private constructor`, `getInstance()`).
  * Stubs de autenticação devolvendo sessões válidas para montagem imediata das telas.

---

# 🧪 7. Estratégia de Testes e Cobertura (Meta 80%+)

A suíte de testes é organizada de acordo com a pirâmide de testes do projeto:

1. **Testes de Domínio (Maior Volume):** Testes unitários puros de Entidades e Value Objects, rodando 100% em memória e sem necessidade de mocks.
2. **Testes de Use Cases (Volume Alto):** Validação das regras de orquestração e fluxos alternativos injetando repositórios e gateways fakes em memória via TDD.
3. **Testes do Context API & Hooks (Volume Médio):** Validação do `AuthProvider`, `useAuth` e `useAtividades`, garantindo o carregamento da sessão salva e a integração com os Use Cases.
4. **Testes de Telas e Componentes (RNTL + jest-expo):** Testes com `@testing-library/react-native` que usam `render()`, `fireEvent.press` e `fireEvent.changeText` para simular as ações do usuário nas telas envolvidas pelo `<AuthProvider>` e injetadas com Use Cases Fakes.
5. **Testes E2E (Pouquíssimos):** Reservados para fluxos críticos de ponta a ponta.

---

# 📈 7.1 Métricas de Validação da Suíte de Testes

Execução real via Jest:

```
PASS tests/screens/AtividadesFormScreen.test.tsx
PASS tests/screens/HistoricoRelatoriosScreen.test.tsx
PASS tests/screens/AssinaturaScreen.test.tsx
PASS tests/adapters/AuthContextAdapters.test.tsx
PASS tests/adapters/useAtividades.test.ts
PASS tests/domain/PeriodoAvaliacao.test.ts
PASS tests/usecases/RegistrarAtividadesUseCase.test.ts
PASS tests/usecases/AvaliarDesempenhoUseCase.test.ts
... (51 arquivos de teste)

Test Suites: 51 passed, 51 total
Tests:       168 passed, 168 total
Snapshots:   0 total
Time:        13.236 s
Ran all test suites.
```

* **51 Suítes de Teste aprovadas de 51** (100% de sucesso).
* **168 Testes Unitários e de Componente passando**.
* **Cobertura superior a 88% a 100%** nas camadas de domínio e aplicação.

---

# 📋 8. Checklist Sequencial de Construção

A ordem exata de implementação seguida:

1. [x] **Value Objects:** `Criterio`, `Coordenada`, `Assinatura`, `CargaHoraria` (testes puros).
2. [x] **Entities & Aggregates:** `PeriodoAvaliacao`, `Estagio`, `TokenSupervisor` (invariantes testadas).
3. [x] **Domain Services:** `RegraGeracaoPdfService`, `RegraDevolucaoService`, `SincronizacaoService`.
4. [x] **Interfaces de Repository / Gateway:** Contratos declarativos no domínio puro.
5. [x] **Use Cases:** Orquestração com fakes in-memory (ciclo Red-Green-Refactor).
6. [x] **Context API + Custom Hooks:** `AuthContext`, `useAuth` e `useAtividades` conectando Use Cases ao ciclo de vida.
7. [x] **Telas com RNTL:** `AssinaturaScreen`, `AtividadesFormScreen`, `HistoricoRelatoriosScreen` com Use Cases Fakes injetados.
8. [x] **Sessão Segura:** Adaptador `SessionStorageSecureStore` encapsulando `expo-secure-store` (mockado nos testes).
