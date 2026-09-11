import { SyncQueueItem } from "../domain/entities/SyncQueueItem";
import { SyncGateway, SyncResultadoGateway } from "../domain/gateways/SyncGateway";

export class InMemorySyncGateway implements SyncGateway {
    private failNext = false;
    private serverUpdatedAt: number | undefined = undefined;
    private static instance: InMemorySyncGateway;

    private constructor() {}

    public static getInstance(): InMemorySyncGateway {
        if (!InMemorySyncGateway.instance) {
            InMemorySyncGateway.instance = new InMemorySyncGateway();
        }
        return InMemorySyncGateway.instance;
    }

    setFailNext(fail: boolean): void {
        this.failNext = fail;
    }

    setServerUpdatedAt(updatedAt: number | undefined): void {
        this.serverUpdatedAt = updatedAt;
    }

    async push(item: SyncQueueItem): Promise<SyncResultadoGateway> {
        if (this.failNext) {
            this.failNext = false;
            throw new Error("Falha simulada na sincronização");
        }
        return { serverUpdatedAt: this.serverUpdatedAt ?? Date.now() };
    }
}