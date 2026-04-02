import { Tenant } from '../entities/Tenant';
import { TenantQueryOptions } from '../../application/use-cases/interfaces/TenantQueryOptions';

export interface TenantData {
  userId: string;
  name: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  subscribedUntil?: Date | null;
  isSubscribed?: boolean | null;
}

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findByUserId(userId: string): Promise<Tenant[]>;
  findByEmail(email: string): Promise<Tenant | null>;
  findAll(options: TenantQueryOptions): Promise<PaginatedTenants>;
  create(tenantData: TenantData): Promise<Tenant>;
  update(id: string, updates: Partial<Omit<TenantData, 'userId'>>): Promise<Tenant>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
  findActiveByUserId(userId: string): Promise<Tenant[]>;
  findExpiringSoon(days: number): Promise<Tenant[]>;
}

export interface PaginatedTenants {
  data: Tenant[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}