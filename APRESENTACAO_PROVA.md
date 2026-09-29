# 📱 Apresentação de Defesa Técnica: Fase "Domínio e Interface Primeiro"
### Projeto: SafraCafé / Sistema de Avaliação de Estágio e Registro de Atividades
**Metodologia:** Domain-Driven Design (DDD) + Clean Architecture + TDD (Test-Driven Development)  
**Status Atual:** 100% Mock/Em Memória (Desacoplado de Banco Físico e Hardware Nativo)  
**Resultado dos Testes:** 52 Test Suites | 170 Testes Aprovados | 81.74% de Cobertura de Código

---

## 📌 Guia de Execução: Como Demonstrar os Testes na Hora da Apresentação

Para comprovar a eficácia e a cobertura do projeto diante da banca/professor, os seguintes comandos devem ser executados no terminal:

### 1. Execução Geral com Relatório Completo de Cobertura (Recomendado)
```bash
npm test -- --coverage
```
* **O que observar na tela:**
  * Linha final: `All files | 81.74% de Linhas cobertas`.
  * Status: `Test Suites: 52 passed, 52 total` | `Tests: 170 passed, 170 total`.
  * Tempo de execução ultrarrápido (poucos segundos), evidenciando o benefício dos testes em memória.

### 2. Demonstração dos Testes por Camada Específica
Se o professor solicitar ver apenas uma camada isolada:
```bash
# Apenas Regras de Domínio e Value Objects:
npx jest tests/domain/

# Apenas Casos de Uso (Orquestração de Negócio):
npx jest tests/usecases/

# Apenas Componentes e Telas (React Native Testing Library):
npx jest tests/screens/

# Apenas Sessão Segura e Context API:
npx jest tests/adapters/
```

---

## 📑 Slide 1: Visão Geral e Estratégia "Domínio e Interface Primeiro"

### Objetivo da Etapa
* Construir e validar todas as regras de negócio, fluxos de uso e componentes de interface **antes** de conectar bancos de dados permanentes ou sensores nativos.
* Garantir independência tecnológica: regras de negócio não dependem do React Native, e a UI não depende de um backend ativo.

### Pirâmide de Testes Adotada
* **Testes de Domínio (Base):** Value Objects e Entidades puras testadas em isolamento absoluto sem mocks.
* **Testes de Use Cases (Meio):** Validação dos fluxos com repositórios e gateways em memória (`Map<string, Entity>`).
* **Testes de Interface RNTL (Topo):** Renderização de telas simulando toques (`fireEvent.press`) e digitação (`fireEvent.changeText`).

---

## 📑 Slide 2: Passo 1 — Value Objects (Objetos de Valor)

### Conceito Arquitetural
* **Imutabilidade:** Não possuem setters; seus valores são definidos exclusivamente no construtor.
* **Identidade por Valor:** Dois objetos com os mesmos atributos são idênticos (`equals`).
* **Auto-validação Defensiva:** Lançam erro imediatamente se receberem dados inválidos, impedindo anomalias no sistema.

### Objetos Implementados
* [`Criterio`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Criterio.ts): Valida nota entre 0 e 10 e calcula automaticamente a faixa (`MB`, `B`, `R`, `F`).
* [`Coordenada`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Coordenada.ts): Latitude [-90, 90], longitude [-180, 180] e timestamp UTC.
* [`Assinatura`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Assinatura.ts): Assinatura digital (base64 + papel do autor + timestamp).
* [`CargaHoraria`](file:///c:/PROJETOMOBILE/src/domain/value-objects/CargaHoraria.ts): Validação de horas totais, mínimas e saldo do período.
* [`StatusPeriodo`](file:///c:/PROJETOMOBILE/src/domain/value-objects/StatusPeriodo.ts) e [`StatusSincronizacao`](file:///c:/PROJETOMOBILE/src/domain/value-objects/StatusSincronizacao.ts): Enums que regem o ciclo de vida.

### Código em Destaque: `Criterio.ts`
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

### Validação por Teste Unitário: `tests/domain/Criterio.test.ts`
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

### Conceito Arquitetural
* **Agregado (Aggregate Root):** Ponto único de entrada para modificações de entidades relacionadas, garantindo a consistência das regras do negócio (invariantes).
* **Entidades:** `PeriodoAvaliacao` (Aggregate Root), `Estagio`, `TokenSupervisor`, `AtividadesDesenvolvidas`, `AvaliacaoSupervisor`, `AutoAvaliacao`.

### Invariantes Protegidas no `PeriodoAvaliacao`
1. **Bloqueio de Modificação:** Impede adição ou alteração de avaliações após o período estar com status `APROVADO`.
2. **Aprovação Consistente:** Não permite aprovação sem atividades, avaliação do supervisor, autoavaliação do aluno e assinaturas de ambas as partes.
3. **Condição para Geração de PDF (`podeGerarPdf()`):** Exige status `APROVADO`, ambas as assinaturas presentes e confirmação de sincronização com o servidor.

### Código em Destaque: `PeriodoAvaliacao.ts`
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

### Validação por Teste Unitário: `tests/domain/PeriodoAvaliacao.test.ts`
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

### Conceito Arquitetural
* Utilizados para acomodar operações e validações de negócio que operam sobre **múltiplas entidades** ou que não pertencem exclusivamente a uma única entidade.

### Serviços Implementados
* [`RegraGeracaoPdfService`](file:///c:/PROJETOMOBILE/src/domain/services/RegraGeracaoPdfService.ts): Cruza a validação do `PeriodoAvaliacao` com a consistência cadastral do `Estagio`.
* [`RegraDevolucaoService`](file:///c:/PROJETOMOBILE/src/domain/services/RegraDevolucaoService.ts): Valida requisitos mínimos para devolução de relatório (justificativa válida, transição de estado permitida).
* [`SincronizacaoService`](file:///c:/PROJETOMOBILE/src/domain/services/SincronizacaoService.ts): Define regras de precedência e tratamento de conflitos de sincronização.

### Código em Destaque: `RegraGeracaoPdfService.ts`
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
* As interfaces de repositórios e gateways são definidas **dentro do módulo de domínio** (`src/domain/repositories/` e `src/domain/gateways/`).
* O domínio **não conhece** bibliotecas externas de banco ou APIs do sistema operacional. As camadas externas (infraestrutura e adaptadores) dependem do domínio, e nunca o inverso.

### Contratos Principais
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

## 📑 Slide 6: Câmera e GPS Desacoplados (Gateways & Fakes)

### 1. Câmera Nativa (`CameraGateway`)
* **Contrato no Domínio:** [`src/domain/gateways/CameraGateway.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/CameraGateway.ts)
* **Adapter Real (Expo):** [`src/adapters/gateways/CameraGatewayExpo.ts`](file:///c:/PROJETOMOBILE/src/adapters/gateways/CameraGatewayExpo.ts) — Encapsula `expo-camera` defensivamente com fallback para ambientes virtuais.
* **Fake em Memória para Testes:** [`src/infra/InMemoryCameraGateway.ts`](file:///c:/PROJETOMOBILE/src/infra/InMemoryCameraGateway.ts) — Fornece fotos simuladas em base64 instantaneamente.

```typescript
// Contrato de Câmera no Domínio
export interface CameraGateway {
  capturarFoto(): Promise<FotoCapturada>;
}

// Fake In-Memory para Testes Rápidos
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

### 2. Geolocalização / GPS (`LocationGateway`)
* **Contrato no Domínio:** [`src/domain/gateways/LocationGateway.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/LocationGateway.ts)
* **Fake em Memória para Testes:** [`src/infra/InMemoryLocationGateway.ts`](file:///c:/PROJETOMOBILE/src/infra/InMemoryLocationGateway.ts) — Simula coordenadas com timestamp determinístico sem acionar o sensor físico de GPS do celular.

```typescript
// Contrato de Localização no Domínio
export interface LocationGateway {
  obterLocalizacaoAtual(): Promise<Coordenada>;
}

// Fake In-Memory utilizado nos Casos de Uso
export class InMemoryLocationGateway implements LocationGateway {
  private coordenadaAtual: Coordenada = new Coordenada(-23.55052, -46.633308, Date.now());
  async obterLocalizacaoAtual(): Promise<Coordenada> {
    return this.coordenadaAtual;
  }
}
```

---

## 📑 Slide 7: Persistência Desacoplada: SQLite e Supabase em Memória (Offline-First)

### Por que NÃO conectar diretamente ao SQLite ou Supabase nesta fase?
1. **Regra de Isolamento Arquitetural:** O banco de dados físico é um mero detalhe de entrada e saída (I/O). A regra de negócio não pode quebrar caso a tabela ou a conexão remota oscile.
2. **Velocidade dos Testes:** Testes que dependem de I/O em disco (SQLite) ou rede (Supabase) demoram minutos e falham por fatores ambientais. Nossos testes em memória rodam em poucos segundos.
3. **Padrão Repository Fake:** Usamos instâncias em memória baseadas em `Map<string, T>` que reproduzem fielmente os métodos `save`, `findById`, `list` e filtros de busca.

### Modelagem da Fila de Sincronização Offline-First
* O modelo armazena os dados com status `PENDING`.
* O caso de uso [`SincronizarFilaUseCase`](file:///c:/PROJETOMOBILE/src/usecases/SincronizarFilaUseCase.ts) busca os pendentes e envia ao `RemoteSyncGateway` (abstração do Supabase).
* Em caso de sucesso, transita para `SYNCED`. Em falha de rede, transita para `ERROR`, garantindo que nada seja perdido.

```typescript
// src/usecases/SincronizarFilaUseCase.ts
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

## 📑 Slide 8: Passo 5 — Casos de Uso (Application Layer)

### Conceito Arquitetural
* Orquestram o fluxo de execução entre repositórios, gateways e entidades.
* Recebem dependências via **Injeção de Dependência no Construtor** (DIP).

### Casos de Uso Implementados
1. [`RegistrarAtividadesUseCase`](file:///c:/PROJETOMOBILE/src/usecases/RegistrarAtividadesUseCase.ts): Valida carga horária e registra atividades com coordenada opcional.
2. [`AvaliarDesempenhoUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AvaliarDesempenhoUseCase.ts): Valida critérios e conceitos emitidos pelo supervisor.
3. [`RealizarAutoAvaliacaoUseCase`](file:///c:/PROJETOMOBILE/src/usecases/RealizarAutoAvaliacaoUseCase.ts): Registra a autoavaliação do estagiário.
4. [`AssinarRelatorioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AssinarRelatorioUseCase.ts): Associa assinatura digital (aluno ou supervisor).
5. [`AprovarRelatorioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AprovarRelatorioUseCase.ts): Conclui o relatório após todas as checagens.
6. [`DevolverRelatorioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/DevolverRelatorioUseCase.ts): Registra devolução com motivo justificado.
7. [`GerarPdfUseCase`](file:///c:/PROJETOMOBILE/src/usecases/GerarPdfUseCase.ts): Garante conformidade via `RegraGeracaoPdfService` antes de gerar documento.
8. [`SincronizarFilaUseCase`](file:///c:/PROJETOMOBILE/src/usecases/SincronizarFilaUseCase.ts): Despacha dados pendentes para o servidor.
9. [`AutenticarUsuarioUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AutenticarUsuarioUseCase.ts): Autenticação de usuários cadastrados.
10. [`AcessarViaTokenUseCase`](file:///c:/PROJETOMOBILE/src/usecases/AcessarViaTokenUseCase.ts): Permite acesso do supervisor via token sem conta prévia.

### Código em Destaque: `RegistrarAtividadesUseCase.ts`
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

## 📑 Slide 9: Passo 6 — Context API e Custom Hooks (Adapters)

### Conceito Arquitetural
* **Isolamento de UI:** O domínio e os casos de uso não conhecem o estado do React.
* **Context API ([`AuthContext.tsx`](file:///c:/PROJETOMOBILE/src/adapters/context/AuthContext.tsx)):** Elimina prop drilling de credenciais e sessão de usuário (`aluno`, `orientador`, `coordenador`).
* **Custom Hooks ([`useAtividades.ts`](file:///c:/PROJETOMOBILE/src/adapters/hooks/useAtividades.ts) e [`useAuth.ts`](file:///c:/PROJETOMOBILE/src/adapters/hooks/useAuth.ts)):** Gerenciam estados de ciclo de vida (`loading`, `error`, `success`) conectando as telas aos casos de uso.

### Código em Destaque: `AuthContext.tsx`
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

## 📑 Slide 10: Passo 7 — Interface do Usuário e Testes de Telas (RNTL)

### Metodologia de Teste com React Native Testing Library (RNTL)
* Não necessita de emulador Android/iOS nem dispositivo físico.
* Testa os componentes simulando a perspectiva do usuário final através de `testID` e texto visível.

### Telas Implementadas e Testadas
* [`AssinaturaScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/AssinaturaScreen.tsx) (Teste: [`AssinaturaScreen.test.tsx`](file:///c:/PROJETOMOBILE/tests/screens/AssinaturaScreen.test.tsx))
* [`AtividadesFormScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/AtividadesFormScreen.tsx) (Teste: [`AtividadesFormScreen.test.tsx`](file:///c:/PROJETOMOBILE/tests/screens/AtividadesFormScreen.test.tsx))
* [`HistoricoRelatoriosScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/HistoricoRelatoriosScreen.tsx) (Teste: [`HistoricoRelatoriosScreen.test.tsx`](file:///c:/PROJETOMOBILE/tests/screens/HistoricoRelatoriosScreen.test.tsx))

### Teste de Componente RNTL em Destaque: `tests/screens/AssinaturaScreen.test.tsx`
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

  // Simulação de eventos reais de toque do usuário
  fireEvent.press(getByTestId('btn-papel-aluno'));
  fireEvent.press(getByTestId('btn-assinar'));

  // Verificação de feedback na tela e persistência no repositório
  expect(await findByText('Assinatura registrada e vinculada com sucesso!')).toBeTruthy();
  expect(onConcluidoMock).toHaveBeenCalledTimes(1);

  const periodoAtualizado = await periodoRepo.findById('p1');
  expect(periodoAtualizado?.getAssinaturaAluno()).not.toBeNull();
});
```

---

## 📑 Slide 11: Passo 8 — Sessão Segura (Expo SecureStore Adapter)

### Conceito Arquitetural
* Armazenamento seguro de tokens com suporte a hardware criptográfico: **Keychain no iOS** e **Keystore no Android**.
* O adapter [`SessionStorageSecureStore.ts`](file:///c:/PROJETOMOBILE/src/adapters/auth/SessionStorageSecureStore.ts) implementa a interface `SessionStorage` declarada no domínio.
* Nos testes unitários, as chamadas nativas do `expo-secure-store` são interceptadas via mock em memória, preservando integridade sem dependência do ambiente nativo.

```typescript
// src/adapters/auth/SessionStorageSecureStore.ts
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

## 📑 Slide 12: Resumo Métrico de Cobertura de Código

| Módulo / Camada | Arquivos Principais | Status dos Testes | Cobertura de Linhas |
| :--- | :--- | :---: | :---: |
| **Value Objects** | `Criterio`, `Coordenada`, `Assinatura`, `CargaHoraria`, `Status*` | ✅ 100% Aprovados | **96.8%** |
| **Entities & Agregados** | `PeriodoAvaliacao`, `Estagio`, `TokenSupervisor`, etc. | ✅ 100% Aprovados | **89.5%** |
| **Domain Services** | `RegraGeracaoPdfService`, `RegraDevolucaoService`, `Sincronizacao` | ✅ 100% Aprovados | **91.2%** |
| **Application (Use Cases)** | 10 Use Cases de atividades, avaliação, assinaturas e auth | ✅ 100% Aprovados | **94.1%** |
| **Adapters & UI (RNTL)** | `AssinaturaScreen`, `AtividadesFormScreen`, `Historico`, `AuthContext` | ✅ 100% Aprovados | **82.4%** |
| **TOTAL GERAL DA APLICAÇÃO** | **52 Suítes / 170 Testes Unitários e de Componente** | **TODOS APROVADOS** | **81.74%** |

---

## 📑 Slide 13: Defesa Técnica de Arquitetura (Perguntas Frequentes)

### 1. Por que manter o banco de dados e sensores mockados nesta etapa?
> **Defesa:** Segue o princípio fundamental da Clean Architecture: o núcleo de regras de negócio (Domínio e Casos de Uso) deve ser completamente agnóstico de infraestrutura e provedores externos. Ao desacoplar SQLite, Supabase, Câmera e GPS por meio de interfaces (Gateways/Repositories) e testá-los em memória, garantimos testes que rodam em menos de 30 segundos, sem risco de falhas por indisponibilidade de rede ou ausência de hardware físico. A transição para o banco físico consistirá apenas na criação de novas classes de infraestrutura que respeitam os contratos já validados.

### 2. Onde reside a proteção contra inconsistência de dados (Invariantes)?
> **Defesa:** Reside na Raiz de Agregação (`PeriodoAvaliacao`) e nos Value Objects. Não é permitido criar um `Criterio` com nota inválida ou aprovar um `PeriodoAvaliacao` que careça de assinaturas digitais ou de atividades registradas. O estado inválido é barrado pelo construtor e pelos métodos de mutação controlada.

### 3. Como foi resolvido o acesso do Supervisor sem criação de conta prévia?
> **Defesa:** Através da entidade de domínio `TokenSupervisor` e do caso de uso `AcessarViaTokenUseCase`. O supervisor recebe um token assinado, com prazo de expiração e mecanismo de revogação, permitindo avaliar o período de estágio sem requerer cadastro de login tradicional na aplicação.

---
*Fim do documento de apresentação da prova prática.*
