import { categoryRepository, productRepository } from './product.repository';
import type {
  CategoryProfile,
  CategoryQueryInput,
  CreateCategoryInput,
  CreateProductInput,
  ProductProfile,
  ProductQueryInput,
  UpdateCategoryInput,
  UpdateProductInput,
  UpdateStockInput,
} from './product.type';

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
//  ProductService
// ─────────────────────────────────────────────

class ProductService {
  // ── Products ────────────────────────────────

  async listProducts(
    tenantId: string,
    query: ProductQueryInput,
  ): Promise<{ items: ProductProfile[]; pagination: PaginationMeta }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    const { items, total } = await productRepository.findAll(tenantId, { ...query, page, pageSize });

    return {
      items: items.map((p) => p.toProfile()),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  async getProduct(id: string, tenantId: string): Promise<ProductProfile> {
    const result = await productRepository.findById(id, tenantId);
    if (!result) throw new Error('Product not found');

    const { product, category } = result;
    return product.toProfile(category?.toSummary() ?? null);
  }

  async createProduct(tenantId: string, input: CreateProductInput): Promise<ProductProfile> {
    if (!input.name?.trim()) throw new Error('Product name is required');
    if (input.price < 0) throw new Error('Price cannot be negative');

    const { product, category } = await productRepository.create(tenantId, input);
    return product.toProfile(category?.toSummary() ?? null);
  }

  async updateProduct(id: string, tenantId: string, input: UpdateProductInput): Promise<ProductProfile> {
    const existing = await productRepository.findById(id, tenantId);
    if (!existing) throw new Error('Product not found');

    if (input.name !== undefined && !input.name.trim()) throw new Error('Product name cannot be empty');
    if (input.price !== undefined && input.price < 0) throw new Error('Price cannot be negative');

    const { product, category } = await productRepository.update(id, tenantId, input);
    return product.toProfile(category?.toSummary() ?? null);
  }

  async updateStock(id: string, tenantId: string, input: UpdateStockInput): Promise<ProductProfile> {
    const existing = await productRepository.findById(id, tenantId);
    if (!existing) throw new Error('Product not found');

    const { product: existingProduct } = existing;
    if (existingProduct.isService()) throw new Error('Cannot set stock for a service product');
    if (!existingProduct.isCountable) throw new Error('Stock management is disabled for this product');
    if (input.stock < 0) throw new Error('Stock cannot be negative');

    const { product, category } = await productRepository.updateStock(id, tenantId, input.stock);
    return product.toProfile(category?.toSummary() ?? null);
  }

  async deleteProduct(id: string, tenantId: string): Promise<void> {
    const existing = await productRepository.findById(id, tenantId);
    if (!existing) throw new Error('Product not found');

    await productRepository.delete(id, tenantId);
  }

  // ── Categories ──────────────────────────────

  async listCategories(
    tenantId: string,
    query: CategoryQueryInput,
  ): Promise<{ items: CategoryProfile[]; pagination: PaginationMeta }> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    const { items, total } = await categoryRepository.findAll(tenantId, { ...query, page, pageSize });

    const profiles = await Promise.all(
      items.map(async (cat) => {
        const childrenCount = await categoryRepository.countChildren(cat.id);
        return cat.toProfile(childrenCount);
      }),
    );

    return { items: profiles, pagination: buildPagination(total, page, pageSize) };
  }

  async getCategory(id: string, tenantId: string): Promise<CategoryProfile> {
    const cat = await categoryRepository.findById(id, tenantId);
    if (!cat) throw new Error('Category not found');

    const childrenCount = await categoryRepository.countChildren(id);
    return cat.toProfile(childrenCount);
  }

  async createCategory(tenantId: string, input: CreateCategoryInput): Promise<CategoryProfile> {
    if (!input.name?.trim()) throw new Error('Category name is required');

    const cat = await categoryRepository.create(tenantId, input);
    return cat.toProfile(0);
  }

  async updateCategory(id: string, tenantId: string, input: UpdateCategoryInput): Promise<CategoryProfile> {
    const existing = await categoryRepository.findById(id, tenantId);
    if (!existing) throw new Error('Category not found');

    if (input.name !== undefined && !input.name.trim()) throw new Error('Category name cannot be empty');

    // Prevent circular parent reference
    if (input.parentId !== undefined && input.parentId === id) {
      throw new Error('A category cannot be its own parent');
    }

    const cat = await categoryRepository.update(id, tenantId, input);
    const childrenCount = await categoryRepository.countChildren(id);
    return cat.toProfile(childrenCount);
  }

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    const existing = await categoryRepository.findById(id, tenantId);
    if (!existing) throw new Error('Category not found');

    const [childrenCount, productCount] = await Promise.all([
      categoryRepository.countChildren(id),
      categoryRepository.countProducts(id),
    ]);

    if (childrenCount > 0) throw new Error('Cannot delete a category that has subcategories');
    if (productCount > 0) throw new Error('Cannot delete a category that still has products');

    await categoryRepository.delete(id, tenantId);
  }
}

export const productService = new ProductService();
