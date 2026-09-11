import { SyncQueueItem } from "../domain/entities/SyncQueueItem";
import { SyncQueueRepository } from "../domain/repositories/SyncQueueRepository";

export class InMemorySyncQueueRepository implements SyncQueueRepository {
    private readonly items: SyncQueueItem[] = [];
    private static instance: InMemorySyncQueueRepository;

    private constructor() {}

    public static getInstance(): InMemorySyncQueueRepository {
        if (!InMemorySyncQueueRepository.instance) {
            InMemorySyncQueueRepository.instance = new InMemorySyncQueueRepository();
        }
        return InMemorySyncQueueRepository.instance;
    }

    async enqueue(item: SyncQueueItem): Promise<void> {
        this.items.push(item);
    }

    async save(item: SyncQueueItem): Promise<void> {
        const index = this.items.findIndex(i => i.id === item.id);
        if (index >= 0) {
            this.items[index] = item;
        } else {
            this.items.push(item);
        }
    }

    async remove(id: string): Promise<void> {
        const index = this.items.findIndex(i => i.id === id);
        if (index >= 0) {
            this.items.splice(index, 1);
        }
    }

    async findById(id: string): Promise<SyncQueueItem | null> {
        return this.items.find(i => i.id === id) || null;
    }

    async findPending(): Promise<SyncQueueItem[]> {
        return this.items.filter(i => !i.status.isSincronizado());
    }

    async findAll(): Promise<SyncQueueItem[]> {
        return [...this.items];
    }
}