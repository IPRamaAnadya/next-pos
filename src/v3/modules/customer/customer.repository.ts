import prisma from '@/v3/lib/prisma';
import { CustomerEntity } from './customer.entity';
import type { CreateCustomerInput, CustomerQueryInput, UpdateCustomerInput } from './customer.type';

// ─────────────────────────────────────────────
//  Interface
// ─────────────────────────────────────────────

export interface ICustomerRepository {
  findAll(tenantId: string, query: CustomerQueryInput): Promise<{ items: CustomerEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<CustomerEntity | null>;
  findByEmail(email: string, tenantId: string, excludeId?: string): Promise<CustomerEntity | null>;
  findByPhone(phone: string, tenantId: string, excludeId?: string): Promise<CustomerEntity | null>;
  findByMembershipCode(code: string, tenantId: string, excludeId?: string): Promise<CustomerEntity | null>;
  countActiveMembers(tenantId: string): Promise<number>;
  create(tenantId: string, data: CreateCustomerInput): Promise<CustomerEntity>;
  update(id: string, tenantId: string, data: UpdateCustomerInput): Promise<CustomerEntity>;
  updatePoints(id: string, tenantId: string, points: number): Promise<CustomerEntity>;
  delete(id: string, tenantId: string): Promise<void>;
}

// ─────────────────────────────────────────────
//  Prisma implementation
// ─────────────────────────────────────────────

class PrismaCustomerRepository implements ICustomerRepository {
  async findAll(
    tenantId: string,
    query: CustomerQueryInput,
  ): Promise<{ items: CustomerEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const now = new Date();

    const where = {
      tenantId,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { phone: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.email && { email: { contains: query.email, mode: 'insensitive' as const } }),
      ...(query.phone && { phone: { contains: query.phone, mode: 'insensitive' as const } }),
      ...(query.membershipCode && { membershipCode: { contains: query.membershipCode, mode: 'insensitive' as const } }),
      ...(query.hasActiveMembership === true && {
        membershipCode: { not: null },
        OR: [{ membershipExpiredAt: null }, { membershipExpiredAt: { gte: now } }],
      }),
      ...(query.hasActiveMembership === false && {
        OR: [{ membershipCode: null }, { membershipExpiredAt: { lt: now } }],
      }),
    };

    const [rows, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.customer.count({ where }),
    ]);

    return { items: rows.map((r) => new CustomerEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<CustomerEntity | null> {
    const row = await prisma.customer.findFirst({ where: { id, tenantId } });
    if (!row) return null;
    return new CustomerEntity(row);
  }

  async findByEmail(email: string, tenantId: string, excludeId?: string): Promise<CustomerEntity | null> {
    const row = await prisma.customer.findFirst({
      where: { email, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    if (!row) return null;
    return new CustomerEntity(row);
  }

  async findByPhone(phone: string, tenantId: string, excludeId?: string): Promise<CustomerEntity | null> {
    const row = await prisma.customer.findFirst({
      where: { phone, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    if (!row) return null;
    return new CustomerEntity(row);
  }

  async findByMembershipCode(code: string, tenantId: string, excludeId?: string): Promise<CustomerEntity | null> {
    const row = await prisma.customer.findFirst({
      where: { membershipCode: code, tenantId, ...(excludeId && { id: { not: excludeId } }) },
    });
    if (!row) return null;
    return new CustomerEntity(row);
  }

  async countActiveMembers(tenantId: string): Promise<number> {
    const now = new Date();
    return prisma.customer.count({
      where: {
        tenantId,
        membershipCode: { not: null },
        OR: [{ membershipExpiredAt: null }, { membershipExpiredAt: { gte: now } }],
      },
    });
  }

  async create(tenantId: string, data: CreateCustomerInput): Promise<CustomerEntity> {
    const row = await prisma.customer.create({
      data: {
        tenantId,
        name: data.name.trim(),
        membershipCode: data.membershipCode ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        birthday: data.birthday ?? null,
        membershipExpiredAt: data.membershipExpiredAt ?? null,
        points: data.points ?? 0,
      },
    });
    return new CustomerEntity(row);
  }

  async update(id: string, tenantId: string, data: UpdateCustomerInput): Promise<CustomerEntity> {
    const row = await prisma.customer.update({
      where: { id },
      data: {
        tenantId,
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.membershipCode !== undefined && { membershipCode: data.membershipCode }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.birthday !== undefined && { birthday: data.birthday }),
        ...(data.lastPurchaseAt !== undefined && { lastPurchaseAt: data.lastPurchaseAt }),
        ...(data.membershipExpiredAt !== undefined && { membershipExpiredAt: data.membershipExpiredAt }),
        ...(data.points !== undefined && { points: data.points }),
      },
    });
    return new CustomerEntity(row);
  }

  async updatePoints(id: string, tenantId: string, points: number): Promise<CustomerEntity> {
    const row = await prisma.customer.update({
      where: { id },
      data: { tenantId, points },
    });
    return new CustomerEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.customer.delete({ where: { id, tenantId } });
  }
}

// ─────────────────────────────────────────────
//  Singleton
// ─────────────────────────────────────────────

export const customerRepository = new PrismaCustomerRepository();
