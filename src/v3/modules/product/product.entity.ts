import { Decimal } from '@/app/generated/prisma/runtime/library';
import type { CategoryProfile, CategorySummary, ProductProfile } from './product.type';

// ─────────────────────────────────────────────
//  ProductCategoryEntity
// ─────────────────────────────────────────────

export class ProductCategoryEntity {
  readonly id: string;
  readonly tenantId: string | null;
  readonly parentId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  constructor(data: {
    id: string;
    tenantId?: string | null;
    parentId?: string | null;
    name: string;
    description?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId ?? null;
    this.parentId = data.parentId ?? null;
    this.name = data.name;
    this.description = data.description ?? null;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  isRoot(): boolean {
    return this.parentId === null;
  }

  toSummary(): CategorySummary {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      parentId: this.parentId,
    };
  }

  toProfile(childrenCount = 0): CategoryProfile {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      parentId: this.parentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      childrenCount,
    };
  }
}

// ─────────────────────────────────────────────
//  ProductEntity
// ─────────────────────────────────────────────

export class ProductEntity {
  readonly id: string;
  readonly tenantId: string | null;
  readonly productCategoryId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly price: Decimal;
  readonly type: string;
  readonly stock: number | null;
  readonly sku: string | null;
  readonly imageUrl: string | null;
  readonly alias: string | null;
  readonly isCountable: boolean;
  readonly unit: string;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  constructor(data: {
    id: string;
    tenantId?: string | null;
    productCategoryId?: string | null;
    name: string;
    description?: string | null;
    price: Decimal;
    type: string;
    stock?: number | null;
    sku?: string | null;
    imageUrl?: string | null;
    alias?: string | null;
    isCountable: boolean;
    unit: string;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId ?? null;
    this.productCategoryId = data.productCategoryId ?? null;
    this.name = data.name;
    this.description = data.description ?? null;
    this.price = data.price;
    this.type = data.type;
    this.stock = data.stock ?? null;
    this.sku = data.sku ?? null;
    this.imageUrl = data.imageUrl ?? null;
    this.alias = data.alias ?? null;
    this.isCountable = data.isCountable;
    this.unit = data.unit;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  isService(): boolean {
    return this.type === 'service';
  }

  isGood(): boolean {
    return this.type === 'good';
  }

  isInStock(): boolean {
    if (!this.isCountable) return true;
    if (this.stock === null) return true;
    return this.stock > 0;
  }

  toProfile(category?: CategorySummary | null): ProductProfile {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      description: this.description,
      price: this.price.toNumber(),
      type: this.type,
      stock: this.stock,
      sku: this.sku,
      imageUrl: this.imageUrl,
      alias: this.alias,
      isCountable: this.isCountable,
      unit: this.unit,
      productCategoryId: this.productCategoryId,
      category: category ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
