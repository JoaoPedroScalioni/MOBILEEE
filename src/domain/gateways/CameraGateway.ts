export interface FotoCapturada {
  uri: string;
  base64?: string;
  largura?: number;
  altura?: number;
}

export interface CameraGateway {
  capturarFoto(): Promise<FotoCapturada>;
}
