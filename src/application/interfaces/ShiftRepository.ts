import { Shift } from '../../domain/entities/Shift';

export interface ShiftRepository {
  create(shift: Shift): Promise<Shift>;
  findById(id: string): Promise<Shift | null>;
  findByTenant(tenantId: string, activeOnly?: boolean): Promise<Shift[]>;
  update(id: string, shift: Shift): Promise<Shift>;
  delete(id: string): Promise<void>;
}