import prisma from '@/lib/prisma';
import {
  OrderStatus,
  CreateOrderStatusData,
  UpdateOrderStatusData,
  OrderStatusQueryOptions,
  PaginatedOrderStatuses,
} from '../../domain/entities/OrderStatus';
import { OrderStatusRepository } from '../../domain/repositories/OrderStatusRepository';

export class PrismaOrderStatusRepository implements OrderStatusRepository {
  private static instance: PrismaOrderStatusRepository;

  private constructor() {}

  public static getInstance(): PrismaOrderStatusRepository {
    if (!PrismaOrderStatusRepository.instance) {
      PrismaOrderStatusRepository.instance = new PrismaOrderStatusRepository();
    }
    return PrismaOrderStatusRepository.instance;
  }

  async findById(id: string, tenantId: string): Promise<OrderStatus | null> {
    const status = await (prisma as any).orderStatus.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return status ? this.mapToDomain(status) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<OrderStatus | null> {
    const status = await (prisma as any).orderStatus.findFirst({
      where: {
        code,
        tenantId,
      },
    });

    return status ? this.mapToDomain(status) : null;
  }

  async findAll(tenantId: string, options: OrderStatusQueryOptions): Promise<PaginatedOrderStatuses> {
    const limit = options.limit || 10;
    const page = options.page || 1;
    const skip = (page - 1) * limit;
    const sortBy = options.sortBy || 'order';
    const sortDir = options.sortDir || 'asc';

    // Build filters
    const where: any = { tenantId };
    if (options.filters?.search) {
      where.OR = [
        { name: { contains: options.filters.search, mode: 'insensitive' } },
        { code: { contains: options.filters.search, mode: 'insensitive' } },
      ];
    }
    if (options.filters?.isActive !== undefined) {
      where.isActive = options.filters.isActive;
    }

    // Map sortBy field names
    const fieldMap: { [key: string]: string } = {
      id: 'id',
      code: 'code',
      name: 'name',
      order: 'order',
      isFinal: 'isFinal',
      isActive: 'isActive',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const sortField = fieldMap[sortBy as string] || 'order';

    const [data, total] = await Promise.all([
      (prisma as any).orderStatus.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortField]: sortDir,
        },
      }),
      (prisma as any).orderStatus.count({ where }),
    ]);

    return {
      data: data.map((status: any) => this.mapToDomain(status)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: CreateOrderStatusData, tenantId: string): Promise<OrderStatus> {
    // Check for duplicate name
    if (data.name) {
      const existingName = await (prisma as any).orderStatus.findFirst({
        where: {
          tenantId,
          name: data.name,
        },
      });

      if (existingName) {
        throw new Error(`Order status with name "${data.name}" already exists for this tenant`);
      }
    }

    // Check for duplicate code
    if (data.code) {
      const existingCode = await (prisma as any).orderStatus.findFirst({
        where: {
          tenantId,
          code: data.code,
        },
      });

      if (existingCode) {
        throw new Error(`Order status with code "${data.code}" already exists for this tenant`);
      }
    }

    // If trying to create a final status, ensure no other final status exists
    if (data.isFinal) {
      const existingFinal = await (prisma as any).orderStatus.findFirst({
        where: {
          tenantId,
          isFinal: true,
        },
      });

      if (existingFinal) {
        throw new Error(`A final status already exists for this tenant: ${existingFinal.name}`);
      }
    }

    const status = await (prisma as any).orderStatus.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        order: data.order,
        isFinal: data.isFinal || false,
        isActive: data.isActive !== false, // Default true
      },
    });

    return this.mapToDomain(status);
  }

  async update(id: string, data: UpdateOrderStatusData, tenantId: string): Promise<OrderStatus> {
    // Check for duplicate name (excluding current status)
    if (data.name) {
      const existingName = await (prisma as any).orderStatus.findFirst({
        where: {
          tenantId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existingName) {
        throw new Error(`Order status with name "${data.name}" already exists for this tenant`);
      }
    }

    // Check for duplicate code (excluding current status)
    if (data.code) {
      const existingCode = await (prisma as any).orderStatus.findFirst({
        where: {
          tenantId,
          code: data.code,
          id: { not: id },
        },
      });

      if (existingCode) {
        throw new Error(`Order status with code "${data.code}" already exists for this tenant`);
      }
    }

    // If trying to set as final, ensure no other final status exists
    if (data.isFinal === true) {
      const existingFinal = await (prisma as any).orderStatus.findFirst({
        where: {
          tenantId,
          isFinal: true,
          id: { not: id }, // Exclude current status
        },
      });

      if (existingFinal) {
        throw new Error(`A final status already exists for this tenant: ${existingFinal.name}`);
      }
    }

    const status = await (prisma as any).orderStatus.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        order: data.order,
        isFinal: data.isFinal,
        isActive: data.isActive,
      },
    });

    return this.mapToDomain(status);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await (prisma as any).orderStatus.delete({
      where: { id },
    });
  }

  async getDefaultStatuses(tenantId: string): Promise<OrderStatus[]> {
    const statuses = await (prisma as any).orderStatus.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return statuses.map((status: any) => this.mapToDomain(status));
  }

  private mapToDomain(data: any): OrderStatus {
    return {
      id: data.id,
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      order: data.order,
      isFinal: data.isFinal,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async reorderStatuses(tenantId: string, orders: { id: string; order: number }[]): Promise<OrderStatus[]> {
    // Update all statuses with new order values
    const updatedStatuses = await Promise.all(
      orders.map(({ id, order }) =>
        (prisma as any).orderStatus.update({
          where: { id },
          data: { order },
        })
      )
    );

    return updatedStatuses.map((status: any) => this.mapToDomain(status));
  }

  public static cleanup(): void {
    if (PrismaOrderStatusRepository.instance) {
      PrismaOrderStatusRepository.instance = null as any;
    }
  }
}
