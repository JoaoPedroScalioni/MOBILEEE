import { CameraGateway, FotoCapturada } from '../domain/gateways/CameraGateway';

export class InMemoryCameraGateway implements CameraGateway {
  private fotoSimulada: FotoCapturada = {
    uri: 'file:///mock/foto-assinatura-comprovante.jpg',
    base64: 'data:image/jpeg;base64,mockedbase64string1234567890',
    largura: 800,
    altura: 600,
  };

  public setFotoSimulada(foto: FotoCapturada): void {
    this.fotoSimulada = foto;
  }

  async capturarFoto(): Promise<FotoCapturada> {
    return this.fotoSimulada;
  }
}

export { InMemoryCameraGateway as CameraGatewayFake };
