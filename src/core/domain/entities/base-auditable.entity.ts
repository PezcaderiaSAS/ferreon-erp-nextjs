export abstract class BaseAuditableEntity {
  public createdAt: Date;
  public updatedAt: Date;
  public deletedAt: Date | null;
  public deletedBy: string | null;

  constructor(
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.deletedAt = deletedAt || null;
    this.deletedBy = deletedBy || null;
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  softDelete(userId: string = "sistema"): void {
    this.deletedAt = new Date();
    this.deletedBy = userId;
    this.updatedAt = new Date();
  }

  restore(): void {
    this.deletedAt = null;
    this.deletedBy = null;
    this.updatedAt = new Date();
  }
}
