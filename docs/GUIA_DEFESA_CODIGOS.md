# SafraCafé — Guia Definitivo de Defesa Técnica da Prova
## Resumo Explicativo dos Códigos, Invariantes e Possíveis Perguntas da Banca

> **Fase:** "Domínio e Interface Primeiro" (100% Mock / 91.82% Cobertura / 234 Testes / Zero I/O)  
> **Arquitetura:** Clean Architecture + Domain-Driven Design (DDD) + Test-Driven Development (TDD)

---

## 🧭 Visão Panorâmica da Apresentação
A defesa foi estruturada exatamente na ordem exigida pelo checklist da disciplina:
```
1. Telas Mobile (Login, Colheita, Trabalhadores, Despesas, Mapa)
2. Checklist Sequencial de Construção (Os 8 passos)
3. Camada de Domínio Puro (Value Objects, Entidades & Agregados, Domain Services)
4. Contratos e DIP (Interfaces de Repositórios e Gateways)
5. Camada de Aplicação (10 Use Cases com ciclo Red-Green-Refactor)
6. Hardware Desacoplado (Gateways e Fakes de Câmera e GPS)
7. Persistência Offline-First & Resolução de Conflitos
8. Context API & Custom Hooks (Adapters sem Prop Drilling)
9. Telas RNTL (Testes com fireEvent e sem emulador físico)
10. Sessão Segura (Keychain no iOS / Keystore no Android)
11. Comprovação de Isolamento 100% Mock
12. Métricas Consolidadas (57 Suites, 234 Testes, 91.82% Cobertura)
```

---

# 1. Slide 8: Value Objects (Objetos de Valor)

### 📄 Código em Destaque: `src/domain/value-objects/Criterio.ts`
```typescript
export type FaixaCriterio = 'MB' | 'B' | 'R' | 'F';

export class Criterio {
  private readonly nome: string;
  private readonly nota: number;

  constructor(nome: string, nota: number) {
    if (!nome || nome.trim().length === 0) {
      throw new Error('O nome do critério não pode ser vazio.');
    }
    if (typeof nota !== 'number' || isNaN(nota)) {
      throw new Error('A nota do critério deve ser um número válido.');
    }
    if (nota < 0 || nota > 10) {
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

### 🔍 Partes Mais Importantes:
1. **Auto-validação no Construtor:** Impede a existência de um critério com nome vazio ou nota fora do intervalo de 0 a 10.
2. **Imutabilidade (`readonly`):** Uma vez criado, o estado nunca é mutado. Se a nota mudar, cria-se uma nova instância.
3. **Cálculo de Conceito (`getFaixa`):** Converte a nota decimal na escala oficial: MB (>=8.5), B (>=7.0), R (>=5.0), F (<5.0).
4. **Igualdade Estrutural (`equals`):** Dois VOs são iguais se seus valores internos forem idênticos, não por ponteiro de memória ou ID.

### ❓ Possíveis Perguntas da Banca e Como Responder:
- **P: "Por que Criterio não tem um campo `id`?"**  
  **R:** *"Porque no DDD, Value Objects são definidos puramente por seus atributos, não por identidade. Dois critérios chamados 'Pontualidade' com nota 9.0 são conceitualmente o mesmo objeto de valor."*
- **P: "Quais outros Value Objects existem no projeto?"**  
  **R:** *"Temos `Coordenada` (valida latitude [-90,90], longitude [-180,180] e timestamp), `Assinatura` (base64 criptográfico e data/hora), `CargaHoraria` (horas totais, mínimas e saldo do período), `StatusPeriodo` e `StatusSincronizacao`."*

---

# 2. Slide 9: Entidades & Agregados

### 📄 Código em Destaque: `src/domain/entities/PeriodoAvaliacao.ts`
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
    if (!this.atividades) {
      throw new Error('Não é possível aprovar um período sem atividades registradas.');
    }
    if (!this.avaliacaoSupervisor) {
      throw new Error('Não é possível aprovar um período sem a avaliação do supervisor.');
    }
    if (!this.autoAvaliacao) {
      throw new Error('Não é possível aprovar um período sem a autoavaliação do estagiário.');
    }
    if (!this.assinaturaAluno || !this.assinaturaSupervisor) {
      throw new Error('Não é possível aprovar um período sem as assinaturas de ambas as partes.');
    }
    this.status = StatusPeriodo.APROVADO;
    this.motivoDevolucao = undefined;
  }

  public podeGerarPdf(): boolean {
    const statusAprovado = this.status === StatusPeriodo.APROVADO;
    const temTodasAssinaturas = this.assinaturaAluno !== null && this.assinaturaSupervisor !== null;
    const sincronizadas = this.assinaturasSincronizadas === true;
    return statusAprovado && temTodasAssinaturas && sincronizadas;
  }
}
```

### 🔍 Partes Mais Importantes:
1. **Raiz de Agregação (Aggregate Root):** Toda modificação em `AtividadesDesenvolvidas`, `AvaliacaoSupervisor`, `AutoAvaliacao` ou `Assinatura` passa obrigatoriamente pelos métodos do `PeriodoAvaliacao`.
2. **Proteção de Invariantes em `aprovar()`:** Bloqueia a aprovação caso falte qualquer uma das 4 peças (atividades, autoavaliação, avaliação do supervisor e assinaturas de ambas as partes).
3. **Bloqueio de Mutação Pós-Aprovação:** Não permite registrar 2ª avaliação após o status ser `APROVADO`.
4. **Regra de PDF (`podeGerarPdf`):** Só permite geração se estiver aprovado E com assinaturas digitalmente sincronizadas.
5. **Entidades Satélites com Raiz Própria:** `Estagio` (ciclo do estágio) e `TokenSupervisor` (token temporário de supervisor com expiração e revogação, permitindo acesso sem login tradicional).

### ❓ Possíveis Perguntas da Banca:
- **P: "O que é uma invariante de negócio e onde ela é garantida?"**  
  **R:** *"Invariante é uma regra corporativa que deve ser verdadeira o tempo todo. No DDD, quem garante as invariantes é a própria Entidade/Agregado, rejeitando qualquer operação ilegal com exceções antes de gravar."*
- **P: "Como o supervisor avalia se ele não tem conta no aplicativo?"**  
  **R:** *"Criamos a entidade `TokenSupervisor`, que possui UUID próprio, data de expiração e flag de revogação. Ele acessa via link/token com o use case `AcessarViaTokenUseCase` sem necessitar de conta ou senha padrão."*

---

# 3. Slide 10: Domain Services (Serviços de Domínio)

### 📄 Códigos em Destaque (3 Abas Interativas):

#### 1. `src/domain/services/RegraGeracaoPdfService.ts`
```typescript
export class RegraGeracaoPdfService {
  public static validar(periodo: PeriodoAvaliacao, estagio?: Estagio): ValidacaoGeracaoPdfResult {
    const erros: string[] = [];
    if (!periodo) return { podeGerar: false, erros: ['Período de avaliação não informado.'] };

    if (!periodo.podeGerarPdf()) {
      if (periodo.getStatus() !== 'aprovado') erros.push('O relatório do período precisa estar aprovado para geração de PDF.');
      if (!periodo.getAssinaturaAluno() || !periodo.getAssinaturaSupervisor()) erros.push('O relatório deve conter as assinaturas do aluno e do supervisor.');
      if (!periodo.isAssinaturasSincronizadas()) erros.push('Todas as assinaturas digitais devem estar sincronizadas com o servidor.');
    }

    if (estagio && estagio.getId() !== periodo.getEstagioId()) {
      erros.push('O estágio fornecido não corresponde ao estágio vinculado ao período de avaliação.');
    }

    return { podeGerar: erros.length === 0, erros };
  }
}
```

#### 2. `src/domain/services/RegraDevolucaoService.ts`
```typescript
export class RegraDevolucaoService {
  public static validarDevolucao(periodo: PeriodoAvaliacao, motivo: string): ValidacaoDevolucaoResult {
    const motivosInvalidez: string[] = [];
    if (!periodo) return { podeDevolver: false, motivosInvalidez: ['Período de avaliação inexistente.'] };
    if (periodo.getStatus() === StatusPeriodo.APROVADO) {
      motivosInvalidez.push('Não é permitido devolver um período que já foi aprovado definitivamente.');
    }
    if (!motivo || motivo.trim().length < 5) {
      motivosInvalidez.push('A justificativa da devolução deve possuir no mínimo 5 caracteres explicativos.');
    }
    return { podeDevolver: motivosInvalidez.length === 0, motivosInvalidez };
  }
}
```

#### 3. `src/domain/services/SincronizacaoService.ts`
```typescript
export class SincronizacaoService {
  resolverConflito(updatedAtLocal: number, updatedAtRemoto: number): 'local' | 'remoto' {
    if (updatedAtRemoto > updatedAtLocal) return 'remoto';
    return 'local';
  }
}
```

### 🔍 Partes Mais Importantes:
1. **Regras Cruzadas Multi-Entidades:** `RegraGeracaoPdfService` valida o casamento entre `PeriodoAvaliacao` e `Estagio`.
2. **Separação de Responsabilidade:** Regras que não pertencem exclusivamente a uma entidade vivem em Domain Services puros.
3. **Resolução de Conflitos Determinística:** O `SincronizacaoService` implementa Last-Write-Wins baseado em timestamps.

### ❓ Possíveis Perguntas da Banca:
- **P: "Por que essas regras não foram colocadas dentro do Use Case?"**  
  **R:** *"Porque são regras de negócio puras, não orquestração de infraestrutura. Se mudarmos a forma de entrega ou o framework da aplicação, a regra de negócio permanece idêntica e reutilizável no domínio."*

---

# 4. Slide 11: Contratos e Interfaces (DIP)

### 📄 Código em Destaque: `src/domain/repositories/PeriodoAvaliacaoRepository.ts`
```typescript
export interface PeriodoAvaliacaoRepository {
  save(periodo: PeriodoAvaliacao): Promise<void>;
  findById(id: string): Promise<PeriodoAvaliacao | null>;
  findByEstagioId(estagioId: string): Promise<PeriodoAvaliacao[]>;
  list(): Promise<PeriodoAvaliacao[]>;
  findPendentesSincronizacao(): Promise<PeriodoAvaliacao[]>;
}
```

### 🔍 Partes Mais Importantes:
1. **Princípio da Inversão de Dependência (DIP):** O Domínio define a interface. A Infraestrutura externa apenas a implementa.
2. **Métodos Assíncronos (`Promise`):** Mesmo que a implementação de teste use `Map` na memória RAM, os contratos retornam `Promise` para compatibilidade futura com SQLite ou Supabase.

### ❓ Possíveis Perguntas da Banca:
- **P: "Onde ficam as implementações dessa interface nesta fase?"**  
  **R:** *"Ficam em `src/infra/InMemoryPeriodoAvaliacaoRepository.ts`, operando via `Map<string, PeriodoAvaliacao>` e seguindo o padrão Singleton."*

---

# 5. Slide 12: Casos de Uso (Application Layer)

### 📄 Código em Destaque: `src/usecases/RegistrarAtividadesUseCase.ts`
```typescript
export interface RegistrarAtividadesDTO {
  periodoId: string;
  descricao: string;
  horasTotais: number;
  horasMinimas: number;
  horasPeriodo: number;
  capturarLocalizacao?: boolean;
}

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

### 🔍 Partes Mais Importantes:
1. **Injeção de Dependência pelo Construtor:** Recebe apenas contratos (`PeriodoAvaliacaoRepository` e `LocationGateway`).
2. **Uso de DTOs:** Dados entram como tipos primitivos ou planos (`RegistrarAtividadesDTO`).
3. **Instanciação de VOs e Entidades:** Constrói `CargaHoraria` e `AtividadesDesenvolvidas` delegando a regra de negócio para a entidade `periodo.registrarAtividades(atividades)`.

### ❓ Possíveis Perguntas da Banca:
- **P: "Quais são os 10 casos de uso do sistema?"**  
  **R:** *"1. RegistrarAtividades, 2. AvaliarDesempenho, 3. RealizarAutoAvaliacao, 4. AssinarRelatorio, 5. AprovarRelatorio, 6. DevolverRelatorio, 7. GerarPdf, 8. SincronizarFila, 9. AutenticarUsuario e 10. AcessarViaToken. Todos estão reexportados em `src/application/use-cases/index.ts`."*
- **P: "O que significa o ciclo Red-Green-Refactor nos casos de uso?"**  
  **R:** *"Primeiro escrevemos o teste unitário que falha (Red), depois implementamos o caso de uso até o teste passar (Green), e por fim limpamos o design mantendo o teste verde (Refactor)."*

---

# 6. Slide 13: Hardware Desacoplado (Câmera & GPS)

### 📄 Código em Destaque: `src/infra/InMemoryCameraGateway.ts`
```typescript
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

### 🔍 Partes Mais Importantes:
1. **Arquitetura Hexagonal (Portas e Adaptadores):** O domínio define `CameraGateway` e `LocationGateway`.
2. **Dupla Implementação:** Em produção mobile, `CameraGatewayExpo` encapsula `expo-camera`. Nos testes, `InMemoryCameraGateway` retorna a foto em Base64 imediatamente sem abrir a câmera do celular.

---

# 7. Slide 14: Persistência Offline-First & Sincronização

### 📄 Código em Destaque: `src/usecases/SincronizarFilaUseCase.ts`
```typescript
export class SincronizarFilaUseCase {
  constructor(
    private readonly periodoRepo: PeriodoAvaliacaoRepository,
    private readonly remoteSyncGateway?: RemoteSyncGateway
  ) {}

  async execute(): Promise<SincronizarFilaResult> {
    const pendentes = await this.periodoRepo.findPendentesSincronizacao();
    let sincronizados = 0, falhas = 0;

    for (const periodo of pendentes) {
      try {
        if (this.remoteSyncGateway) {
          await this.remoteSyncGateway.enviarPeriodo(periodo.getId(), {
            status: periodo.getStatus(),
            alunoId: periodo.getAlunoId(),
          });
        }
        periodo.atualizarStatusSincronizacao(StatusSincronizacao.SYNCED);
        periodo.marcarAssinaturasSincronizadas(true);
        await this.periodoRepo.save(periodo);
        sincronizados++;
      } catch (err) {
        periodo.atualizarStatusSincronizacao(StatusSincronizacao.ERROR);
        falhas++;
      }
    }
    return { totalPendentes: pendentes.length, sincronizados, falhas };
  }
}
```

### 🔍 Partes Mais Importantes:
1. **Busca Fila Pendente:** Filtra apenas períodos com `StatusSincronizacao.PENDING`.
2. **Transição de Estados:** Se o gateway remoto responder com sucesso, transita para `SYNCED` e libera a geração de PDF; se falhar, transita para `ERROR` sem travar a interface do operador.

---

# 8. Slide 15: Context API & Custom Hooks (Adapters)

### 📄 Código em Destaque: `src/adapters/context/AuthContext.tsx`
```typescript
export function AuthProvider({
  children,
  autenticarUseCase,
  restoreSessionUseCase,
  signOutUseCase
}: AuthProviderProps) {
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
}
```

### 🔍 Partes Mais Importantes:
1. **Localização em `adapters/`:** Nunca no `domain/` ou `usecases/`.
2. **Eliminação de Prop Drilling:** Permite que qualquer tela acesse `user`, `papel` e `status` via `useAuth()`.
3. **Injeção com Fallback no Container:** `autenticarUseCase ?? container.autenticarUsuarioUseCase`, permitindo que testes injetem Use Cases Fakes.

---

# 9. Slide 16: Telas e Testes RNTL (React Native Testing Library)

### 📄 Códigos em Destaque (Abas Interativas):

#### 1. `tests/screens/AssinaturaScreen.test.tsx`
```typescript
it('deve registrar assinatura digital simulando toque nos botões e inputs', async () => {
  const periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
  periodoRepo.clear();
  await periodoRepo.save(new PeriodoAvaliacao({
    id: 'p1', estagioId: 'e1', alunoId: 'aluno-01', numeroPeriodo: 1,
    dataInicio: new Date('2026-01-01'), dataFim: new Date('2026-06-01'),
  }));

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
});
```

### 🔍 Partes Mais Importantes:
1. **Simulação de Toques com `fireEvent`:** Testa botões (`fireEvent.press`) e inputs (`fireEvent.changeText`) sem precisar de emulador físico ou clique manual.
2. **Testes Assíncronos com `waitFor` e `findByText`:** Garante que animações e chamadas assíncronas do React Native sejam aguardadas corretamente.

---

# 10. Slide 17: Sessão Segura (Expo SecureStore)

### 📄 Código em Destaque: `src/adapters/auth/SessionStorageSecureStore.ts`
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
}
```

### 🔍 Partes Mais Importantes:
1. **Hardware Nativo Criptografado:** Utiliza **Keychain** no iOS e **Keystore** no Android.
2. **Virtualização em Testes:** O `expo-secure-store` é mockado no `tests/setup.ts`, gravando em memória RAM sem tocar em disco físico.

---

# 11. Slide 18 & 19: Comprovação de Isolamento 100% Mock & Métricas

### 📊 Tabela Oficial de Cobertura e Pirâmide de Testes:
| Camada / Diretório | Suítes | Testes | % Linhas |
| :--- | :---: | :---: | :---: |
| **1. Value Objects** (`domain/value-objects`) | 10 | 45 | **98.96%** |
| **2. Entities & Aggregates** (`domain/entities`) | 8 | 48 | **89.37%** |
| **3. Domain Services** (`domain/services`) | 3 | 6 | **90.32%** |
| **4. Use Cases** (`src/usecases`) | 24 | 55 | **95.69%** |
| **5. Repositórios & Gateways Fake** (`infra`) | 2 | 11 | **96.96%** |
| **6. Context API & Sessão Segura** (`adapters`) | 6 | 14 | **83.33%** |
| **7. Telas RNTL** (`src/adapters/screens`) | 4 | 7 | **82.85%** |
| **TOTAL GERAL (All Files)** | **57 Suites** | **234 Testes** | **91.82%** |

### 🔺 Pirâmide de Testes do Projeto:
- **E2E (Pouquíssimos):** Reservados apenas para fluxos críticos pontuais.
- **Telas RNTL (7 Testes):** Renderização e eventos de tela com use cases fakes.
- **Context API, Hooks & Infra Fakes (25 Testes):** Sessão segura, ciclo de vida e repositórios em memória.
- **Use Cases (55 Testes):** Validação de fluxos alternativos e orquestração.
- **Domínio Puro (Base Larga — 99 Testes):** Value objects, entidades e domain services rodando em microssegundos sem dependências externas.

---

## 🎯 5 Respostas de Ouro para a Banca:

1. **"Por que não tem SQLite nem Supabase nesta entrega?"**  
   *"Porque esta é a fase 'Domínio e Interface Primeiro'. Persistência é um detalhe externo em Clean Architecture. Desacoplamos o banco para garantir regras 100% puras e uma suíte de 234 testes rodando em ~5 segundos sem dependência de rede ou disco."*

2. **"Como o projeto garante que o domínio não depende de React ou Expo?"**  
   *"A camada `src/domain/` possui zero imports de `@/`, `react`, `react-native`, `expo` ou bibliotecas de UI. Ela é TypeScript puro e roda em qualquer ambiente (Node, Web, Mobile ou Backend)."*

3. **"Qual é o papel do arquivo `src/factory/container.ts`?"**  
   *"Ele é o único ponto de Inversão de Controle (IoC) da aplicação. Ele faz o wiring entre as implementações Singleton da camada de infraestrutura e os casos de uso da camada de aplicação."*

4. **"Como o app resolve o problema de Prop Drilling do usuário logado?"**  
   *"Através do `AuthContext` na camada de adaptadores. Ele envolve a raiz no `_layout.tsx` e qualquer componente acessa a sessão via hook `useAuth()` sem precisar repassar props manualmente."*

5. **"Como vocês garantem que os dados no smartphone não sejam roubados?"**  
   *"Usamos o adaptador `SessionStorageSecureStore`, que delega para o `expo-secure-store`. No iOS ele grava no Keychain e no Android no Keystore, ambas áreas protegidas por criptografia de hardware do dispositivo."*
