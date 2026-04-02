import { Customer, CustomerForOrder } from '../entities/Customer';
import { CustomerQueryOptions } from '../../application/use-cases/interfaces/CustomerQueryOptions';

export interface PaginatedCustomers {
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerRepository {
  findById(id: string, tenantId: string): Promise<Customer | null>;
  findAll(tenantId: string, options: CustomerQueryOptions): Promise<PaginatedCustomers>;
  findByEmail(email: string, tenantId: string, excludeId?: string): Promise<Customer | null>;
  findByPhone(phone: string, tenantId: string, excludeId?: string): Promise<Customer | null>;
  findByMembershipCode(code: string, tenantId: string, excludeId?: string): Promise<Customer | null>;
  create(customerData: {
    tenantId: string;
    membershipCode?: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    birthday: Date | null;
    lastPurchaseAt: Date | null;
    membershipExpiredAt: Date | null;
    points: number;
  }): Promise<Customer>;
  update(id: string, tenantId: string, updates: Partial<Customer>): Promise<Customer>;
  delete(id: string, tenantId: string): Promise<void>;
  countActiveMembers(tenantId: string): Promise<number>;
  
  // Legacy methods for Order compatibility
  findByIdForOrder(id: string): Promise<CustomerForOrder | null>;
  updatePoints(id: string, points: number): Promise<void>;
  decrementPoints(id: string, points: number): Promise<void>;
  incrementPoints(id: string, points: number): Promise<void>;
}