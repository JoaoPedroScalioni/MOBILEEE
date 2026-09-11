export interface NetworkGateway {
  isConnected(): Promise<boolean>;
}