# 🎓 Apresentação como Prova: Fase "Domínio e Interface Primeiro"
> **Projeto SafraCafé / Sistema de Gestão e Avaliação de Estágio**  
> **Arquitetura:** Clean Architecture + Domain-Driven Design (DDD) + TDD (Test-Driven Development)  
> **Status da Suíte:** **52 test suites**, **170 testes aprovados**, **81.74% de cobertura de código** (Meta 80%+ batida!)

---

## ⚡ Abertura da Apresentação (30 segundos de impacto)

No terminal, antes de abrir qualquer código, execute:
```bash
npm test -- --coverage
```

### 🗣️ O que falar na abertura:
> *"Boa noite/bom dia, professor(a). Nossa entrega segue rigorosamente a metodologia **'Domínio e Interface Primeiro'** em 100% mock/memória.*  
> *Como podemos ver no relatório do Jest, temos **170 testes unitários e de componentes passando**, com **81.74% de cobertura de linhas**, comprovando que as regras de negócio e as telas estão completamente blindadas e testadas com TDD antes mesmo de conectarmos um banco permanente (SQLite/Supabase) ou sensores físicos."*

---

## 🗺️ Índice do Checklist Sequencial de Apresentação (Passo a Passo)

1. [Passo 1: Value Objects (Objetos de Valor)](#passo-1-value-objects-objetos-de-valor)
2. [Passo 2: Entidades e Agregados (Entities & Aggregate Roots)](#passo-2-entidades-e-agregados)
3. [Passo 3: Domain Services (Serviços de Domínio)](#passo-3-domain-services)
4. [Passo 4: Contratos e Interfaces (Repository & Gateway Interfaces)](#passo-4-contratos-e-interfaces)
5. [Passo 5: Casos de Uso (Application / Use Cases)](#passo-5-casos-de-uso)
6. [Passo 6: Context API e Custom Hooks (Adapters de Estado)](#passo-6-context-api-e-custom-hooks)
7. [Passo 7: Telas e Componentes com RNTL (Interface do Usuário)](#passo-7-telas-e-componentes-com-rntl)
8. [Passo 8: Sessão Segura (SecureStore Adapter)](#passo-8-sessão-segura)
9. [Perguntas que a Banca/Professor Costuma Fazer e Respostas Prontas](#-perguntas-da-bancaprofessor-e-respostas-prontas)

---

## Passo 1: Value Objects (Objetos de Valor)

### 📁 Arquivos para mostrar:
* [`src/domain/value-objects/Criterio.ts`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Criterio.ts)
* [`src/domain/value-objects/Coordenada.ts`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Coordenada.ts)
* [`src/domain/value-objects/Assinatura.ts`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Assinatura.ts)
* [`src/domain/value-objects/CargaHoraria.ts`](file:///c:/PROJETOMOBILE/src/domain/value-objects/CargaHoraria.ts)
* Testes: [`tests/domain/Criterio.test.ts`](file:///c:/PROJETOMOBILE/tests/domain/Criterio.test.ts)

### 🗣️ O que falar:
> *"Começamos pela menor unidade do domínio: os **Value Objects**. Eles são **imutáveis**, não possuem identidade própria (são definidos apenas pelos seus valores) e **se auto-validam no próprio construtor**. É impossível existir um Value Object em estado inválido na memória da nossa aplicação."*

### 💻 Código-chave (`src/domain/value-objects/Criterio.ts`):
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

### 🧪 Teste correspondente (`tests/domain/Criterio.test.ts`):
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

## Passo 2: Entidades e Agregados

### 📁 Arquivos para mostrar:
* [`src/domain/entities/PeriodoAvaliacao.ts`](file:///c:/PROJETOMOBILE/src/domain/entities/PeriodoAvaliacao.ts) (**Aggregate Root**)
* [`src/domain/entities/Estagio.ts`](file:///c:/PROJETOMOBILE/src/domain/entities/Estagio.ts)
* [`src/domain/entities/TokenSupervisor.ts`](file:///c:/PROJETOMOBILE/src/domain/entities/TokenSupervisor.ts)
* Testes: [`tests/domain/PeriodoAvaliacao.test.ts`](file:///c:/PROJETOMOBILE/tests/domain/PeriodoAvaliacao.test.ts)

### 🗣️ O que falar:
> *"No segundo degrau, implementamos as **Entidades** e os **Agregados**. O `PeriodoAvaliacao` é a nossa **Raiz de Agregação (Aggregate Root)**. Ele encapsula e gerencia as `AtividadesDesenvolvidas`, a `AvaliacaoSupervisor`, a `AutoAvaliacao` e as assinaturas.*  
> *Ele protege as **invariantes de negócio**, impedindo estados ilegais — por exemplo: não permite modificar avaliações de um período já aprovado e só libera `podeGerarPdf()` se todas as assinaturas existirem e estiverem sincronizadas."*

### 💻 Código-chave (`src/domain/entities/PeriodoAvaliacao.ts`):
```typescript
export class PeriodoAvaliacao {
  // Invariante 1: Bloqueia nova avaliação se já aprovado
  public registrarAvaliacaoSupervisor(avaliacao: AvaliacaoSupervisor): void {
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido registrar ou alterar avaliação de supervisor em um período já aprovado.');
    }
    this.avaliacaoSupervisor = avaliacao;
    this.atualizarStatusAposAvaliacoes();
  }

  // Invariante 2: Só aprova se tiver atividades, autoavaliação e assinaturas de ambas as partes
  public aprovar(): void {
    if (!this.atividades) throw new Error('Não é possível aprovar um período sem atividades registradas.');
    if (!this.avaliacaoSupervisor) throw new Error('Não é possível aprovar sem a avaliação do supervisor.');
    if (!this.autoAvaliacao) throw new Error('Não é possível aprovar sem a autoavaliação do estagiário.');
    if (!this.assinaturaAluno || !this.assinaturaSupervisor) {
      throw new Error('Não é possível aprovar um período sem as assinaturas de ambas as partes.');
    }
    this.status = StatusPeriodo.APROVADO;
  }

  // Invariante 3: podeGerarPdf() exige aprovado + 2 assinaturas + sincronizadas no servidor
  public podeGerarPdf(): boolean {
    return (
      this.status === StatusPeriodo.APROVADO &&
      this.assinaturaAluno !== null &&
      this.assinaturaSupervisor !== null &&
      this.assinaturasSincronizadas === true
    );
  }
}
```

---

## Passo 3: Domain Services

### 📁 Arquivos para mostrar:
* [`src/domain/services/RegraGeracaoPdfService.ts`](file:///c:/PROJETOMOBILE/src/domain/services/RegraGeracaoPdfService.ts)
* [`src/domain/services/RegraDevolucaoService.ts`](file:///c:/PROJETOMOBILE/src/domain/services/RegraDevolucaoService.ts)
* [`src/domain/services/SincronizacaoService.ts`](file:///c:/PROJETOMOBILE/src/domain/services/SincronizacaoService.ts)
* Testes: [`tests/domain/RegraGeracaoPdfService.test.ts`](file:///c:/PROJETOMOBILE/tests/domain/RegraGeracaoPdfService.test.ts)

### 🗣️ O que falar:
> *"Quando uma regra de validação ou cálculo envolve **múltiplas entidades** ou não pertence naturalmente a apenas uma delas, usamos um **Domain Service**.*  
> *Por exemplo, o `RegraGeracaoPdfService` cruza as regras do `PeriodoAvaliacao` com as do `Estagio`, garantindo coerência antes de qualquer emissão de documento."*

### 💻 Código-chave (`src/domain/services/RegraGeracaoPdfService.ts`):
```typescript
export class RegraGeracaoPdfService {
  public static validar(periodo: PeriodoAvaliacao, estagio?: Estagio): ValidacaoGeracaoPdfResult {
    const erros: string[] = [];
    if (!periodo) return { podeGerar: false, erros: ['Período de avaliação não informado.'] };

    if (!periodo.podeGerarPdf()) {
      if (periodo.getStatus() !== 'aprovado') erros.push('O relatório precisa estar aprovado.');
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

## Passo 4: Contratos e Interfaces

### 📁 Arquivos para mostrar:
* [`src/domain/repositories/PeriodoAvaliacaoRepository.ts`](file:///c:/PROJETOMOBILE/src/domain/repositories/PeriodoAvaliacaoRepository.ts)
* [`src/domain/gateways/CameraGateway.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/CameraGateway.ts)
* [`src/domain/gateways/LocationGateway.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/LocationGateway.ts)
* [`src/domain/gateways/AuthGateway.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/AuthGateway.ts)
* [`src/domain/gateways/SessionStorage.ts`](file:///c:/PROJETOMOBILE/src/domain/gateways/SessionStorage.ts)

### 🗣️ O que falar:
> *"Aqui aplicamos o **Princípio da Inversão de Dependência (DIP)**: as interfaces dos Repositórios e Gateways são declaradas **dentro da camada de domínio**.*  
> *O domínio dita como quer persistir ou como quer acessar a câmera; as camadas externas de infraestrutura apenas implementam esses contratos. Isso nos dá total liberdade para trocar SQLite por Supabase ou usar mocks sem alterar uma linha de regra de negócio."*

### 💻 Código-chave (`src/domain/repositories/PeriodoAvaliacaoRepository.ts` & `CameraGateway.ts`):
```typescript
// Contrato de Repositório no Domínio
export interface PeriodoAvaliacaoRepository {
  save(periodo: PeriodoAvaliacao): Promise<void>;
  findById(id: string): Promise<PeriodoAvaliacao | null>;
  findByEstagioId(estagioId: string): Promise<PeriodoAvaliacao[]>;
  list(): Promise<PeriodoAvaliacao[]>;
  findPendentesSincronizacao(): Promise<PeriodoAvaliacao[]>;
}

// Contrato de Hardware (Câmera) no Domínio
export interface CameraGateway {
  capturarFotoBase64(): Promise<string>;
  solicitarPermissao(): Promise<boolean>;
}
```

---

## Passo 5: Casos de Uso

### 📁 Arquivos para mostrar:
* [`src/usecases/RegistrarAtividadesUseCase.ts`](file:///c:/PROJETOMOBILE/src/usecases/RegistrarAtividadesUseCase.ts)
* [`src/usecases/AvaliarDesempenhoUseCase.ts`](file:///c:/PROJETOMOBILE/src/usecases/AvaliarDesempenhoUseCase.ts)
* [`src/usecases/AssinarRelatorioUseCase.ts`](file:///c:/PROJETOMOBILE/src/usecases/AssinarRelatorioUseCase.ts)
* [`src/infra/InMemoryPeriodoAvaliacaoRepository.ts`](file:///c:/PROJETOMOBILE/src/infra/InMemoryPeriodoAvaliacaoRepository.ts) (Fake com Map)
* Testes: [`tests/usecases/RegistrarAtividadesUseCase.test.ts`](file:///c:/PROJETOMOBILE/tests/usecases/RegistrarAtividadesUseCase.test.ts)

### 🗣️ O que falar:
> *"Os **Casos de Uso (Application Layer)** orquestram a execução. Eles recebem DTOs, buscam as entidades no repositório, invocam os métodos de negócio do domínio e persistem as alterações.*  
> *Eles recebem suas dependências via **Injeção de Dependência no construtor**. Para testá-los, criamos implementações `InMemory*Repository` que usam estruturas `Map` em memória, rodando centenas de testes em milissegundos sem tocar em banco real."*

### 💻 Código-chave (`src/usecases/RegistrarAtividadesUseCase.ts`):
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

### 🧪 Teste com Repositório Fake (`tests/usecases/RegistrarAtividadesUseCase.test.ts`):
```typescript
it('deve registrar atividades com sucesso usando InMemoryPeriodoAvaliacaoRepository', async () => {
  const repo = InMemoryPeriodoAvaliacaoRepository.getInstance();
  repo.clear();
  await repo.save(new PeriodoAvaliacao({ id: 'p1', estagioId: 'e1', alunoId: 'a1', numeroPeriodo: 1, ... }));

  const useCase = new RegistrarAtividadesUseCase(repo);
  const resultado = await useCase.execute({
    periodoId: 'p1',
    descricao: 'Desenvolvimento do app mobile',
    horasTotais: 120,
    horasMinimas: 100,
    horasPeriodo: 20,
  });

  expect(resultado.getAtividades()?.getDescricao()).toBe('Desenvolvimento do app mobile');
});
```

---

## Passo 6: Context API e Custom Hooks

### 📁 Arquivos para mostrar:
* [`src/adapters/context/AuthContext.tsx`](file:///c:/PROJETOMOBILE/src/adapters/context/AuthContext.tsx)
* [`src/adapters/hooks/useAuth.ts`](file:///c:/PROJETOMOBILE/src/adapters/hooks/useAuth.ts)
* [`src/adapters/hooks/useAtividades.ts`](file:///c:/PROJETOMOBILE/src/adapters/hooks/useAtividades.ts)
* Testes: [`tests/adapters/AuthContext.test.tsx`](file:///c:/PROJETOMOBILE/tests/adapters/AuthContext.test.tsx)

### 🗣️ O que falar:
> *"Na camada de **Adapters**, temos a **Context API** e os **Custom Hooks**.*  
> *O `AuthContext` elimina o Prop Drilling do usuário autenticado e dos papéis (Aluno, Orientador ou Coordenação).*  
> *Já os hooks como `useAtividades` e `useAuth` fazem a ponte entre o ciclo de vida do React Native (estados de loading, erro e sucesso) e os Casos de Uso puros, impedindo que as telas fiquem acopladas à lógica de orquestração."*

### 💻 Código-chave (`src/adapters/context/AuthContext.tsx`):
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

## Passo 7: Telas e Componentes com RNTL

### 📁 Arquivos para mostrar:
* [`src/adapters/screens/AssinaturaScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/AssinaturaScreen.tsx)
* [`src/adapters/screens/AtividadesFormScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/AtividadesFormScreen.tsx)
* [`src/adapters/screens/HistoricoRelatoriosScreen.tsx`](file:///c:/PROJETOMOBILE/src/adapters/screens/HistoricoRelatoriosScreen.tsx)
* Testes RNTL: [`tests/screens/AssinaturaScreen.test.tsx`](file:///c:/PROJETOMOBILE/tests/screens/AssinaturaScreen.test.tsx)

### 🗣️ O que falar:
> *"As telas foram construídas com componentes nativos (`<View>`, `<Text>`, `<TextInput>`, `<TouchableOpacity>`), estilizadas com `StyleSheet` e flexbox.*  
> *Para testá-las sem precisar rodar emulador ou conectar dispositivo físico, usamos o **React Native Testing Library (RNTL)**. Nós simulamos as ações reais do usuário — digitação (`fireEvent.changeText`) e cliques (`fireEvent.press`) —, injetando os Casos de Uso com repositórios fakes."*

### 💻 Código-chave do Teste RNTL (`tests/screens/AssinaturaScreen.test.tsx`):
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

  // 1. Simula toque no botão de escolher papel Aluno
  fireEvent.press(getByTestId('btn-papel-aluno'));

  // 2. Simula toque no botão de Assinar
  fireEvent.press(getByTestId('btn-assinar'));

  // 3. Validação do feedback visual na tela
  expect(await findByText('Assinatura registrada e vinculada com sucesso!')).toBeTruthy();
  expect(onConcluidoMock).toHaveBeenCalledTimes(1);

  // 4. Confirmação de persistência no repositório
  const periodoAtualizado = await periodoRepo.findById('p1');
  expect(periodoAtualizado?.getAssinaturaAluno()).not.toBeNull();
});
```

---

## Passo 8: Sessão Segura

### 📁 Arquivos para mostrar:
* [`src/adapters/auth/SessionStorageSecureStore.ts`](file:///c:/PROJETOMOBILE/src/adapters/auth/SessionStorageSecureStore.ts)
* Testes: [`tests/adapters/SessionStorageSecureStore.test.ts`](file:///c:/PROJETOMOBILE/tests/adapters/SessionStorageSecureStore.test.ts)

### 🗣️ O que falar:
> *"Para finalizar o checklist, implementamos a segurança de sessão com o `SessionStorageSecureStore`.*  
> *Ele implementa a interface `SessionStorage` do domínio, atuando como um adapter sobre a biblioteca nativa `expo-secure-store`. Isso garante que tokens e credenciais sejam gravados com criptografia no hardware do dispositivo — **Keychain no iOS e Keystore no Android** — sem expor dados em `AsyncStorage` comum.*  
> *Nos testes, o `expo-secure-store` é mockado para garantir execução rápida e determinística."*

### 💻 Código-chave (`src/adapters/auth/SessionStorageSecureStore.ts`):
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

## 💡 Perguntas da Banca/Professor e Respostas Prontas

### 1. "Por que vocês não colocaram o banco SQLite logo de cara?"
> **Resposta:** *"Porque seguimos a metodologia de Engenharia de Software **'Domínio e Interface Primeiro'**. Se acoplássemos o código ao SQLite logo no início, os testes unitários seriam lentos e qualquer mudança de regra exigiria migrações de banco. Com o Domínio e os Use Cases blindados por interfaces e testados com Fakes, podemos plugar o SQLite ou Supabase amanhã sem alterar uma única linha das regras de negócio."*

### 2. "O que impede o domínio de acessar bibliotecas do React ou do Expo?"
> **Resposta:** *"A **Regra de Dependência da Clean Architecture**. A camada `src/domain/` é puramente TypeScript. Nenhuma classe ou função do domínio importa `@react`, `react-native`, `expo-*` ou bibliotecas de UI. Ela só conhece a si mesma."*

### 3. "Qual a diferença entre o `Criterio` e o `PeriodoAvaliacao`?"
> **Resposta:** *"`Criterio` é um **Value Object**: é imutável, não tem ID e dois critérios com mesmo nome e nota são idênticos (`equals`). Já o `PeriodoAvaliacao` é uma **Entidade** e **Aggregate Root**: possui uma identidade única (`id`), possui um ciclo de vida que passa por vários estados (Rascunho, Pendente, Aprovado, Devolvido) e garante a consistência das entidades internas filhas."*

### 4. "Como é feita a Injeção de Dependências no projeto?"
> **Resposta:** *"Fazemos Injeção de Dependência via construtor nos Use Cases e Telas. Para unificar a instanciação em tempo de execução, temos o arquivo [`src/factory/container.ts`](file:///c:/PROJETOMOBILE/src/factory/container.ts), que monta o grafo de dependências unindo os repositórios Singleton com os Use Cases."*

---

## 📊 Tabela de Cobertura de Testes (Resultado Real da Suíte)

| Camada | Arquivos Testados | Status | Cobertura |
| :--- | :--- | :---: | :---: |
| **Value Objects** | `Criterio`, `Coordenada`, `Assinatura`, `CargaHoraria`, `Status*` | ✅ 100% Passando | **> 90%** |
| **Entities / Roots** | `PeriodoAvaliacao`, `Estagio`, `TokenSupervisor`, etc. | ✅ 100% Passando | **> 85%** |
| **Domain Services** | `RegraGeracaoPdfService`, `RegraDevolucaoService`, `Sincronizacao` | ✅ 100% Passando | **> 90%** |
| **Use Cases** | Todos os 10 use cases de atividades, avaliações, pdf e sessão | ✅ 100% Passando | **94.14%** |
| **Adapters & Telas** | `AssinaturaScreen`, `AtividadesFormScreen`, `Historico`, `AuthContext` | ✅ 100% Passando | **> 80%** |
| **TOTAL GERAL** | **52 Suítes / 170 Testes** | **TODOS APROVADOS** | **81.74% de Linhas** |

---
*Documento pronto para defesa da prova prática. Boa apresentação!*
