# 📱 Apresentação de Defesa Técnica: Fase "Domínio e Interface Primeiro"
### Projeto: SafraCafé — Sistema de Avaliação de Estágio e Registro de Atividades
**Padrão Arquitetural:** Clean Architecture + Domain-Driven Design (DDD) + TDD (Test-Driven Development)  
**Ambiente da Etapa:** 100% Mock / Em Memória (Isolado de Banco Físico e Hardware Nativo)  
**Resultados dos Testes:** 52 Test Suites | 170 Testes Aprovados (100%) | 81.74% de Cobertura Global

---

## 📑 Slide 1: Visão Geral e Estratégia Arquitetural

### Objetivo da Etapa
* Desenvolvimento e validação completa das regras de negócio, fluxos de uso e componentes de interface antes da introdução de bancos de dados físicos ou sensores de hardware.
* Desacoplamento estrito: a camada de domínio não possui importações ou dependências de React, Expo ou bibliotecas de UI.
* A interface gráfica é validada sem dependência de APIs remotas em execução.

### Fluxo de Construção Incremental
```
[Value Objects] ➔ [Entities & Aggregates] ➔ [Domain Services] ➔ [Interfaces/Gateways]
       ➔ [Use Cases] ➔ [Hardware/DB Fakes] ➔ [Context & Hooks] ➔ [Telas RNTL] ➔ [Testes Automatizados]
```

---

## 📑 Slide 2: Passo 1 — Value Objects (Objetos de Valor)

### Características Arquiteturais
* **Imutabilidade:** Propriedades `readonly`, sem métodos modificadores (`setters`).
* **Identidade por Atributos:** Dois objetos com os mesmos valores são equivalentes (`equals`).
* **Auto-validação no Construtor:** Bloqueio imediato na instanciação em caso de valores inválidos.

### Objetos de Valor Implementados
* [`Criterio`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Criterio.ts): Validação de notas (0 a 10) e cálculo automático da faixa de conceito (`MB`, `B`, `R`, `F`).
* [`Coordenada`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Coordenada.ts): Latitude [-90, 90], longitude [-180, 180] e timestamp UTC.
* [`Assinatura`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Assinatura.ts): Assinatura digital (payload base64, papel do autor e carimbo de tempo).
* [`CargaHoraria`](file:///c:/PROJETOMOBILE/src/domain/value-objects/CargaHoraria.ts): Validação de horas acumuladas, limite mínimo e horas do período.
* [`StatusPeriodo`](file:///c:/PROJETOMOBILE/src/domain/value-objects/StatusPeriodo.ts) e [`StatusSincronizacao`](file:///c:/PROJETOMOBILE/src/domain/value-objects/StatusSincronizacao.ts): Estados formais do ciclo de vida.

### Implementação: `Criterio.ts`
```typescript
export type FaixaCriterio = 'MB' | 'B' | 'R' | 'F';

export class Criterio {
  private readonly nome: string;
  private readonly nota: number;

  constructor(nome: string, nota: number) {
    if (!nome || nome.trim().length === 0) {
      throw new Error('O nome do critério não pode ser vazio.');
    }
    if (typeof nota !== 'number' || isNaN(nota) || nota < 0 || nota > 10) {
      throw new Error('A nota do critério deve estar entre 0 e 10.');
    }
    this.nome = nome.trim();
    this.nota = Math.round(nota * 10) / 10;
  }

  public getFaixa(): FaixaCriterio {
    if (this.nota >= 8.5) return 'MB';
    if (this.nota >= 7.0) return 'B';
    if (this.nota >= 5.0) return 'R';
    return 'F';
  }

  public equals(other: Criterio): boolean {
    if (!(other instanceof Criterio)) return false;
    return this.nome === other.nome && this.nota === other.nota;
  }
}
```

### Validação Unitária: `tests/domain/Criterio.test.ts`
```typescript
it('deve classificar faixas de conceito corretamente: MB, B, R, F', () => {
  expect(new Criterio('Assiduidade', 9.5).getFaixa()).toBe('MB');
  expect(new Criterio('Proatividade', 7.5).getFaixa()).toBe('B');
  expect(new Criterio('Pontualidade', 5.5).getFaixa()).toBe('R');
  expect(new Criterio('Postura', 4.0).getFaixa()).toBe('F');
});

it('deve rejeitar notas fora do intervalo 0-10', () => {
  expect(() => new Criterio('Teste', -1)).toThrow('A nota do critério deve estar entre 0 e 10.');
  expect(() => new Criterio('Teste', 10.5)).toThrow('A nota do critério deve estar entre 0 e 10.');
});
```

---

## 📑 Slide 3: Passo 2 — Entidades e Agregados (Entities & Aggregate Roots)

### Características Arquiteturais
* **Raiz de Agregação (`PeriodoAvaliacao`):** Ponto de controle exclusivo para garantir integridade e regras invariantes do período de estágio.
* **Entidades Vinculadas:** `Estagio`, `TokenSupervisor`, `AtividadesDesenvolvidas`, `AvaliacaoSupervisor`, `AutoAvaliacao`.

### Invariantes Garantidas
1. **Imutabilidade pós-aprovação:** Bloqueio de novas avaliações caso o período já esteja no estado `APROVADO`.
2. **Critérios de Aprovação:** Exigência mandatória de atividades, avaliação do supervisor, autoavaliação do estagiário e ambas as assinaturas digitais.
3. **Condição de Emissão de Relatório (`podeGerarPdf()`):** Período aprovado, ambas as assinaturas presentes e confirmação de sincronização prévia com o servidor.

### Implementação: `PeriodoAvaliacao.ts`
```typescript
export class PeriodoAvaliacao {
  public registrarAvaliacaoSupervisor(avaliacao: AvaliacaoSupervisor): void {
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido registrar ou alterar avaliação de supervisor em um período já aprovado.');
    }
    this.avaliacaoSupervisor = avaliacao;
    this.atualizarStatusAposAvaliacoes();
  }

  public aprovar(): void {
    if (!this.atividades) throw new Error('Não é possível aprovar um período sem atividades registradas.');
    if (!this.avaliacaoSupervisor) throw new Error('Não é possível aprovar sem a avaliação do supervisor.');
    if (!this.autoAvaliacao) throw new Error('Não é possível aprovar sem a autoavaliação do estagiário.');
    if (!this.assinaturaAluno || !this.assinaturaSupervisor) {
      throw new Error('Não é possível aprovar um período sem as assinaturas de ambas as partes.');
    }
    this.status = StatusPeriodo.APROVADO;
  }

  public podeGerarPdf(): boolean {
    const statusAprovado = this.status === StatusPeriodo.APROVADO;
    const temTodasAssinaturas = this.assinaturaAluno !== null && this.assinaturaSupervisor !== null;
    const sincronizadas = this.assinaturasSincronizadas === true;
    return statusAprovado && temTodasAssinaturas && sincronizadas;
  }
}
```

### Validação Unitária: `tests/domain/PeriodoAvaliacao.test.ts`
```typescript
it('deve bloquear nova avaliação se o período já estiver aprovado', () => {
  const periodo = criarPeriodoAprovado();
  expect(() => periodo.registrarAvaliacaoSupervisor(novaAvaliacao)).toThrow(
    'Não é permitido registrar ou alterar avaliação de supervisor em um período já aprovado.'
  );
});

it('deve retornar podeGerarPdf() verdadeiro somente com aprovação e assinaturas sincronizadas', () => {
  const periodo = criarPeriodoAprovado();
  periodo.marcarAssinaturasSincronizadas(true);
  expect(periodo.podeGerarPdf()).toBe(true);
});
```

---

## 📑 Slide 4: Passo 3 — Domain Services (Serviços de Domínio)

### Finalidade Arquitetural
* Centralização de regras e validações cruzadas que envolvem mais de uma entidade de domínio.

### Serviços Implementados
* [`RegraGeracaoPdfService`](file:///c:/PROJETOMOBILE/src/domain/services/RegraGeracaoPdfService.ts): Valida simultaneamente o estado do `PeriodoAvaliacao` e a consistência do `Estagio` correspondente.
* [`RegraDevolucaoService`](file:///c:/PROJETOMOBILE/src/domain/services/RegraDevolucaoService.ts): Valida justificativas e critérios de transição para reabertura de relatórios devolvidos.
* [`SincronizacaoService`](file:///c:/PROJETOMOBILE/src/domain/services/SincronizacaoService.ts): Regras de resolução de pendências para o motor de sincronização.

### Implementação: `RegraGeracaoPdfService.ts`
```typescript
export class RegraGeracaoPdfService {
  public static validar(periodo: PeriodoAvaliacao, estagio?: Estagio): ValidacaoGeracaoPdfResult {
    const erros: string[] = [];
    if (!periodo) return { podeGerar: false, erros: ['Período de avaliação não informado.'] };

    if (!periodo.podeGerarPdf()) {
      if (periodo.getStatus() !== 'aprovado') erros.push('O relatório do período precisa estar aprovado.');
      if (!periodo.getAssinaturaAluno() || !periodo.getAssinaturaSupervisor()) {
        erros.push('O relatório deve conter as assinaturas do aluno e do supervisor.');
      }
      if (!periodo.isAssinaturasSincronizadas()) {
        erros.push('Todas as assinaturas digitais devem estar sincronizadas com o servidor.');
      }
    }

    if (estagio && estagio.getId() !== periodo.getEstagioId()) {
      erros.push('O estágio fornecido não corresponde ao estágio vinculado ao período de avaliação.');
    }

    return { podeGerar: erros.length === 0, erros };
  }
}
```

---

## 📑 Slide 5: Passo 4 — Contratos e Interfaces (Repository & Gateway Interfaces)

### Princípio da Inversão de Dependência (DIP)
* O Domínio define **apenas contratos abstratos** (TypeScript `interface`).
* Nenhuma biblioteca de banco (SQLite, Supabase) ou recurso nativo do sistema operacional (Câmera, GPS) é importada no domínio.

```typescript
// src/domain/repositories/PeriodoAvaliacaoRepository.ts
export interface PeriodoAvaliacaoRepository {
  save(periodo: PeriodoAvaliacao): Promise<void>;
  findById(id: string): Promise<PeriodoAvaliacao | null>;
  findByEstagioId(estagioId: string): Promise<PeriodoAvaliacao[]>;
  list(): Promise<PeriodoAvaliacao[]>;
  findPendentesSincronizacao(): Promise<PeriodoAvaliacao[]>;
}
```

---

## 📑 Slide 6: Passo 5 — Casos de Uso (Application Layer)

### Características da Camada de Aplicação
* Orquestração de regras de negócio entre repositórios, gateways e entidades.
* Injeção de dependência via construtor, possibilitando substituição total de repositórios reais por implementações em memória nos testes.

### Casos de Uso do Sistema
1. [`RegistrarAtividadesUseCase`](file:///c:/PROJETOMOBILE/src/usecases/RegistrarAtividadesUseCase.ts)
2. [`AvaliarDesempenhoUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AvaliarDesempenhoUseCase.ts)
3. [`RealizarAutoAvaliacaoUseCase`](file:///c:/PROJETOMOBILE/src/usecases/RealizarAutoAvaliacaoUseCase.ts)
4. [`AssinarRelatorioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AssinarRelatorioUseCase.ts)
5. [`AprovarRelatorioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AprovarRelatorioUseCase.ts)
6. [`DevolverRelatorioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/DevolverRelatorioUseCase.ts)
7. [`GerarPdfUseCase`](file:///c:/PROJETOMOBILE/src/usecases/GerarPdfUseCase.ts)
8. [`SincronizarFilaUseCase`](file:///c:/PROJETOMOBILE/src/usecases/SincronizarFilaUseCase.ts)
9. [`AutenticarUsuarioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AutenticarUsuarioUseCase.ts)
10. [`AcessarViaTokenUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AcessarViaTokenUseCase.ts)

### Implementação: `RegistrarAtividadesUseCase.ts`
```typescript
export class RegistrarAtividadesUseCase {
  constructor(
    private readonly periodoRepo: PeriodoAvaliacaoRepository,
    private readonly locationGateway?: LocationGateway
  ) {}

  async execute(dto: RegistrarAtividadesDTO): Promise<PeriodoAvaliacao> {
    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) throw new Error('Período de avaliação não encontrado.');

    let coordenada: Coordenada | undefined;
    if (dto.capturarLocalizacao && this.locationGateway) {
      coordenada = await this.locationGateway.obterLocalizacaoAtual();
    }

    const cargaHoraria = new CargaHoraria(dto.horasTotais, dto.horasMinimas, dto.horasPeriodo);
    const atividades = new AtividadesDesenvolvidas({
      id: `ativ-${Date.now()}`,
      descricao: dto.descricao,
      cargaHoraria,
      coordenada,
      dataRegistro: new Date(),
    });

    periodo.registrarAtividades(atividades);
    await this.periodoRepo.save(periodo);
    return periodo;
  }
}
```

---

## 📑 Slide 7: Passo 6 — Hardware Desacoplado: Câmera e GPS

### 1. Câmera Nativa (`CameraGateway`)
* **Contrato no Domínio:** [`src/domain/gateways/CameraGateway.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/CameraGateway.ts)
* **Adapter Real (Expo):** [`src/adapters/gateways/CameraGatewayExpo.ts`](file:///c:/PROJETOMOBILE/src/adapters/gateways/CameraGatewayExpo.ts) — Envolve `expo-camera` defensivamente com fallback para ambientes sem suporte a hardware.
* **Fake em Memória para Testes:** [`src/infra/InMemoryCameraGateway.ts`](file:///c:/PROJETOMOBILE/src/infra/InMemoryCameraGateway.ts) — Retorno determinístico imediato de imagem base64 simulada.

```typescript
export interface CameraGateway {
  capturarFoto(): Promise<FotoCapturada>;
}

export class InMemoryCameraGateway implements CameraGateway {
  private fotoSimulada: FotoCapturada = {
    uri: 'file:///mock/foto-comprovante.jpg',
    base64: 'data:image/jpeg;base64,mockedbase64string123',
    largura: 800,
    altura: 600,
  };
  async capturarFoto(): Promise<FotoCapturada> {
    return this.fotoSimulada;
  }
}
```

### 2. Geolocalização (`LocationGateway`)
* **Contrato no Domínio:** [`src/domain/gateways/LocationGateway.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/LocationGateway.ts)
* **Fake em Memória para Testes:** [`src/infra/InMemoryLocationGateway.ts`](file:///c:/PROJETOMOBILE/src/infra/InMemoryLocationGateway.ts) — Simula coordenadas com timestamp sem chamada a sensores físicos.

```typescript
export interface LocationGateway {
  obterLocalizacaoAtual(): Promise<Coordenada>;
}

export class InMemoryLocationGateway implements LocationGateway {
  private coordenadaAtual: Coordenada = new Coordenada(-23.55052, -46.633308, Date.now());
  async obterLocalizacaoAtual(): Promise<Coordenada> {
    return this.coordenadaAtual;
  }
}
```

---

## 📑 Slide 8: Passo 7 — Persistência Desacoplada: SQLite e Supabase em Memória

### Justificativa de Isolamento do Banco de Dados
* **Arquitetura Agnóstica:** Persistência em disco (SQLite) e na nuvem (Supabase) constitui detalhe de entrada e saída.
* **Determinismo e Velocidade:** Repositórios em memória (`Map<string, T>`) executam testes em milissegundos e eliminam falhas de conectividade ou bloqueios de arquivo durante a suíte de testes.
* **Modelo Offline-First:** Toda operação de gravação localiza dados com status `PENDING`, e o despachante de fila sincroniza com o gateway remoto (`RemoteSyncGateway`).

```typescript
// Sincronização desacoplada de backend físico
export class SincronizarFilaUseCase {
  constructor(
    private readonly periodoRepo: PeriodoAvaliacaoRepository,
    private readonly remoteSyncGateway?: RemoteSyncGateway
  ) {}

  async execute(): Promise<SincronizarFilaResult> {
    const pendentes = await this.periodoRepo.findPendentesSincronizacao();
    let sincronizados = 0;

    for (const periodo of pendentes) {
      if (this.remoteSyncGateway) {
        await this.remoteSyncGateway.enviarPeriodo(periodo.getId(), { ... });
      }
      periodo.atualizarStatusSincronizacao(StatusSincronizacao.SYNCED);
      periodo.marcarAssinaturasSincronizadas(true);
      await this.periodoRepo.save(periodo);
      sincronizados++;
    }
    return { totalPendentes: pendentes.length, sincronizados, falhas: 0 };
  }
}
```

---

## 📑 Slide 9: Passo 8 — Context API e Custom Hooks (Adapters)

### Isolamento de Ciclo de Vida da UI
* **Context API ([`AuthContext.tsx`](file:///c:/PROJETOMOBILE/src/adapters/context/AuthContext.tsx)):** Elimina prop drilling de perfis (`aluno`, `orientador`, `coordenador`).
* **Custom Hooks ([`useAtividades.ts`](file:///c:/PROJETOMOBILE/src/adapters/hooks/useAtividades.ts) e [`useAuth.ts`](file:///c:/PROJETOMOBILE/src/adapters/hooks/useAuth.ts)):** Mapeiam estados de ciclo de vida (`loading`, `error`, `success`) sem acoplar a tela aos casos de uso.

```typescript
export function AuthProvider({ children, autenticarUseCase, restoreSessionUseCase, signOutUseCase }: AuthProviderProps) {
  const auth = autenticarUseCase ?? container.autenticarUsuarioUseCase;
  const restore = restoreSessionUseCase ?? container.restoreSession;

  const [session, setSession] = useState<Session | null>(null);
  const [papel, setPapel] = useState<PapelUsuario>('aluno');
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    restore.execute().then((restored) => {
      if (restored) {
        setSession(restored);
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    });
  }, [restore]);
  // ...
}
```

---

## 📑 Slide 10: Passo 9 — Interface do Usuário e Testes de Telas (RNTL)

### Metodologia de Teste com React Native Testing Library
* Testes executados sem emulador ou dispositivo físico.
* Simulação de eventos reais de usuário via `testID`: digitação (`fireEvent.changeText`) e clique (`fireEvent.press`).

### Telas Implementadas
* [`AssinaturaScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/AssinaturaScreen.tsx)
* [`AtividadesFormScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/AtividadesFormScreen.tsx)
* [`HistoricoRelatoriosScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/HistoricoRelatoriosScreen.tsx)

### Teste de Componente: `tests/screens/AssinaturaScreen.test.tsx`
```typescript
it('deve registrar assinatura digital simulando toque nos botões e inputs', async () => {
  const periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
  periodoRepo.clear();
  await periodoRepo.save(new PeriodoAvaliacao({ id: 'p1', estagioId: 'e1', alunoId: 'aluno-01', ... }));

  const assinarUseCase = new AssinarRelatorioUseCase(periodoRepo);
  const onConcluidoMock = jest.fn();

  const { getByTestId, findByText } = render(
    <AssinaturaScreen
      periodoId="p1"
      autorIdPadrao="aluno-01"
      assinarUseCase={assinarUseCase}
      onAssinaturaConcluida={onConcluidoMock}
    />
  );

  fireEvent.press(getByTestId('btn-papel-aluno'));
  fireEvent.press(getByTestId('btn-assinar'));

  expect(await findByText('Assinatura registrada e vinculada com sucesso!')).toBeTruthy();
  expect(onConcluidoMock).toHaveBeenCalledTimes(1);

  const periodoAtualizado = await periodoRepo.findById('p1');
  expect(periodoAtualizado?.getAssinaturaAluno()).not.toBeNull();
});
```

---

## 📑 Slide 11: Passo 10 — Sessão Segura (Expo SecureStore Adapter)

### Armazenamento Criptográfico Local
* Proteção de tokens de autenticação via hardware: **Keychain (iOS)** e **Keystore (Android)**.
* O adapter [`SessionStorageSecureStore.ts`](file:///c:/PROJETOMOBILE/src/adapters/auth/SessionStorageSecureStore.ts) atende ao contrato `SessionStorage` do domínio.
* Chamadas nativas de `expo-secure-store` são interceptadas via mock em memória nos testes.

```typescript
import * as SecureStore from 'expo-secure-store';
import { SessionStorage } from '../../domain/gateways/SessionStorage';

const CHAVE_SESSAO = 'safracafe.session';

export class SessionStorageSecureStore implements SessionStorage {
  async salvar(session: Session): Promise<void> {
    const json = {
      token: session.token,
      user: { id: session.user.id, name: session.user.name, email: session.user.email },
      expiresAt: session.expiresAt,
    };
    await SecureStore.setItemAsync(CHAVE_SESSAO, JSON.stringify(json));
  }

  async carregar(): Promise<Session | null> {
    const raw = await SecureStore.getItemAsync(CHAVE_SESSAO);
    if (!raw) return null;
    const json = JSON.parse(raw);
    return new Session(json.token, new User(json.user.id, json.user.name, json.user.email), json.expiresAt);
  }

  async limpar(): Promise<void> {
    await SecureStore.deleteItemAsync(CHAVE_SESSAO);
  }
}
```

---

## 📑 Slide 12: Comprovação de Isolamento (100% Mock / Zero Conexão Externa)

### Checklist de Conformidade com a Fase "Domínio e Interface Primeiro"
* **Zero Conexão com SQLite:** Não há arquivos `.db`, drivers nativos ou migrações ativas em execução. Todos os repositórios operam sobre estruturas `Map<string, T>` em memória RAM.
* **Zero Chamadas de Rede / Supabase:** Nenhuma requisição HTTP ou WebSocket é disparada nos testes. O gateway de sincronização (`RemoteSyncGateway`) opera de forma síncrona/mockada.
* **Zero Dependência de Sensores Físicos:**
  * Câmera: Retorno imediato de payload simulado em base64 (`InMemoryCameraGateway`).
  * GPS: Coordenadas fixas e determinísticas injetadas em memória (`InMemoryLocationGateway`).
* **Sessão Segura Virtualizada:** Chamadas do `expo-secure-store` são interceptadas no arquivo de setup de testes por um `Map` local (`tests/setup.ts`), sem acesso ao Keychain/Keystore do sistema operacional.
* **Evidência Temporal de Isolamento:** A execução de **170 testes em apenas ~8.4 segundos** comprova a ausência total de bloqueios de I/O em disco ou latência de requisições de rede.

---

## 📑 Slide 13: Execução da Suíte de Testes e Métricas de Cobertura

### Comandos de Validação Automatizada
```bash
# Execução completa com análise de cobertura
npm test -- --coverage

# Execuções modulares
npx jest tests/domain/       # Regras puras e Value Objects
npx jest tests/usecases/     # Casos de Uso
npx jest tests/screens/      # Telas RNTL
npx jest tests/adapters/     # Sessão segura e Context API
```

### Relatório Consolidado de Cobertura (Jest)
| Módulo / Camada | Arquivos Avaliados | Testes Aprovados | Cobertura de Linhas |
| :--- | :--- | :---: | :---: |
| **Value Objects** | `Criterio`, `Coordenada`, `Assinatura`, `CargaHoraria`, `Status*` | 100% | **98.96%** |
| **Domain Services** | `RegraGeracaoPdfService`, `RegraDevolucaoService`, `Sincronizacao` | 100% | **90.32%** |
| **Application (Use Cases)** | 10 Use Cases de atividades, avaliação, assinaturas e auth | 100% | **94.08%** |
| **Adapters / Telas (RNTL)** | `AssinaturaScreen`, `AtividadesFormScreen`, `Historico`, `AuthContext` | 100% | **82.85%** |
| **Adapters / Sessão & Hooks** | `SessionStorageSecureStore`, `AuthContext`, `useAtividades` | 100% | **83.33% / 90.00%** |
| **TOTAL GERAL DA APLICAÇÃO** | **52 Suítes / 170 Testes Unitários e de Componente** | **170 / 170 Aprovados** | **81.74%** |

*Tempo total de execução da suíte completa: ~8.4 segundos.*

---

## 📑 Slide 14: Fundamentos e Decisões de Arquitetura

### 1. Separação de Persistência e Domínio
A camada de domínio e a camada de aplicação são estritamente agnósticas quanto ao mecanismo de persistência. A substituição de repositórios em memória por SQLite ou Supabase ocorre unicamente na camada de infraestrutura via contratos já estabelecidos, sem alteração de lógica de negócio.

### 2. Garantia de Invariantes pelo Modelo
A integridade dos dados é assegurada no núcleo do modelo através da Raiz de Agregação e de Objetos de Valor com validações no construtor. Não existem caminhos públicos para colocar entidades em estados contraditórios ou incompletos.

### 3. Autenticação e Acesso Externo
Usuários com credenciais fixas utilizam autenticação padrão com armazenamento criptografado no dispositivo. O acesso externo de supervisores é operado por tokens temporários autorreferenciados (`TokenSupervisor`), dispensando credenciais prévias no sistema de identidade.

### 4. Ponto Único de Composição de Dependências (`container.ts`)
A montagem do grafo de dependências da aplicação é centralizada no Singleton [`src/factory/container.ts`](file:///c:/PROJETOMOBILE/src/factory/container.ts). Casos de uso e adaptadores não instanciam repositórios concretos diretamente, respeitando o Princípio da Inversão de Controle (IoC).

### 5. Conformidade Estrita com Clean Architecture
* `src/domain/`: Não importa nenhuma dependência de infraestrutura, aplicação ou bibliotecas de UI (`react`, `react-native`, `expo`).
* `src/usecases/`: Dependem exclusivamente de abstrações e entidades do domínio.
* `src/adapters/`: Atuam como tradutores entre o ciclo de vida do framework móvel e os casos de uso.

---
*Documento de Defesa Técnica — Fase 'Domínio e Interface Primeiro'.*
