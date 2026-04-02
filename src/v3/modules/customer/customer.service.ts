import { customerRepository } from './customer.repository';
import type {
  CreateCustomerInput,
  CustomerProfile,
  CustomerQueryInput,
  ExtendMembershipInput,
  UpdateCustomerInput,
  UpdatePointsInput,
} from './customer.type';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function buildPagination(total: number, page: number, pageSize: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

// ─────────────────────────────────────────────
//  CustomerService
// ─────────────────────────────────────────────

class CustomerService {
  // ── Read ────────────────────────────────────

  async listCustomers(
    tenantId: string,
    query: CustomerQueryInput,
  ): Promise<{ items: CustomerProfile[]; pagination: PaginationMeta }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    const { items, total } = await customerRepository.findAll(tenantId, { ...query, page, pageSize });

    return {
      items: items.map((c) => c.toProfile()),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  async getCustomer(id: string, tenantId: string): Promise<CustomerProfile> {
    const customer = await customerRepository.findById(id, tenantId);
    if (!customer) throw new Error('Customer not found');
    return customer.toProfile();
  }

  async getActiveMembersCount(tenantId: string): Promise<number> {
    return customerRepository.countActiveMembers(tenantId);
  }

  // ── Create / Update / Delete ─────────────────

  async createCustomer(tenantId: string, input: CreateCustomerInput): Promise<CustomerProfile> {
    if (!input.name?.trim()) throw new Error('Customer name is required');
    if (input.points !== undefined && input.points < 0) throw new Error('Points cannot be negative');
    if (input.membershipExpiredAt && input.membershipExpiredAt <= new Date()) {
      throw new Error('Membership expiry must be a future date');
    }

    if (input.email) {
      const dup = await customerRepository.findByEmail(input.email, tenantId);
      if (dup) throw new Error('A customer with this email already exists');
    }
    if (input.phone) {
      const dup = await customerRepository.findByPhone(input.phone, tenantId);
      if (dup) throw new Error('A customer with this phone number already exists');
    }
    if (input.membershipCode) {
      const dup = await customerRepository.findByMembershipCode(input.membershipCode, tenantId);
      if (dup) throw new Error('A customer with this membership code already exists');
    }

    const customer = await customerRepository.create(tenantId, input);
    return customer.toProfile();
  }

  async updateCustomer(id: string, tenantId: string, input: UpdateCustomerInput): Promise<CustomerProfile> {
    const existing = await customerRepository.findById(id, tenantId);
    if (!existing) throw new Error('Customer not found');

    if (input.name !== undefined && !input.name.trim()) throw new Error('Customer name cannot be empty');
    if (input.points !== undefined && input.points < 0) throw new Error('Points cannot be negative');

    if (input.email && input.email !== existing.email) {
      const dup = await customerRepository.findByEmail(input.email, tenantId, id);
      if (dup) throw new Error('A customer with this email already exists');
    }
    if (input.phone && input.phone !== existing.phone) {
      const dup = await customerRepository.findByPhone(input.phone, tenantId, id);
      if (dup) throw new Error('A customer with this phone number already exists');
    }
    if (input.membershipCode && input.membershipCode !== existing.membershipCode) {
      const dup = await customerRepository.findByMembershipCode(input.membershipCode, tenantId, id);
      if (dup) throw new Error('A customer with this membership code already exists');
    }

    const customer = await customerRepository.update(id, tenantId, input);
    return customer.toProfile();
  }

  async deleteCustomer(id: string, tenantId: string): Promise<void> {
    const existing = await customerRepository.findById(id, tenantId);
    if (!existing) throw new Error('Customer not found');
    await customerRepository.delete(id, tenantId);
  }

  // ── Points ──────────────────────────────────

  async updatePoints(id: string, tenantId: string, input: UpdatePointsInput): Promise<CustomerProfile> {
    const existing = await customerRepository.findById(id, tenantId);
    if (!existing) throw new Error('Customer not found');

    if (input.points < 0) throw new Error('Points value cannot be negative');

    let newPoints: number;

    if (input.operation === 'set') {
      newPoints = input.points;
    } else if (input.operation === 'add') {
      newPoints = existing.points + input.points;
    } else {
      if (existing.points < input.points) {
        throw new Error(`Insufficient points. Customer has ${existing.points} points`);
      }
      newPoints = existing.points - input.points;
    }

    const customer = await customerRepository.updatePoints(id, tenantId, newPoints);
    return customer.toProfile();
  }

  // ── Membership ──────────────────────────────

  async extendMembership(id: string, tenantId: string, input: ExtendMembershipInput): Promise<CustomerProfile> {
    const existing = await customerRepository.findById(id, tenantId);
    if (!existing) throw new Error('Customer not found');

    if (input.membershipExpiredAt <= new Date()) {
      throw new Error('Membership expiry must be a future date');
    }

    const customer = await customerRepository.update(id, tenantId, {
      membershipExpiredAt: input.membershipExpiredAt,
    });
    return customer.toProfile();
  }
}

export const customerService = new CustomerService();
