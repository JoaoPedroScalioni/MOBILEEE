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
import { EditarTrabalhador } from "../usecases/EditarTrabalhador";
import { ExcluirTrabalhador } from "../usecases/ExcluirTrabalhador";
import { ListarTrabalhadores } from "../usecases/ListarTrabalhadores";
import { RegistrarApontamento } from "../usecases/RegistrarApontamento";
import { ListarApontamentos } from "../usecases/ListarApontamentos";
import { RegistrarDespesa } from "../usecases/RegistrarDespesa";
import { ListarDespesas } from "../usecases/ListarDespesas";

// Novos repositórios, gateways e casos de uso de Estágio / Período de Avaliação
import { InMemoryPeriodoAvaliacaoRepository } from "../infra/InMemoryPeriodoAvaliacaoRepository";
import { InMemoryEstagioRepository } from "../infra/InMemoryEstagioRepository";
import { InMemoryTokenSupervisorRepository } from "../infra/InMemoryTokenSupervisorRepository";
import { InMemoryLocationGateway } from "../infra/InMemoryLocationGateway";
import { InMemoryCameraGateway } from "../infra/InMemoryCameraGateway";
import { InMemoryPdfGateway } from "../infra/InMemoryPdfGateway";
import { RegistrarAtividadesUseCase } from "../usecases/RegistrarAtividadesUseCase";
import { AvaliarDesempenhoUseCase } from "../usecases/AvaliarDesempenhoUseCase";
import { RealizarAutoAvaliacaoUseCase } from "../usecases/RealizarAutoAvaliacaoUseCase";
import { AssinarRelatorioUseCase } from "../usecases/AssinarRelatorioUseCase";
import { AprovarRelatorioUseCase } from "../usecases/AprovarRelatorioUseCase";
import { DevolverRelatorioUseCase } from "../usecases/DevolverRelatorioUseCase";
import { GerarPdfUseCase } from "../usecases/GerarPdfUseCase";
import { SincronizarFilaUseCase } from "../usecases/SincronizarFilaUseCase";
import { AutenticarUsuarioUseCase } from "../usecases/AutenticarUsuarioUseCase";
import { AcessarViaTokenUseCase } from "../usecases/AcessarViaTokenUseCase";

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
    public readonly editarTrabalhador: EditarTrabalhador;
    public readonly excluirTrabalhador: ExcluirTrabalhador;
    public readonly listarTrabalhadores: ListarTrabalhadores;
    public readonly registrarApontamento: RegistrarApontamento;
    public readonly listarApontamentos: ListarApontamentos;
    public readonly registrarDespesa: RegistrarDespesa;
    public readonly listarDespesas: ListarDespesas;
    public readonly authenticateUser: AuthenticateUser;
    public readonly restoreSession: RestoreSession;
    public readonly signOut: SignOut;
    public readonly syncPendingQueue: SyncPendingQueue;

    // Dependências de Estágio / Período de Avaliação
    public readonly periodoAvaliacaoRepository: InMemoryPeriodoAvaliacaoRepository;
    public readonly estagioRepository: InMemoryEstagioRepository;
    public readonly tokenSupervisorRepository: InMemoryTokenSupervisorRepository;
    public readonly locationGateway: InMemoryLocationGateway;
    public readonly cameraGateway: InMemoryCameraGateway;
    public readonly pdfGateway: InMemoryPdfGateway;

    public readonly registrarAtividadesUseCase: RegistrarAtividadesUseCase;
    public readonly avaliarDesempenhoUseCase: AvaliarDesempenhoUseCase;
    public readonly realizarAutoAvaliacaoUseCase: RealizarAutoAvaliacaoUseCase;
    public readonly assinarRelatorioUseCase: AssinarRelatorioUseCase;
    public readonly aprovarRelatorioUseCase: AprovarRelatorioUseCase;
    public readonly devolverRelatorioUseCase: DevolverRelatorioUseCase;
    public readonly gerarPdfUseCase: GerarPdfUseCase;
    public readonly sincronizarFilaUseCase: SincronizarFilaUseCase;
    public readonly autenticarUsuarioUseCase: AutenticarUsuarioUseCase;
    public readonly acessarViaTokenUseCase: AcessarViaTokenUseCase;

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
        this.authenticateUser = new AuthenticateUser(this.authGateway);
        this.restoreSession = new RestoreSession(this.sessionStorage);
        this.signOut = new SignOut(this.authGateway, this.sessionStorage);
        this.syncPendingQueue = new SyncPendingQueue(
            this.syncQueueRepository,
            this.syncGateway,
            this.networkGateway,
            this.sincronizacaoService,
        );

        // Instanciação e Wiring de Estágio / Período de Avaliação
        this.periodoAvaliacaoRepository = InMemoryPeriodoAvaliacaoRepository.getInstance();
        this.estagioRepository = InMemoryEstagioRepository.getInstance();
        this.tokenSupervisorRepository = InMemoryTokenSupervisorRepository.getInstance();
        this.locationGateway = new InMemoryLocationGateway();
        this.cameraGateway = new InMemoryCameraGateway();
        this.pdfGateway = new InMemoryPdfGateway();

        this.registrarAtividadesUseCase = new RegistrarAtividadesUseCase(
            this.periodoAvaliacaoRepository,
            this.locationGateway
        );
        this.avaliarDesempenhoUseCase = new AvaliarDesempenhoUseCase(
            this.periodoAvaliacaoRepository,
            this.tokenSupervisorRepository
        );
        this.realizarAutoAvaliacaoUseCase = new RealizarAutoAvaliacaoUseCase(
            this.periodoAvaliacaoRepository
        );
        this.assinarRelatorioUseCase = new AssinarRelatorioUseCase(
            this.periodoAvaliacaoRepository
        );
        this.aprovarRelatorioUseCase = new AprovarRelatorioUseCase(
            this.periodoAvaliacaoRepository
        );
        this.devolverRelatorioUseCase = new DevolverRelatorioUseCase(
            this.periodoAvaliacaoRepository
        );
        this.gerarPdfUseCase = new GerarPdfUseCase(
            this.periodoAvaliacaoRepository,
            this.pdfGateway,
            this.estagioRepository
        );
        this.sincronizarFilaUseCase = new SincronizarFilaUseCase(
            this.periodoAvaliacaoRepository
        );
        this.autenticarUsuarioUseCase = new AutenticarUsuarioUseCase(
            this.authGateway,
            this.sessionStorage
        );
        this.acessarViaTokenUseCase = new AcessarViaTokenUseCase(
            this.tokenSupervisorRepository,
            this.periodoAvaliacaoRepository
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