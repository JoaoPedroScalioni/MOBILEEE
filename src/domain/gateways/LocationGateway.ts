import { Coordenada } from '../value-objects/Coordenada';

export interface LocationGateway {
  obterLocalizacaoAtual(): Promise<Coordenada>;
}
