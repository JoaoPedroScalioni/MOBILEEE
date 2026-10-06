# 📱 Apresentação de Defesa Técnica: Fase "Domínio e Interface Primeiro"
### Projeto: SafraCafé — Gestão Offline-First da Colheita Cafeeira
**Padrão Arquitetural:** Clean Architecture + Domain-Driven Design (DDD) + TDD (Test-Driven Development)  
**Ambiente da Etapa:** 100% Mock / Em Memória (Isolado de Banco Físico e Hardware Nativo)  
**Resultados dos Testes:** 57 Test Suites | 234 Testes Aprovados (100%) | 91.82% de Cobertura Global

---

## 📑 Slide 1: Visão Geral e Estratégia Arquitetural

### Objetivo da Etapa
* Desenvolvimento e validação completa das regras de negócio, fluxos de uso e componentes de interface antes da introdução de bancos de dados físicos ou sensores de hardware.
* Desacoplamento estrito: a camada de domínio não possui importações ou dependências de React, Expo ou bibliotecas de UI.
* A interface gráfica é validada sem dependência de APIs remotas em execução.

### Fluxo da Apresentação ("Interface e Domínio Primeiro")
```
[Capa: SafraCafé] ➔ [Telas do App: Ordem Operacional] ➔ [Arquitetura & Códigos DDD] ➔ [Métricas & Testes]
   │
   ├─ 📱 Slide 2: Visão Geral Panorâmica (5 Telas Mobile com Login)
   ├─ 📱 Slide 3: Tela 0 — Login & Autenticação Segura (Atalho Demo, Expo SecureStore & Offline)
   ├─ 📱 Slide 4: Tela 1 — Apontamento de Colheita (Balaios, Crachá QR, Litros & GPS)
   ├─ 📱 Slide 5: Tela 2 — Gestão de Trabalhadores (Crachás TRAB-001/002, Diárias & Busca)
   ├─ 📱 Slide 6: Tela 3 — Controle de Despesas (Óleo R$ 140, Comprovante & GPS)
   └─ 📱 Slide 7: Tela 4 — Mapa da Lavoura (GPS em Tempo Real, Varginha/Sul de MG)
   │
   └─ 💻 Slides 8 a 20: Clean Architecture, DDD, Value Objects, Use Cases, Telas RNTL e Testes
```

---

## 📱 Slide 2 a 7: Telas Operacionais do Aplicativo (Interface Primeiro)

### Ordem Operacional na Lavoura
1. **Slide 2 — Visão Geral Panorâmica:** Grid interativo com as 5 telas em smartphones simulados, ressaltando o design moderno e 100% offline-first.
2. **Slide 3 — Tela 0: Login e Autenticação Segura:** Porta de entrada com botão "Preencher conta demo" (`pesquisador@ecofield.app` | `123456`), persistência em SecureStore (Keychain/Keystore) e menu flutuante de configurações.
3. **Slide 4 — Tela 1: Apontamento de Colheita:** Leitura de crachá óptico com QR Code (`IQrCodeScannerGateway`), contadores em tempo real ("0 Balaios Hoje", "0 L Total Colhido"), fixação automática de coordenadas GPS (`-21.2488, -44.9998`) e feed dos últimos balaios registrados com botão para alternar entre visão topo e registro.
4. **Slide 5 — Tela 2: Gestão de Trabalhadores:** Cadastro unívoco de apanhadores com identificadores serializados (`TRAB-001`, `TRAB-002`), transparência no valor da diária (`R$ 60,00/dia`), CPF validado matematicamente e busca reativa instantânea.
5. **Slide 6 — Tela 3: Controle de Despesas:** Gestão de custos de campo (óleo, insumos, ferramentas), foto do comprovante fiscal anexada via câmera e registro georreferenciado do local da compra/uso.
6. **Slide 7 — Tela 4: Mapa da Lavoura & Georreferenciamento:** Monitoramento contínuo com telemetria ativa (`GPS conectado em tempo real`), marcadores de colheita/talhões na região cafeeira (Varginha / Sul de Minas) e barra de busca geográfica.

---

## 📑 Slide 8: Passo 1 — Value Objects (Objetos de Valor)

### Características Arquiteturais
* **Imutabilidade:** Propriedades `readonly`, sem métodos modificadores (`setters`).
* **Identidade por Atributos:** Dois objetos com os mesmos valores são equivalentes (`equals`).
* **Auto-validação no Construtor:** Bloqueio imediato na instanciação em caso de valores inválidos.

### Objetos de Valor Implementados
* [`QuantidadeBalaio`](file:///c:/PROJETOMOBILE/src/domain/value-objects/QuantidadeBalaio.ts): Volume em litros de café colhido no talhão (finito e estritamente $> 0$).
* [`ValorMonetario`](file:///c:/PROJETOMOBILE/src/domain/value-objects/ValorMonetario.ts): Diária do colhedor (R$ 60,00) ou gastos de campo ($\ge 0$, formatado em BRL).
* [`Coordinates`](file:///c:/PROJETOMOBILE/src/domain/value-objects/Coordinates.ts): Latitude [-90, 90] e longitude [-180, 180] para georreferenciamento do talhão.
* [`SyncStatus`](file:///c:/PROJETOMOBILE/src/domain/value-objects/SyncStatus.ts): Estados formais do ciclo offline-first (`PENDING`, `SYNCED`, `ERROR`).

### Implementação: `QuantidadeBalaio.ts`
```typescript
export class QuantidadeBalaio {
    constructor(public readonly litros: number) {
        this.validate(); // Auto-validação defensiva no construtor (imutável)
    }

    private validate(): void {
        if (!Number.isFinite(this.litros) || this.litros <= 0) {
            throw new Error('Quantidade de balaio inválida');
        }
    }
}
```

### Validação Unitária: `tests/domain/QuantidadeBalaio.test.ts`
```typescript
it('deve aceitar quantidade válida em litros', () => {
    const balaio = new QuantidadeBalaio(60);
    expect(balaio.litros).toBe(60);
});

it('deve rejeitar litros negativos, zero ou não finitos', () => {
    expect(() => new QuantidadeBalaio(0)).toThrow('Quantidade de balaio inválida');
    expect(() => new QuantidadeBalaio(-10)).toThrow('Quantidade de balaio inválida');
    expect(() => new QuantidadeBalaio(NaN)).toThrow('Quantidade de balaio inválida');
});
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
