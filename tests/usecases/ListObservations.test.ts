import { ListObservations } from '@/src/usecases/ListObservations';
import { ObservationRepository } from '@/src/domain/repositories/ObservationRepository';
import { Observation } from '@/src/domain/entities/Observation';
import { Coordinates } from '@/src/domain/value-objects/Coordinates';

class FakeObservationRepository implements ObservationRepository {
    public items: Observation[] = [];

    async save(observation: Observation): Promise<void> {
        this.items.push(observation);
    }

    async findById(id: string): Promise<Observation | null> {
        return this.items.find(i => i.id === id) || null;
    }

    async findAll(): Promise<Observation[]> {
        return [...this.items];
    }
}

describe('ListObservations Use Case', () => {
    let repository: FakeObservationRepository;
    let sut: ListObservations;

    beforeEach(() => {
        repository = new FakeObservationRepository();
        sut = new ListObservations(repository);
    });

    it('should return empty list when no observations are stored', async () => {
        const result = await sut.execute();
        expect(result).toEqual([]);
    });

    it('should return all stored observations', async () => {
        const obs1 = new Observation('1', new Coordinates(-20, -40), 'file://photo1.jpg');
        const obs2 = new Observation('2', new Coordinates(-21, -41), 'file://photo2.jpg');
        await repository.save(obs1);
        await repository.save(obs2);

        const result = await sut.execute();

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('1');
        expect(result[1].id).toBe('2');
    });
});
