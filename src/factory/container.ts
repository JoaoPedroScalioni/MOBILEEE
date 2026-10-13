import { TrabalhadorRepository } from "../domain/repositories/TrabalhadorRepository";
import { ApontamentoRepository } from "../domain/repositories/ApontamentoRepository";
import { DespesaRepository } from "../domain/repositories/DespesaRepository";
import { SyncQueueRepository } from "../domain/repositories/SyncQueueRepository";

import { SqliteTrabalhadorRepository } from "../infra/sqlite/SqliteTrabalhadorRepository";
import { SqliteApontamentoRepository } from "../infra/sqlite/SqliteApontamentoRepository";
import { SqliteDespesaRepository } from "../infra/sqlite/SqliteDespesaRepository";
import { SqliteSyncQueueRepository } from "../infra/sqlite/SqliteSyncQueueRepository";

import { InMemoryTrabalhadorRepository } from "../infra/inMemoryTrabalhadorRepository";
import { InMemoryApontamentoRepository } from "../infra/inMemoryApontamentoRepository";
import { InMemoryDespesaRepository } from "../infra/inMemoryDespesaRepository";
import { InMemorySyncQueueRepository } from "../infra/inMemorySyncQueueRepository";

import { InMemoryAuthGateway } from "../infra/inMemoryAuthGateway";
import { InMemoryNetworkGateway } from "../infra/inMemoryNetworkGateway";
import { InMemorySyncGateway } from "../infra/inMemorySyncGateway";
import { SessionStorageSecureStore } from "../adapters/auth/SessionStorageSecureStore";
import { SincronizacaoService } from "../domain/services/SincronizacaoService";

import { AuthenticateUser } from "../usecases/AuthenticateUser";
import { RestoreSession } from "../usecases/RestoreSession";
import { SignOut } from "../usecases/SignOut";
import { SyncPendingQueue } from "../usecases/SyncPendingQueue";
import { CadastrarTrabalhador } from "../usecases/CadastrarTrabalhador";
import { EditarTrabalhador } from "../usecases/EditarTrabalhador";
import { ExcluirTrabalhador } from "../usecases/ExcluirTrabalhador";
import { ListarTrabalhadores } from "../usecases/ListarTrabalhadores";
import { RegistrarApontamento } from "../usecases/RegistrarApontamento";
import { ListarApontamentos } from "../usecases/ListarApontamentos";
import { RegistrarDespesa } from "../usecases/RegistrarDespesa";
import { ListarDespesas } from "../usecases/ListarDespesas";
import { ExcluirDespesa } from "../usecases/ExcluirDespesa";

class Container {
    private static instance: Container;

    public readonly trabalhadorRepository: TrabalhadorRepository;
    public readonly apontamentoRepository: ApontamentoRepository;
    public readonly despesaRepository: DespesaRepository;
    public readonly syncQueueRepository: SyncQueueRepository;

    public readonly inMemoryTrabalhadorRepository: InMemoryTrabalhadorRepository;
    public readonly inMemoryApontamentoRepository: InMemoryApontamentoRepository;
    public readonly inMemoryDespesaRepository: InMemoryDespesaRepository;
    public readonly inMemorySyncQueueRepository: InMemorySyncQueueRepository;

    public readonly authGateway: InMemoryAuthGateway;
    public readonly networkGateway: InMemoryNetworkGateway;
    public readonly syncGateway: InMemorySyncGateway;
    public readonly sessionStorage: SessionStorageSecureStore;
    public readonly sincronizacaoService: SincronizacaoService;

    public readonly cadastrarTrabalhador: CadastrarTrabalhador;
    public readonly editarTrabalhador: EditarTrabalhador;
    public readonly excluirTrabalhador: ExcluirTrabalhador;
    public readonly listarTrabalhadores: ListarTrabalhadores;
    public readonly registrarApontamento: RegistrarApontamento;
    public readonly listarApontamentos: ListarApontamentos;
    public readonly registrarDespesa: RegistrarDespesa;
    public readonly listarDespesas: ListarDespesas;
    public readonly excluirDespesa: ExcluirDespesa;
    public readonly authenticateUser: AuthenticateUser;
    public readonly restoreSession: RestoreSession;
    public readonly signOut: SignOut;
    public readonly syncPendingQueue: SyncPendingQueue;

    private constructor() {
        // Instâncias em memória
        this.inMemoryTrabalhadorRepository = InMemoryTrabalhadorRepository.getInstance();
        this.inMemoryApontamentoRepository = InMemoryApontamentoRepository.getInstance();
        this.inMemoryDespesaRepository = InMemoryDespesaRepository.getInstance();
        this.inMemorySyncQueueRepository = InMemorySyncQueueRepository.getInstance();

        // Repositórios oficiais do SafraCafé (SQLite Local - Offline-First)
        this.trabalhadorRepository = SqliteTrabalhadorRepository.getInstance();
        this.apontamentoRepository = SqliteApontamentoRepository.getInstance();
        this.despesaRepository = SqliteDespesaRepository.getInstance();
        this.syncQueueRepository = SqliteSyncQueueRepository.getInstance();

        this.authGateway = InMemoryAuthGateway.getInstance();
        this.networkGateway = InMemoryNetworkGateway.getInstance();
        this.syncGateway = InMemorySyncGateway.getInstance();
        this.sessionStorage = new SessionStorageSecureStore();
        this.sincronizacaoService = new SincronizacaoService();

        this.cadastrarTrabalhador = new CadastrarTrabalhador(
            this.trabalhadorRepository,
            this.syncQueueRepository,
        );
        this.editarTrabalhador = new EditarTrabalhador(
            this.trabalhadorRepository,
            this.syncQueueRepository,
        );
        this.excluirTrabalhador = new ExcluirTrabalhador(
            this.trabalhadorRepository,
            this.syncQueueRepository,
        );
        this.listarTrabalhadores = new ListarTrabalhadores(this.trabalhadorRepository);
        this.registrarApontamento = new RegistrarApontamento(
            this.apontamentoRepository,
            this.trabalhadorRepository,
            this.syncQueueRepository,
        );
        this.listarApontamentos = new ListarApontamentos(this.apontamentoRepository);
        this.registrarDespesa = new RegistrarDespesa(
            this.despesaRepository,
            this.syncQueueRepository,
        );
        this.listarDespesas = new ListarDespesas(this.despesaRepository);
        this.excluirDespesa = new ExcluirDespesa(
            this.despesaRepository,
            this.syncQueueRepository,
        );
        this.authenticateUser = new AuthenticateUser(this.authGateway);
        this.restoreSession = new RestoreSession(this.sessionStorage);
        this.signOut = new SignOut(this.authGateway, this.sessionStorage);
        this.syncPendingQueue = new SyncPendingQueue(
            this.syncQueueRepository,
            this.syncGateway,
            this.networkGateway,
            this.sincronizacaoService,
        );
    }

    public static getInstance(): Container {
        if (!this.instance) {
            this.instance = new Container();
        }
        return this.instance;
    }
}

export const container = Container.getInstance();