import { Product } from '../../domain/entities/Product';
import { ProductRepository, PaginatedProducts } from '../../domain/repositories/ProductRepository';
import { ProductQueryOptions } from '../../application/use-cases/interfaces/ProductQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaProductRepository implements ProductRepository {
  private static instance: PrismaProductRepository;

  private constructor() {}

  public static getInstance(): PrismaProductRepository {
    if (!PrismaProductRepository.instance) {
      PrismaProductRepository.instance = new PrismaProductRepository();
    }
    return PrismaProductRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    'product_category_id': 'productCategoryId',
    'image_url': 'imageUrl',
    'is_countable': 'isCountable',
    'name': 'name',
    'description': 'description',
    'price': 'price',
    'type': 'type',
    'stock': 'stock',
    'sku': 'sku',
    'alias': 'alias',
    'unit': 'unit',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'name', 'description', 'price', 'type', 'stock', 'sku', 
    'imageUrl', 'alias', 'productCategoryId', 'isCountable', 'unit', 'createdAt', 'updatedAt'
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

  async findById(id: string, tenantId: string): Promise<Product | null> {
    try {
      const product = await prisma.product.findUnique({
        where: { id, tenantId },
        include: { productCategory: true },
      });

      if (!product) return null;
      return this.mapToEntity(product);
    } catch (error) {
      console.error('Error finding product by ID:', error);
      throw new Error(`Failed to find product with ID: ${id}`);
    }
  }

  async findBySku(sku: string, tenantId: string): Promise<Product | null> {
    try {
      const product = await prisma.product.findFirst({
        where: { sku, tenantId },
        include: { productCategory: true },
      });

      if (!product) return null;
      return this.mapToEntity(product);
    } catch (error) {
      console.error('Error finding product by SKU:', error);
      throw new Error(`Failed to find product with SKU: ${sku}`);
    }
  }

  async findAll(tenantId: string, options: ProductQueryOptions): Promise<PaginatedProducts> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.name) {
        whereClause.name = { contains: filters.name, mode: 'insensitive' };
      }
      
      if (filters?.categoryId) {
        whereClause.productCategoryId = filters.categoryId;
      }
      
      if (filters?.type) {
        whereClause.type = filters.type;
      }
      
      if (filters?.sku) {
        whereClause.sku = { contains: filters.sku, mode: 'insensitive' };
      }
      
      if (filters?.inStock === true) {
        whereClause.OR = [
          { type: 'service' }, // Services are always "in stock"
          { isCountable: false }, // Non-countable products are always "in stock"
          { AND: [{ type: 'good' }, { isCountable: true }, { stock: { gt: 0 } }] }, // Countable goods with positive stock
          { AND: [{ type: 'good' }, { isCountable: true }, { stock: null }] } // Countable goods without stock tracking
        ];
      } else if (filters?.inStock === false) {
        whereClause.AND = [
          { type: 'good' },
          { isCountable: true },
          { stock: { lte: 0 } } // Only countable goods with zero or negative stock (excluding null)
        ];
      }

      const totalCount = await prisma.product.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const products = await prisma.product.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
        include: { productCategory: true },
      });

      return {
        data: products.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding products:', error);
      throw new Error('Failed to retrieve products');
    }
  }

  async create(data: {
    tenantId: string;
    name: string;
    description: string | null;
    price: number;
    type: string;
    stock: number | null;
    sku: string | null;
    imageUrl: string | null;
    alias: string | null;
    productCategoryId: string;
    isCountable?: boolean;
    unit?: string;
  }): Promise<Product> {
    try {
      const product = await prisma.product.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          description: data.description,
          price: data.price,
          type: data.type,
          stock: data.stock,
          sku: data.sku,
          imageUrl: data.imageUrl,
          alias: data.alias,
          productCategoryId: data.productCategoryId,
          isCountable: data.isCountable ?? true,
          unit: data.unit ?? 'pcs',
        },
        include: { productCategory: true },
      });
      return this.mapToEntity(product);
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<Product>): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id, tenantId },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.price !== undefined && { price: updates.price }),
          ...(updates.type !== undefined && { type: updates.type }),
          ...(updates.stock !== undefined && { stock: updates.stock }),
          ...(updates.sku !== undefined && { sku: updates.sku }),
          ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
          ...(updates.alias !== undefined && { alias: updates.alias }),
          ...(updates.productCategoryId !== undefined && { productCategoryId: updates.productCategoryId }),
          ...(updates.isCountable !== undefined && { isCountable: updates.isCountable }),
          ...(updates.unit !== undefined && { unit: updates.unit }),
        },
        include: { productCategory: true },
      });
      return this.mapToEntity(product);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.product.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  async updateStock(id: string, tenantId: string, stockChange: number): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id, tenantId },
        data: {
          stock: {
            increment: stockChange,
          },
        },
        include: { productCategory: true },
      });
      return this.mapToEntity(product);
    } catch (error) {
      console.error('Error updating product stock:', error);
      throw new Error('Failed to update product stock');
    }
  }

  private mapToEntity(data: any): Product {
    return new Product(
      data.id,
      data.tenantId,
      data.name,
      data.description,
      Number(data.price), // Convert Decimal to number
      data.type,
      data.stock,
      data.sku,
      data.imageUrl,
      data.alias,
      data.productCategoryId,
      data.isCountable ?? true,
      data.unit ?? 'pcs',
      data.createdAt,
      data.updatedAt
    );
  }
}