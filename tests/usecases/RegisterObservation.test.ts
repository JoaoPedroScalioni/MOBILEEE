import { RegisterObservation } from '@/src/usecases/RegisterObservation';
import { ObservationRepository } from '@/src/domain/repositories/ObservationRepository';
import { Observation } from '@/src/domain/entities/Observation';

// Fake InMemory Repository para isolar o teste unitário
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

describe('RegisterObservation Use Case', () => {
    let repository: FakeObservationRepository;
    let sut: RegisterObservation;

    beforeEach(() => {
        repository = new FakeObservationRepository();
        sut = new RegisterObservation(repository);
    });

    it('should register a new observation with valid data', async () => {
        const input = {
            latitude: -23.5505,
            longitude: -46.6333,
            photo: 'file://photos/test-image.jpg',
        };

        const result = await sut.execute(input);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.coordinates.latitude).toBe(-23.5505);
        expect(result.coordinates.longitude).toBe(-46.6333);
        expect(result.photo).toBe('file://photos/test-image.jpg');

        expect(repository.items).toHaveLength(1);
        expect(repository.items[0].id).toBe(result.id);
    });

    it('should throw error if coordinates are out of valid range', async () => {
        const invalidInput = {
            latitude: 95, // Inválido (> 90)
            longitude: -46.6333,
            photo: 'file://photos/test-image.jpg',
        };

        await expect(sut.execute(invalidInput)).rejects.toThrow('Latitude inválida');
        expect(repository.items).toHaveLength(0);
    });

    it('should throw error if photo URI is invalid', async () => {
        const invalidInput = {
            latitude: -23.5505,
            longitude: -46.6333,
            photo: 'invalid-uri-without-protocol',
        };

        await expect(sut.execute(invalidInput)).rejects.toThrow('Foto inválida');
        expect(repository.items).toHaveLength(0);
    });
});
