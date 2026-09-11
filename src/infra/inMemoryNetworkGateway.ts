export class InMemoryNetworkGateway {
    private connected = true;
    private static instance: InMemoryNetworkGateway;

    private constructor() {}

    public static getInstance(): InMemoryNetworkGateway {
        if (!InMemoryNetworkGateway.instance) {
            InMemoryNetworkGateway.instance = new InMemoryNetworkGateway();
        }
        return InMemoryNetworkGateway.instance;
    }

    setConnected(connected: boolean): void {
        this.connected = connected;
    }

    async isConnected(): Promise<boolean> {
        return this.connected;
    }
}