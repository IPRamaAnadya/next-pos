import { Decimal } from '@/app/generated/prisma/runtime/library';
import prisma from '@/v3/lib/prisma';
import { DiscountEntity } from './discount.entity';
import type { CreateDiscountInput, DiscountQueryInput, UpdateDiscountInput } from './discount.type';

// ─────────────────────────────────────────────
//  Interface
// ─────────────────────────────────────────────

export interface IDiscountRepository {
  findAll(tenantId: string, query: DiscountQueryInput): Promise<{ items: DiscountEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<DiscountEntity | null>;
  findByCode(code: string, tenantId: string, excludeId?: string): Promise<DiscountEntity | null>;
  findActive(tenantId: string): Promise<DiscountEntity[]>;
  create(tenantId: string, data: CreateDiscountInput): Promise<DiscountEntity>;
  update(id: string, tenantId: string, data: UpdateDiscountInput): Promise<DiscountEntity>;
  delete(id: string, tenantId: string): Promise<void>;
}

// ─────────────────────────────────────────────
//  Prisma implementation
// ─────────────────────────────────────────────

class PrismaDiscountRepository implements IDiscountRepository {
  async findAll(
    tenantId: string,
    query: DiscountQueryInput,
  ): Promise<{ items: DiscountEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      tenantId,
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.type && { type: query.type }),
      ...(query.isMemberOnly !== undefined && { isMemberOnly: query.isMemberOnly }),
    };

    if (query.isActive === true) {
      where.OR = [{ validFrom: null }, { validFrom: { lte: now } }];
      where.AND = [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }];
    } else if (query.isActive === false) {
      where.OR = [{ validFrom: { gt: now } }, { validTo: { lt: now } }];
    }

    const [rows, total] = await Promise.all([
      prisma.discount.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.discount.count({ where }),
    ]);

    return { items: rows.map((r) => new DiscountEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<DiscountEntity | null> {
    const row = await prisma.discount.findFirst({ where: { id, tenantId } });
    if (!row) return null;
    return new DiscountEntity(row);
  }

  async findByCode(code: string, tenantId: string, excludeId?: string): Promise<DiscountEntity | null> {
    const row = await prisma.discount.findFirst({
      where: {
        code,
        tenantId,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    if (!row) return null;
    return new DiscountEntity(row);
  }

  async findActive(tenantId: string): Promise<DiscountEntity[]> {
    const now = new Date();
    const rows = await prisma.discount.findMany({
      where: {
        tenantId,
        OR: [{ validFrom: null }, { validFrom: { lte: now } }],
        AND: [{ OR: [{ validTo: null }, { validTo: { gte: now } }] }],
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => new DiscountEntity(r));
  }

  async create(tenantId: string, data: CreateDiscountInput): Promise<DiscountEntity> {
    const row = await prisma.discount.create({
      data: {
        tenantId,
        code: data.code ?? null,
        name: data.name.trim(),
        description: data.description ?? null,
        type: data.type,
        value: new Decimal(data.value),
        validFrom: data.validFrom ?? null,
        validTo: data.validTo ?? null,
        minPurchase: data.minPurchase != null ? new Decimal(data.minPurchase) : null,
        maxDiscount: data.maxDiscount != null ? new Decimal(data.maxDiscount) : null,
        applicableItems: data.applicableItems !== undefined ? (data.applicableItems as object) : undefined,
        rewardType: data.rewardType ?? null,
        isMemberOnly: data.isMemberOnly ?? false,
      },
    });
    return new DiscountEntity(row);
  }

  async update(id: string, tenantId: string, data: UpdateDiscountInput): Promise<DiscountEntity> {
    const row = await prisma.discount.update({
      where: { id },
      data: {
        tenantId,
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.value !== undefined && { value: new Decimal(data.value) }),
        ...(data.validFrom !== undefined && { validFrom: data.validFrom }),
        ...(data.validTo !== undefined && { validTo: data.validTo }),
        ...(data.minPurchase !== undefined && {
          minPurchase: data.minPurchase != null ? new Decimal(data.minPurchase) : null,
        }),
        ...(data.maxDiscount !== undefined && {
          maxDiscount: data.maxDiscount != null ? new Decimal(data.maxDiscount) : null,
        }),
        ...(data.applicableItems !== undefined && { applicableItems: data.applicableItems as object }),
        ...(data.rewardType !== undefined && { rewardType: data.rewardType }),
        ...(data.isMemberOnly !== undefined && { isMemberOnly: data.isMemberOnly }),
      },
    });
    return new DiscountEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.discount.delete({ where: { id, tenantId } });
  }
}

// ─────────────────────────────────────────────
//  Singleton
// ─────────────────────────────────────────────

export const discountRepository = new PrismaDiscountRepository();
