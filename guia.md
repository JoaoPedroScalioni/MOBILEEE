# Guia de Arquitetura e Funcionamento do App (Versão Detalhada)

Este documento é a explicação **linha a linha** de todos os arquivos que fazem o motor do aplicativo funcionar. O projeto (SafraCafé) foi construído utilizando **React Native + Expo Router** para a interface e a **Clean Architecture (Arquitetura Limpa)** para as regras de negócio.

---

## 📂 Pasta `src/` (O "Coração" do App)
A pasta `src` abriga todas as lógicas que não dependem da interface. Se amanhã o React Native deixar de existir e formos fazer um site para web, a pasta `src` pode ser aproveitada 100% sem alterações.

### 1. `domain/` (Domínio)
Onde ficam as entidades e contratos do mundo real que o app tenta representar.

#### `value-objects/Coordinates.ts` (Objeto de Valor — Latitude/Longitude)
```typescript
export class Coordinates {
    // O construtor no TypeScript permite já declarar e salvar as variáveis direto aqui,
    // apenas colocando "public readonly" antes do nome, poupando a repetição do "this..."
    constructor (
        public readonly latitude: number,
        public readonly longitude: number
    ) {
        this.validate(); // Ao instanciar a coordenada, a validação é chamada
    }

    private validate(): void {
        // Latitude da Terra varia entre -90 e 90 (Polos Norte/Sul)
        if (this.latitude < -90 || this.latitude > 90) {
            throw new Error('Latitude inválida');
        }
        // Longitude varia entre -180 e 180 (Linha do Equador)
        if (this.longitude < -180 || this.longitude > 180) {
            throw new Error('Longitude inválida');
        }
    }
}
```

#### `value-objects/QuantidadeBalaio.ts` (Objeto de Valor — Litros)
```typescript
export class QuantidadeBalaio {
    constructor(public readonly litros: number) {
        this.validate(); // Auto-validação no construtor (imutável)
    }

    private validate(): void {
        // Um balaio precisa ter volume maior que zero (é um número)
        if (!Number.isFinite(this.litros) || this.litros <= 0) {
            throw new Error('Quantidade de balaio inválida');
        }
    }
}
```

#### `value-objects/ValorMonetario.ts` (Objeto de Valor — Reais)
```typescript
export class ValorMonetario {
    constructor(public readonly valor: number) {
        this.validate();
    }

    private validate(): void {
        // Valor em reais nunca pode ser negativo nem não-numérico
        if (!Number.isFinite(this.valor) || this.valor < 0) {
            throw new Error('Valor monetário inválido');
        }
    }

    // Formata no padrão brasileiro: 60.5 -> "R$ 60,50"
    public formatar(): string {
        return this.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
}
```

#### `entities/Trabalhador.ts` (Entidade Principal da Colheita)
```typescript
import { ValorMonetario } from "../value-objects/ValorMonetario";

export class Trabalhador {
    // public readonly: o id pode ser lido por qualquer um, mas nunca alterado
    public readonly id: string;
    public readonly nome: string;
    public readonly cpf: string;
    public readonly cracha: string;     // Código impresso no crachá (vira QR Code)
    public readonly diaria: ValorMonetario;

    constructor(id: string, nome: string, cpf: string, cracha: string, diaria: ValorMonetario) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.cracha = cracha;
        this.diaria = diaria;

        // Assim que o trabalhador "nasce", validamos se os dados fazem sentido
        this.validate();
    }

    private validate(): void {
        if (!this.id || !this.id.trim())        throw new Error('Id de trabalhador inválido');
        if (!this.nome || !this.nome.trim())    throw new Error('Nome de trabalhador inválido');
        if (!/^\d{11}$/.test(this.cpf))         throw new Error('CPF inválido'); // 11 dígitos
        if (!this.cracha || !this.cracha.trim())throw new Error('Crachá de trabalhador inválido');
        // A diária já é um ValorMonetario: se chegou aqui, ela se autovalido ao ser criada
    }
}
```

#### `entities/Apontamento.ts` (Entidade do Balaio do Dia)
```typescript
import { QuantidadeBalaio } from "../value-objects/QuantidadeBalaio";
import { Coordinates } from "../value-objects/Coordinates";

export class Apontamento {
    public readonly id: string;
    public readonly trabalhadorId: string;       // Quem colheu (FK lógica)
    public readonly quantidade: QuantidadeBalaio; // Quantos litros
    public readonly coordenadas: Coordinates;    // Onde foi feita a colheita (GPS)
    public readonly data: number;                // Epoch ms = momento do registro

    constructor(id: string, trabalhadorId: string, quantidade: QuantidadeBalaio,
                coordenadas: Coordinates, data: number) {
        this.id = id;
        this.trabalhadorId = trabalhadorId;
        this.quantidade = quantidade;
        this.coordenadas = coordenadas;
        this.data = data;
        this.validate();
    }

    private validate(): void {
        if (!this.id || !this.id.trim())               throw new Error('Id de apontamento inválido');
        if (!this.trabalhadorId || !this.trabalhadorId.trim()) throw new Error('Id de trabalhador inválido');
        if (this.data <= 0)                            throw new Error('Data do apontamento inválida');
    }
}
```

#### `entities/Despesa.ts` (Entidade Financeira)
```typescript
import { ValorMonetario } from "../value-objects/ValorMonetario";
import { Coordinates } from "../value-objects/Coordinates";

// Lista fechada de categorias: só existe essas opções
export const CATEGORIAS_DESPESA = ['Refeição', 'Combustível', 'Insumos', 'Ferramentas', 'Transporte', 'Outros'] as const;
export type CategoriaDespesa = typeof CATEGORIAS_DESPESA[number];

export class Despesa {
    public readonly id: string;
    public readonly descricao: string;
    public readonly valor: ValorMonetario;
    public readonly categoria: CategoriaDespesa;
    public readonly coordenadas: Coordinates;
    public readonly data: number;
    public readonly fotoUri: string | null; // Foto do recibo (opcional)

    constructor(id: string, descricao: string, valor: ValorMonetario, categoria: CategoriaDespesa,
                coordenadas: Coordinates, data: number, fotoUri: string | null = null) {
        this.id = id;
        this.descricao = descricao;
        this.valor = valor;
        this.categoria = categoria;
        this.coordenadas = coordenadas;
        this.data = data;
        this.fotoUri = fotoUri;
        this.validate();
    }

    private validate(): void {
        if (!this.descricao || !this.descricao.trim()) throw new Error('Descrição da despesa inválida');
        if (!CATEGORIAS_DESPESA.includes(this.categoria)) throw new Error('Categoria de despesa inválida');
        if (this.data <= 0)                            throw new Error('Data da despesa inválida');
        // Se tem foto, ela precisa ser uma URI válida (file:// ou https://)
        if (this.fotoUri && (!this.fotoUri.includes('://'))) throw new Error('Foto da despesa inválida');
    }
}
```

#### `repositories/TrabalhadorRepository.ts` (O Contrato)
```typescript
import { Trabalhador } from "../entities/Trabalhador";

// Uma interface é um contrato: diz "O QUE" deve ser feito, mas não diz "COMO"
export interface TrabalhadorRepository {
    save(trabalhador: Trabalhador): Promise<void>;              // Cadastra
    findById(id: string): Promise<Trabalhador | null>;          // Acha por id
    findByCracha(codigo: string): Promise<Trabalhador | null>;  // Acha pelo QR do crachá
    findAll(): Promise<Trabalhador[]>;                          // Lista tudo
}
```

> O mesmo padrão vale para `ApontamentoRepository` (save/findById/findByTrabalhadorId/findAll)
> e `DespesaRepository` (save/findById/findAll).

---

### 2. `infra/` (Infraestrutura)
A camada que "suja a mão" salvando na memória (futuramente no SQLite).

#### `inMemoryTrabalhadorRepository.ts` (O Banco de Dados Falso)
```typescript
import { Trabalhador } from "../domain/entities/Trabalhador";
import { TrabalhadorRepository } from "../domain/repositories/TrabalhadorRepository";
import { ValorMonetario } from "../domain/value-objects/ValorMonetario";

// Essa classe "assina" o contrato do TrabalhadorRepository
export class InMemoryTrabalhadorRepository implements TrabalhadorRepository {

    // Aqui os dados são guardados: um array (lista) privado de trabalhadores
    private trabalhadores: Trabalhador[] = [
        // Seeds demo: dois trabalhadores já cadastrados para testar no Expo Go
        new Trabalhador('trab-001', 'José da Silva', '52998224725', 'TRAB-001', new ValorMonetario(60)),
        new Trabalhador('trab-002', 'Maria de Souza', '11144477735', 'TRAB-002', new ValorMonetario(60)),
    ];

    // Variável estática que guarda a ÚNICA instância do banco em todo o app (Singleton)
    private static instance: InMemoryTrabalhadorRepository;

    // Construtor privado: ninguém fora dessa classe consegue fazer "new InMemory..."
    private constructor() { }

    // Método que as outras classes chamam para pegar o banco de dados
    public static getInstance(): InMemoryTrabalhadorRepository {
        if (!InMemoryTrabalhadorRepository.instance) {
            InMemoryTrabalhadorRepository.instance = new InMemoryTrabalhadorRepository();
        }
        // Devolve a mesma instância sempre. Assim os dados não somem entre as telas.
        return InMemoryTrabalhadorRepository.instance;
    }

    // O "COMO" o método do contrato funciona: ele só dá um .push (adiciona) no array
    async save(trabalhador: Trabalhador): Promise<void> {
        this.trabalhadores.push(trabalhador);
    }

    // Busca pelo id
    async findById(id: string): Promise<Trabalhador | null> {
        return this.trabalhadores.find(t => t.id === id) || null;
    }

    // Busca pelo código do crachá (usado no escaneamento do QR Code)
    async findByCracha(codigo: string): Promise<Trabalhador | null> {
        return this.trabalhadores.find(t => t.cracha === codigo) || null;
    }

    // Retorna uma CÓPIA do array ([...array]) para o React perceber mudança e re-renderizar
    async findAll(): Promise<Trabalhador[]> {
        return [...this.trabalhadores];
    }
}
```

---

### 3. `usecases/` (Casos de Uso)
Onde as regras da aplicação (O que o usuário quer fazer) acontecem.

#### `CadastrarTrabalhador.ts` (Caso de Uso de Cadastrar)
```typescript
import * as Crypto from "expo-crypto";
import { Trabalhador } from "../domain/entities/Trabalhador";
import { TrabalhadorRepository } from "../domain/repositories/TrabalhadorRepository";
import { SyncQueueRepository } from "../domain/repositories/SyncQueueRepository";
import { SyncQueueItem } from "../domain/entities/SyncQueueItem";
import { ValorMonetario } from "../domain/value-objects/ValorMonetario";

// DTO: dados brutos que chegam da tela
export interface CadastrarTrabalhadorDTO {
    nome: string; cpf: string; cracha: string; diaria: number;
}

export class CadastrarTrabalhador {
    // Injeção de Dependência: recebe o repositório de trabalhadores + a fila de sync
    constructor(
        private readonly repository: TrabalhadorRepository,
        private readonly syncQueueRepository: SyncQueueRepository,
    ) {}

    public async execute(input: CadastrarTrabalhadorDTO) {
        // 1. Cria a entidade (que se valida sozinha: CPF, crachá, nome, diária)
        const trabalhador = new Trabalhador(
            Crypto.randomUUID(),
            input.nome,
            input.cpf,
            input.cracha,
            new ValorMonetario(input.diaria),
        );

        // 2. Salva localmente (funciona offline)
        await this.repository.save(trabalhador);

        // 3. Enfileira um INSERT na outbox para sincronizar com a nuvem depois
        await this.syncQueueRepository.enqueue(
            new SyncQueueItem(Crypto.randomUUID(), 'Trabalhador', trabalhador.id, 'INSERT', Date.now(), Date.now(), 0),
        );

        return trabalhador;
    }
}
```

#### `RegistrarApontamento.ts` (Caso de Uso do Balaio)
```typescript
import * as Crypto from "expo-crypto";
import { Apontamento } from "../domain/entities/Apontamento";
import { ApontamentoRepository } from "../domain/repositories/ApontamentoRepository";
import { TrabalhadorRepository } from "../domain/repositories/TrabalhadorRepository";
import { SyncQueueRepository } from "../domain/repositories/SyncQueueRepository";
import { SyncQueueItem } from "../domain/entities/SyncQueueItem";
import { Coordinates } from "../domain/value-objects/Coordinates";
import { QuantidadeBalaio } from "../domain/value-objects/QuantidadeBalaio";

export interface RegistrarApontamentoDTO {
    trabalhadorId: string; litros: number; latitude: number; longitude: number;
}

export class RegistrarApontamento {
    // DI: três dependências injetadas via construtor
    constructor(
        private readonly repository: ApontamentoRepository,
        private readonly trabalhadorRepository: TrabalhadorRepository,
        private readonly syncQueueRepository: SyncQueueRepository,
    ) {}

    public async execute(input: RegistrarApontamentoDTO, agora: number = Date.now()) {
        // 1. Regra de negócio: o trabalhador precisa existir
        const trabalhador = await this.trabalhadorRepository.findById(input.trabalhadorId);
        if (!trabalhador) {
            throw new Error('Trabalhador não encontrado');
        }

        // 2. Os VOs se autovalem (litros > 0; lat/lng nos limites da Terra)
        const quantidade = new QuantidadeBalaio(input.litros);
        const coordenadas = new Coordinates(input.latitude, input.longitude);

        // 3. Cria o apontamento com UUID gerado no cliente
        const apontamento = new Apontamento(Crypto.randomUUID(), input.trabalhadorId, quantidade, coordenadas, agora);

        // 4. Salva localmente (offline-first)
        await this.repository.save(apontamento);

        // 5. Enfileira na outbox para sync posterior
        await this.syncQueueRepository.enqueue(
            new SyncQueueItem(Crypto.randomUUID(), 'Apontamento', apontamento.id, 'INSERT', agora, agora, 0),
        );

        return apontamento;
    }
}
```

> O mesmo padrão vale para `RegistrarDespesa` (valida `Despesa`, salva no repo e enfileira
> `INSERT 'Despesa'`) e para os casos de uso de listagem (`ListarTrabalhadores`,
> `ListarApontamentos`, `ListarDespesas`), que apenas delegam para `repository.findAll()`.

---

### 4. `factory/` (Container / Injeção de Dependência)
Responsável por montar o quebra-cabeça juntando Infraestrutura e Casos de Uso.

#### `container.ts`
```typescript
import { InMemoryTrabalhadorRepository } from "../infra/inMemoryTrabalhadorRepository";
import { InMemoryApontamentoRepository } from "../infra/inMemoryApontamentoRepository";
import { InMemoryDespesaRepository } from "../infra/inMemoryDespesaRepository";
import { CadastrarTrabalhador } from "../usecases/CadastrarTrabalhador";
import { ListarTrabalhadores } from "../usecases/ListarTrabalhadores";
import { RegistrarApontamento } from "../usecases/RegistrarApontamento";
import { ListarApontamentos } from "../usecases/ListarApontamentos";
import { RegistrarDespesa } from "../usecases/RegistrarDespesa";
import { ListarDespesas } from "../usecases/ListarDespesas";
// + autenticação e sincronização (AuthenticateUser, SignOut, RestoreSession, SyncPendingQueue)

class Container {
    // Mais um Singleton para garantir que só monte o quebra-cabeça 1 vez
    private static instance: Container;

    // Variáveis públicas que guardam as classes prontas (use cases "montados")
    public readonly cadastrarTrabalhador: CadastrarTrabalhador;
    public readonly listarTrabalhadores: ListarTrabalhadores;
    public readonly registrarApontamento: RegistrarApontamento;
    public readonly listarApontamentos: ListarApontamentos;
    public readonly registrarDespesa: RegistrarDespesa;
    public readonly listarDespesas: ListarDespesas;

    private constructor() {
        // 1. Pega os bancos de dados (todos Singleton)
        const trabalhadores = InMemoryTrabalhadorRepository.getInstance();
        const apontamentos = InMemoryApontamentoRepository.getInstance();
        const despesas = InMemoryDespesaRepository.getInstance();
        const syncQueue = InMemorySyncQueueRepository.getInstance();

        // 2. Constrói cada caso de uso injetando as dependências no construtor
        this.cadastrarTrabalhador = new CadastrarTrabalhador(trabalhadores, syncQueue);
        this.listarTrabalhadores = new ListarTrabalhadores(trabalhadores);
        this.registrarApontamento = new RegistrarApontamento(apontamentos, trabalhadores, syncQueue);
        this.listarApontamentos = new ListarApontamentos(apontamentos);
        this.registrarDespesa = new RegistrarDespesa(despesas, syncQueue);
        this.listarDespesas = new ListarDespesas(despesas);
    }

    public static getInstance(): Container {
        if (!this.instance) this.instance = new Container();
        return this.instance;
    }
}

// Exporta ele já instanciado (uma caixa de ferramentas pronta para a tela usar)
export const container = Container.getInstance();
```

---

## 📂 Pasta `app/` (Interface / Telas com Expo Router)
É a pasta do frontend e da interface do usuário. As pastas entre parênteses ex: `(tabs)` agrupam arquivos, mas não mudam a URL da página.

### `app/(drawer)/(tabs)/_layout.tsx` (As Abas da Aplicação)
Define as 4 abas do miolo do app (Bottom Tabs do Expo Router):

| Arquivo | Aba | O que faz |
| :--- | :--- | :--- |
| `index.tsx` | **Apontamento** | Registra o balaio do dia (manual ou por QR) |
| `trabalhadores.tsx` | **Trabalhadores** | Lista e cadastra trabalhadores |
| `despesas.tsx` | **Despesas** | Lista e registra despesas com recibo |
| `mapas.tsx` | **Mapa** | Mapa da lavoura com apontamentos e rota |

### `app/(drawer)/(tabs)/index.tsx` (A Tela de Apontamento)
A tela mais importante do app.

```tsx
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { container } from '@/src/factory/container';

export default function Apontamento() {
  // Hooks de permissão da câmera (para o QR Code do crachá)
  const [permissionQR, requestPermissionQR] = useCameraPermissions();

  // States da tela
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([]);
  const [trabalhadorSel, setTrabalhadorSel] = useState<string>('');
  const [litros, setLitros] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mostrarQR, setMostrarQR] = useState(false);

  // Carrega os trabalhadores sempre que a aba ganha foco
  useFocusEffect(React.useCallback(() => {
    container.listarTrabalhadores.execute().then(setTrabalhadores);
  }, []));

  // Pega o GPS na abertura da tela (1x, sem polling — RNF03)
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocation(await Location.getCurrentPositionAsync({}));
      }
    })();
  }, []);

  // Escaneou o QR do crachá -> seleciona o trabalhador pelo código
  async function onQRCodeLido(data: string) {
    setMostrarQR(false);
    const t = await container.listarTrabalhadores.execute();
    const achado = t.find(x => x.cracha === data.trim());
    if (achado) {
      setTrabalhadorSel(achado.id);
      Alert.alert('Crachá lido', `Trabalhador: ${achado.nome}`);
    } else {
      Alert.alert('Não encontrado', 'Nenhum trabalhador com esse crachá.');
    }
  }

  // Salva o apontamento usando o caso de uso do container
  async function salvarApontamento() {
    if (!trabalhadorSel) return Alert.alert('Atenção', 'Selecione o trabalhador!');
    if (!location) return Alert.alert('Atenção', 'Aguarde a localização GPS.');
    try {
      await container.registrarApontamento.execute({
        trabalhadorId: trabalhadorSel,
        litros: Number(litros),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      Alert.alert('Sucesso', 'Apontamento salvo!');
      setLitros('');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }
  // ... [botões que renderizam a CameraView quando mostrarQR = true]
}
```

> **Por que a tela usa o container?** Para nunca instanciar repositórios diretamente. A tela é a
> "fronteira" e o use case é o "controle"; todo o wiring vive só em `src/factory/container.ts`.

### `app/(drawer)/(tabs)/trabalhadores.tsx` (Cadastro e Lista)
- `FlatList` com todos os trabalhadores (nome, CPF, crachá e diária formatada com `R$`).
- Modal de cadastro com `TextInput` para nome, CPF, crachá e diária.
- Ao confirmar, chama `container.cadastrarTrabalhador.execute({...})` → `setModalVisivel(false)` e
  recarrega a lista. Erros de validação (CPF inválido etc.) são capturados e exibidos via `Alert`.

### `app/(drawer)/(tabs)/despesas.tsx` (Registro de Despesas)
- Formulário: descrição, valor, chips de categoria (`CATEGORIAS_DESPESA`), botão de foto do recibo
  via `expo-image-picker` e preview da imagem.
- Captura GPS no momento do registro.
- Ao confirmar, `container.registrarDespesa.execute({...})` salva e enfileira o `INSERT` na outbox.

### `app/(drawer)/(tabs)/mapas.tsx` (O Mapa da Lavoura)
- `MapView` do `react-native-maps` centralizando na posição atual.
- Para cada apontamento, um `<Marker>` + `<Callout>` exibindo litros e coordenadas.
- `<Polyline>` ligando todos os pontos (itinerário de colheita).
- `MapViewDirections` para traçar a rota viária até o destino buscado no
  `GooglePlacesAutocomplete`.

Pronto! Agora você tem a enciclopédia completa de como todo o seu app funciona e se interliga!