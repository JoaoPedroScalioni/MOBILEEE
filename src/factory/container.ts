import { InMemoryTrabalhadorRepository } from "../infra/inMemoryTrabalhadorRepository";
import { InMemoryApontamentoRepository } from "../infra/inMemoryApontamentoRepository";
import { InMemoryDespesaRepository } from "../infra/inMemoryDespesaRepository";
import { InMemoryAuthGateway } from "../infra/inMemoryAuthGateway";
import { InMemoryNetworkGateway } from "../infra/inMemoryNetworkGateway";
import { InMemorySyncGateway } from "../infra/inMemorySyncGateway";
import { InMemorySyncQueueRepository } from "../infra/inMemorySyncQueueRepository";
import { SessionStorageSecureStore } from "../adapters/auth/SessionStorageSecureStore";
import { SincronizacaoService } from "../domain/services/SincronizacaoService";
import { AuthenticateUser } from "../usecases/AuthenticateUser";
import { RestoreSession } from "../usecases/RestoreSession";
import { SignOut } from "../usecases/SignOut";
import { SyncPendingQueue } from "../usecases/SyncPendingQueue";
import { CadastrarTrabalhador } from "../usecases/CadastrarTrabalhador";
import { ListarTrabalhadores } from "../usecases/ListarTrabalhadores";
import { RegistrarApontamento } from "../usecases/RegistrarApontamento";
import { ListarApontamentos } from "../usecases/ListarApontamentos";
import { RegistrarDespesa } from "../usecases/RegistrarDespesa";
import { ListarDespesas } from "../usecases/ListarDespesas";

class Container {
    private static instance: Container;

    public readonly trabalhadorRepository: InMemoryTrabalhadorRepository;
    public readonly apontamentoRepository: InMemoryApontamentoRepository;
    public readonly despesaRepository: InMemoryDespesaRepository;
    public readonly syncQueueRepository: InMemorySyncQueueRepository;
    public readonly authGateway: InMemoryAuthGateway;
    public readonly networkGateway: InMemoryNetworkGateway;
    public readonly syncGateway: InMemorySyncGateway;
    public readonly sessionStorage: SessionStorageSecureStore;
    public readonly sincronizacaoService: SincronizacaoService;

    public readonly cadastrarTrabalhador: CadastrarTrabalhador;
    public readonly listarTrabalhadores: ListarTrabalhadores;
    public readonly registrarApontamento: RegistrarApontamento;
    public readonly listarApontamentos: ListarApontamentos;
    public readonly registrarDespesa: RegistrarDespesa;
    public readonly listarDespesas: ListarDespesas;
    public readonly authenticateUser: AuthenticateUser;
    public readonly restoreSession: RestoreSession;
    public readonly signOut: SignOut;
    public readonly syncPendingQueue: SyncPendingQueue;

    private constructor() {
        this.trabalhadorRepository = InMemoryTrabalhadorRepository.getInstance();
        this.apontamentoRepository = InMemoryApontamentoRepository.getInstance();
        this.despesaRepository = InMemoryDespesaRepository.getInstance();
        this.syncQueueRepository = InMemorySyncQueueRepository.getInstance();
        this.authGateway = InMemoryAuthGateway.getInstance();
        this.networkGateway = InMemoryNetworkGateway.getInstance();
        this.syncGateway = InMemorySyncGateway.getInstance();
        this.sessionStorage = new SessionStorageSecureStore();
        this.sincronizacaoService = new SincronizacaoService();

        this.cadastrarTrabalhador = new CadastrarTrabalhador(
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