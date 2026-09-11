import { SyncStatus } from '../value-objects/SyncStatus';

export type SyncQueueOperation = 'INSERT' | 'UPDATE' | 'DELETE';

const OPERACOES_VALIDAS: readonly SyncQueueOperation[] = ['INSERT', 'UPDATE', 'DELETE'];

export class SyncQueueItem {
  private readonly _id: string;
  private readonly _entity: string;
  private readonly _entityId: string;
  private readonly _operation: SyncQueueOperation;
  private readonly _createdAt: number;
  private _updatedAt: number;
  private _attempts: number;
  private _status: SyncStatus;

  constructor(
    id: string,
    entity: string,
    entityId: string,
    operation: SyncQueueOperation,
    createdAt: number,
    updatedAt: number,
    attempts: number = 0,
    status: SyncStatus = SyncStatus.pending(),
  ) {
    this._id = id;
    this._entity = entity;
    this._entityId = entityId;
    this._operation = operation;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._attempts = attempts;
    this._status = status;
    this.validate();
  }

  get id(): string {
    return this._id;
  }

  get entity(): string {
    return this._entity;
  }

  get entityId(): string {
    return this._entityId;
  }

  get operation(): SyncQueueOperation {
    return this._operation;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  get attempts(): number {
    return this._attempts;
  }

  get status(): SyncStatus {
    return this._status;
  }

  private validate(): void {
    if (!this._id.trim()) {
      throw new Error('Id do item de sincronização inválido');
    }
    if (!this._entity.trim()) {
      throw new Error('Entidade da fila de sincronização inválida');
    }
    if (!this._entityId.trim()) {
      throw new Error('Id da entidade da fila inválido');
    }
    if (!OPERACOES_VALIDAS.includes(this._operation)) {
      throw new Error('Operação de sincronização inválida');
    }
    if (this._createdAt <= 0) {
      throw new Error('createdAt inválido');
    }
    if (this._updatedAt < this._createdAt) {
      throw new Error('updatedAt não pode ser anterior a createdAt');
    }
    if (this._attempts < 0) {
      throw new Error('Número de tentativas não pode ser negativo');
    }
  }

  registrarTentativa(agora: number): void {
    this._attempts += 1;
    this._status = SyncStatus.syncing();
    this._updatedAt = agora;
  }

  marcarSincronizado(agora: number): void {
    this._status = SyncStatus.synced();
    this._updatedAt = agora;
  }

  marcarErro(agora: number): void {
    this._status = SyncStatus.error();
    this._updatedAt = agora;
  }
}