import { LocationGateway } from '../domain/gateways/LocationGateway';
import { Coordenada } from '../domain/value-objects/Coordenada';

export class InMemoryLocationGateway implements LocationGateway {
  private coordenadaAtual: Coordenada = new Coordenada(-23.55052, -46.633308, Date.now());

  public setLocalizacaoSimulada(coordenada: Coordenada): void {
    this.coordenadaAtual = coordenada;
  }

  async obterLocalizacaoAtual(): Promise<Coordenada> {
    return this.coordenadaAtual;
  }
}

export { InMemoryLocationGateway as LocationGatewayFake };
