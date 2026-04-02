import { Decimal } from '@/app/generated/prisma/runtime/library';
import prisma from '@/v3/lib/prisma';
import { ProductCategoryEntity, ProductEntity } from './product.entity';
import type {
  CategoryQueryInput,
  CreateCategoryInput,
  CreateProductInput,
  ProductQueryInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from './product.type';

// ─────────────────────────────────────────────
//  Interfaces
// ─────────────────────────────────────────────

export interface IProductRepository {
  findAll(tenantId: string, query: ProductQueryInput): Promise<{ items: ProductEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<ProductWithCategory | null>;
  create(tenantId: string, data: CreateProductInput): Promise<ProductWithCategory>;
  update(id: string, tenantId: string, data: UpdateProductInput): Promise<ProductWithCategory>;
  updateStock(id: string, tenantId: string, stock: number): Promise<ProductWithCategory>;
  delete(id: string, tenantId: string): Promise<void>;
}

export interface IProductCategoryRepository {
  findAll(tenantId: string, query: CategoryQueryInput): Promise<{ items: ProductCategoryEntity[]; total: number }>;
  findById(id: string, tenantId: string): Promise<ProductCategoryEntity | null>;
  countChildren(parentId: string): Promise<number>;
  countProducts(categoryId: string): Promise<number>;
  create(tenantId: string, data: CreateCategoryInput): Promise<ProductCategoryEntity>;
  update(id: string, tenantId: string, data: UpdateCategoryInput): Promise<ProductCategoryEntity>;
  delete(id: string, tenantId: string): Promise<void>;
}

// Raw Prisma row with category relation
type ProductRow = {
  id: string;
  tenantId: string | null;
  productCategoryId: string | null;
  name: string;
  description: string | null;
  price: Decimal;
  type: string;
  stock: number | null;
  sku: string | null;
  imageUrl: string | null;
  alias: string | null;
  isCountable: boolean;
  unit: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  productCategory: {
    id: string;
    tenantId: string | null;
    parentId: string | null;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  } | null;
};

// Entity tuple for routes that need both
export type ProductWithCategory = {
  product: ProductEntity;
  category: ProductCategoryEntity | null;
};

function toProductWithCategory(row: ProductRow): ProductWithCategory {
  const product = new ProductEntity(row);
  const category = row.productCategory ? new ProductCategoryEntity(row.productCategory) : null;
  return { product, category };
}

const PRODUCT_INCLUDE = { productCategory: true } as const;

// ─────────────────────────────────────────────
//  Product repository
// ─────────────────────────────────────────────

class PrismaProductRepository implements IProductRepository {
  async findAll(
    tenantId: string,
    query: ProductQueryInput,
  ): Promise<{ items: ProductEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { alias: { contains: query.search, mode: 'insensitive' as const } },
          { sku: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.categoryId && { productCategoryId: query.categoryId }),
      ...(query.type && { type: query.type }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder ?? 'asc' }
      : { createdAt: 'desc' as const };

    const [rows, total] = await Promise.all([
      prisma.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy, skip, take: pageSize }),
      prisma.product.count({ where }),
    ]);

    return { items: rows.map((r) => new ProductEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<ProductWithCategory | null> {
    const row = await prisma.product.findFirst({
      where: { id, tenantId },
      include: PRODUCT_INCLUDE,
    });
    if (!row) return null;
    return toProductWithCategory(row);
  }

  async create(tenantId: string, data: CreateProductInput): Promise<ProductWithCategory> {
    const row = await prisma.product.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
        price: new Decimal(data.price),
        type: data.type,
        stock: data.stock ?? null,
        sku: data.sku ?? null,
        imageUrl: data.imageUrl ?? null,
        alias: data.alias ?? null,
        productCategoryId: data.productCategoryId ?? null,
        isCountable: data.isCountable ?? true,
        unit: data.unit ?? 'pcs',
      },
      include: PRODUCT_INCLUDE,
    });
    return toProductWithCategory(row);
  }

  async update(id: string, tenantId: string, data: UpdateProductInput): Promise<ProductWithCategory> {
    const row = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: new Decimal(data.price) }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.alias !== undefined && { alias: data.alias }),
        ...(data.productCategoryId !== undefined && { productCategoryId: data.productCategoryId }),
        ...(data.isCountable !== undefined && { isCountable: data.isCountable }),
        ...(data.unit !== undefined && { unit: data.unit }),
        tenantId,
      },
      include: PRODUCT_INCLUDE,
    });
    return toProductWithCategory(row);
  }

  async updateStock(id: string, tenantId: string, stock: number): Promise<ProductWithCategory> {
    const row = await prisma.product.update({
      where: { id },
      data: { stock, tenantId },
      include: PRODUCT_INCLUDE,
    });
    return toProductWithCategory(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.product.delete({ where: { id, tenantId } });
  }
}

// ─────────────────────────────────────────────
//  Category repository
// ─────────────────────────────────────────────

class PrismaProductCategoryRepository implements IProductCategoryRepository {
  async findAll(
    tenantId: string,
    query: CategoryQueryInput,
  ): Promise<{ items: ProductCategoryEntity[]; total: number }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = {
      tenantId,
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' as const } }),
      // parentId: undefined means "don't filter", null means "only root"
      ...(query.parentId !== undefined && { parentId: query.parentId }),
    };

    const [rows, total] = await Promise.all([
      prisma.productCategory.findMany({ where, orderBy: { name: 'asc' }, skip, take: pageSize }),
      prisma.productCategory.count({ where }),
    ]);

    return { items: rows.map((r) => new ProductCategoryEntity(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<ProductCategoryEntity | null> {
    const row = await prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!row) return null;
    return new ProductCategoryEntity(row);
  }

  async countChildren(parentId: string): Promise<number> {
    return prisma.productCategory.count({ where: { parentId } });
  }

  async countProducts(categoryId: string): Promise<number> {
    return prisma.product.count({ where: { productCategoryId: categoryId } });
  }

  async create(tenantId: string, data: CreateCategoryInput): Promise<ProductCategoryEntity> {
    const row = await prisma.productCategory.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
        parentId: data.parentId ?? null,
      },
    });
    return new ProductCategoryEntity(row);
  }

  async update(id: string, tenantId: string, data: UpdateCategoryInput): Promise<ProductCategoryEntity> {
    const row = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        tenantId,
      },
    });
    return new ProductCategoryEntity(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.productCategory.delete({ where: { id, tenantId } });
  }
}

// ─────────────────────────────────────────────
//  Singletons
// ─────────────────────────────────────────────

export const productRepository = new PrismaProductRepository();
export const categoryRepository = new PrismaProductCategoryRepository();
