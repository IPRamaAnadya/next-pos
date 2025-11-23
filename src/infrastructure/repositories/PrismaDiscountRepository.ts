import { Discount } from '../../domain/entities/Discount';
import { DiscountRepository, PaginatedDiscounts } from '../../domain/repositories/DiscountRepository';
import { DiscountQueryOptions } from '../../application/use-cases/interfaces/DiscountQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaDiscountRepository implements DiscountRepository {
  private static instance: PrismaDiscountRepository;

  private constructor() {}

  public static getInstance(): PrismaDiscountRepository {
    if (!PrismaDiscountRepository.instance) {
      PrismaDiscountRepository.instance = new PrismaDiscountRepository();
    }
    return PrismaDiscountRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    'valid_from': 'validFrom',
    'valid_to': 'validTo',
    'min_purchase': 'minPurchase',
    'max_discount': 'maxDiscount',
    'applicable_items': 'applicableItems',
    'reward_type': 'rewardType',
    'is_member_only': 'isMemberOnly',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'code', 'name', 'type', 'value', 'validFrom', 'validTo', 
    'minPurchase', 'maxDiscount', 'rewardType', 'isMemberOnly', 'createdAt', 'updatedAt'
  ]);

  private mapSortField(apiFieldName: string): string {
    // First check if it's already a valid Prisma field name
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }
    
    // Then check if we have a mapping from API field name to Prisma field name
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }
    
    // Default to createdAt for invalid field names
    console.warn(`Invalid sort field: ${apiFieldName}, defaulting to createdAt`);
    return 'createdAt';
  }

  async findById(id: string, tenantId: string): Promise<Discount | null> {
    try {
      const discount = await prisma.discount.findUnique({
        where: { id, tenantId },
      });

      if (!discount) return null;
      return this.mapToEntity(discount);
    } catch (error) {
      console.error('Error finding discount by ID:', error);
      throw new Error(`Failed to find discount with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: DiscountQueryOptions): Promise<PaginatedDiscounts> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.name) {
        whereClause.name = { contains: filters.name, mode: 'insensitive' };
      }
      
      if (filters?.code) {
        whereClause.code = { contains: filters.code, mode: 'insensitive' };
      }
      
      if (filters?.type) {
        whereClause.type = filters.type;
      }
      
      if (filters?.rewardType) {
        whereClause.rewardType = filters.rewardType;
      }
      
      if (filters?.isMemberOnly !== undefined) {
        whereClause.isMemberOnly = filters.isMemberOnly;
      }
      
      if (filters?.isActive !== undefined) {
        const now = new Date();
        if (filters.isActive) {
          whereClause.AND = [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validTo: null }, { validTo: { gte: now } }] }
          ];
        } else {
          whereClause.OR = [
            { validFrom: { gt: now } },
            { validTo: { lt: now } }
          ];
        }
      }

      const totalCount = await prisma.discount.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const discounts = await prisma.discount.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: discounts.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding discounts:', error);
      throw new Error('Failed to retrieve discounts');
    }
  }

  async findByCode(code: string, tenantId: string, excludeId?: string): Promise<Discount | null> {
    try {
      const whereClause: any = { code, tenantId };
      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const discount = await prisma.discount.findFirst({
        where: whereClause,
      });

      if (!discount) return null; 
      return this.mapToEntity(discount);
    } catch (error) {
      console.error('Error finding discount by code:', error);
      throw new Error('Failed to find discount by code');
    }
  }

  async findActiveDiscounts(tenantId: string): Promise<Discount[]> {
    try {
      const now = new Date();
      
      const discounts = await prisma.discount.findMany({
        where: {
          tenantId,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validTo: null }, { validTo: { gte: now } }] }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });

      return discounts.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding active discounts:', error);
      throw new Error('Failed to retrieve active discounts');
    }
  }

  async create(data: {
    tenantId: string;
    code: string | null;
    name: string;
    description: string | null;
    type: string;
    value: number;
    validFrom: Date | null;
    validTo: Date | null;
    minPurchase: number | null;
    maxDiscount: number | null;
    applicableItems: any | null;
    rewardType: string | null;
    isMemberOnly: boolean;
  }): Promise<Discount> {
    try {
      const discount = await prisma.discount.create({
        data: {
          tenantId: data.tenantId,
          code: data.code,
          name: data.name,
          description: data.description,
          type: data.type,
          value: data.value,
          validFrom: data.validFrom,
          validTo: data.validTo,
          minPurchase: data.minPurchase,
          maxDiscount: data.maxDiscount,
          applicableItems: data.applicableItems,
          rewardType: data.rewardType,
          isMemberOnly: data.isMemberOnly,
        },
      });
      return this.mapToEntity(discount);
    } catch (error) {
      console.error('Error creating discount:', error);
      throw new Error('Failed to create discount');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<Discount>): Promise<Discount> {
    try {
      const discount = await prisma.discount.update({
        where: { id, tenantId },
        data: updates,
      });
      return this.mapToEntity(discount);
    } catch (error) {
      console.error('Error updating discount:', error);
      throw new Error('Failed to update discount');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.discount.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting discount:', error);
      throw new Error('Failed to delete discount');
    }
  }

  async countActiveDiscounts(tenantId: string): Promise<number> {
    try {
      const now = new Date();
      
      return await prisma.discount.count({
        where: {
          tenantId,
          AND: [
            { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
            { OR: [{ validTo: null }, { validTo: { gte: now } }] }
          ]
        },
      });
    } catch (error) {
      console.error('Error counting active discounts:', error);
      throw new Error('Failed to count active discounts');
    }
  }

  private mapToEntity(data: any): Discount {
    return new Discount(
      data.id,
      data.tenantId,
      data.code,
      data.name,
      data.description,
      data.type,
      Number(data.value), // Convert Decimal to number
      data.validFrom,
      data.validTo,
      data.minPurchase ? Number(data.minPurchase) : null, // Convert Decimal to number
      data.maxDiscount ? Number(data.maxDiscount) : null, // Convert Decimal to number
      data.applicableItems,
      data.rewardType,
      data.isMemberOnly || false,
      data.createdAt,
      data.updatedAt,
    );
  }
}