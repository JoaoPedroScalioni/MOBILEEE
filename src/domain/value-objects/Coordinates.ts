// VALUE OBJECT: Objeto de Valor. Ele não tem um ID próprio, é definido pelos seus valores (latitude e longitude)
// Se precisar mudar algo (ex: adicionar altitude), adicione como parâmetro no construtor e crie a validação correspondente.
export class Coordinates {
    constructor (
        public readonly latitude: number,
        public readonly longitude: number
    ) {
        this.validate(); // Sempre se autovalida na criação
    }

    // Regras de validação geográficas (lat vai de -90 a 90 e lon de -180 a 180)
    // Se o professor pedir para limitar a área (ex: só aceitar no Brasil), mude a validação aqui.
    private validate(): void {
        if (this.latitude < -90 || this.latitude > 90) {
            throw new Error('Latitude inválida');
        }
        if (this.longitude < -180 || this.longitude > 180) {
            throw new Error('Longitude inválida');
        }
    }
}