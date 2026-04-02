import { ProductCategory } from '../../domain/entities/ProductCategory';
import { ProductCategoryRepository, PaginatedProductCategories } from '../../domain/repositories/ProductCategoryRepository';
import { ProductCategoryQueryOptions } from '../../application/use-cases/interfaces/ProductCategoryQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaProductCategoryRepository implements ProductCategoryRepository {
  private static instance: PrismaProductCategoryRepository;

  private constructor() {}

  public static getInstance(): PrismaProductCategoryRepository {
    if (!PrismaProductCategoryRepository.instance) {
      PrismaProductCategoryRepository.instance = new PrismaProductCategoryRepository();
    }
    return PrismaProductCategoryRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    'parent_id': 'parentId',
    'name': 'name',
    'description': 'description',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'name', 'description', 'parentId', 'createdAt', 'updatedAt'
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

  async findById(id: string, tenantId: string): Promise<ProductCategory | null> {
    try {
      const category = await prisma.productCategory.findUnique({
        where: { id, tenantId },
      });

      if (!category) return null;
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error finding product category by ID:', error);
      throw new Error(`Failed to find product category with ID: ${id}`);
    }
  }

  async findByName(name: string, tenantId: string, excludeId?: string): Promise<ProductCategory | null> {
    try {
      const whereClause: any = { 
        name: { equals: name, mode: 'insensitive' },
        tenantId 
      };

      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const category = await prisma.productCategory.findFirst({
        where: whereClause,
      });

      if (!category) return null;
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error finding product category by name:', error);
      throw new Error(`Failed to find product category with name: ${name}`);
    }
  }

  async findAll(tenantId: string, options: ProductCategoryQueryOptions): Promise<PaginatedProductCategories> {
    try {
      const {page, sortBy, sortDir, filters } = options;

      const limit = 1000; // Fixed limit for simplicity
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.name) {
        whereClause.name = { contains: filters.name, mode: 'insensitive' };
      }
      
      if (filters?.parentId !== undefined) {
        whereClause.parentId = filters.parentId;
      }
      
      if (filters?.rootOnly) {
        whereClause.parentId = null;
      }

      const totalCount = await prisma.productCategory.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const categories = await prisma.productCategory.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: categories.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding product categories:', error);
      throw new Error('Failed to retrieve product categories');
    }
  }

  async findByParentId(parentId: string | null, tenantId: string): Promise<ProductCategory[]> {
    try {
      const categories = await prisma.productCategory.findMany({
        where: { parentId, tenantId },
        orderBy: { name: 'asc' },
      });

      return categories.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding product categories by parent ID:', error);
      throw new Error('Failed to retrieve product categories by parent');
    }
  }

  async findRootCategories(tenantId: string): Promise<ProductCategory[]> {
    try {
      const categories = await prisma.productCategory.findMany({
        where: { parentId: null, tenantId },
        orderBy: { name: 'asc' },
      });

      return categories.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding root product categories:', error);
      throw new Error('Failed to retrieve root product categories');
    }
  }

  async create(data: {
    tenantId: string;
    name: string;
    description: string | null;
    parentId: string | null;
  }): Promise<ProductCategory> {
    try {
      const category = await prisma.productCategory.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          description: data.description,
          parentId: data.parentId,
        },
      });
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error creating product category:', error);
      throw new Error('Failed to create product category');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<ProductCategory>): Promise<ProductCategory> {
    try {
      const category = await prisma.productCategory.update({
        where: { id, tenantId },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.parentId !== undefined && { parentId: updates.parentId }),
        },
      });
      return this.mapToEntity(category);
    } catch (error) {
      console.error('Error updating product category:', error);
      throw new Error('Failed to update product category');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.productCategory.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting product category:', error);
      throw new Error('Failed to delete product category');
    }
  }

  async countChildren(id: string, tenantId: string): Promise<number> {
    try {
      const count = await prisma.productCategory.count({
        where: { parentId: id, tenantId },
      });
      return count;
    } catch (error) {
      console.error('Error counting product category children:', error);
      throw new Error('Failed to count product category children');
    }
  }

  private mapToEntity(data: any): ProductCategory {
    return new ProductCategory(
      data.id,
      data.tenantId,
      data.name,
      data.description,
      data.parentId,
      data.createdAt,
      data.updatedAt
    );
  }
}