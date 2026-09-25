export class Coordenada {
  private readonly latitude: number;
  private readonly longitude: number;
  private readonly timestamp: number;

  constructor(latitude: number, longitude: number, timestamp: number = Date.now()) {
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      throw new Error('A latitude deve ser um número válido.');
    }
    if (typeof longitude !== 'number' || isNaN(longitude)) {
      throw new Error('A longitude deve ser um número válido.');
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error('A latitude deve estar no intervalo de -90 a 90.');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('A longitude deve estar no intervalo de -180 a 180.');
    }
    if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp <= 0) {
      throw new Error('A marca temporal (timestamp) deve ser válida e positiva.');
    }

    this.latitude = latitude;
    this.longitude = longitude;
    this.timestamp = timestamp;
  }

  public getLatitude(): number {
    return this.latitude;
  }

  public getLongitude(): number {
    return this.longitude;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public equals(other: Coordenada): boolean {
    if (!(other instanceof Coordenada)) return false;
    return (
      this.latitude === other.latitude &&
      this.longitude === other.longitude &&
      this.timestamp === other.timestamp
    );
  }
}
