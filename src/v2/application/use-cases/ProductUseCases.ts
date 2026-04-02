import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductDomainService } from '../../domain/services/ProductDomainService';
import { ProductQueryOptions } from './interfaces/ProductQueryOptions';

export class ProductUseCases {
  private static instance: ProductUseCases;

  private constructor(private productRepository: ProductRepository) {}

  public static getInstance(productRepository: ProductRepository): ProductUseCases {
    if (!ProductUseCases.instance) {
      ProductUseCases.instance = new ProductUseCases(productRepository);
    }
    return ProductUseCases.instance;
  }

  async getProducts(tenantId: string, options: ProductQueryOptions) {
    return await this.productRepository.findAll(tenantId, options);
  }

  async getProductById(id: string, tenantId: string) {
    const product = await this.productRepository.findById(id, tenantId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async getProductBySku(sku: string, tenantId: string) {
    const product = await this.productRepository.findBySku(sku, tenantId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async createProduct(data: {
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
  }) {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Product name is required');
    }
    if (!data.productCategoryId || data.productCategoryId.trim().length === 0) {
      throw new Error('Product category ID is required');
    }

    if (data.price < 0) {
      throw new Error('Product price cannot be negative');
    }

    if (!['good', 'service'].includes(data.type)) {
      throw new Error('Product type must be either "good" or "service"');
    }

    // Validate stock for goods (only if stock is provided)
    if (data.type === 'good' && data.stock !== null && data.stock < 0) {
      throw new Error('Stock value cannot be negative');
    }

    // Check SKU uniqueness if provided
    if (data.sku && data.sku.trim().length > 0) {
      const existingProduct = await this.productRepository.findBySku(data.sku, data.tenantId);
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }
    }

    return await this.productRepository.create(data);
  }

  async updateProduct(id: string, tenantId: string, updates: Partial<Product>) {
    const existingProduct = await this.getProductById(id, tenantId);

    // Check SKU uniqueness if being updated
    if (updates.sku && updates.sku !== existingProduct.sku) {
      const existingProductWithSku = await this.productRepository.findBySku(updates.sku, tenantId);
      if (existingProductWithSku && existingProductWithSku.id !== id) {
        throw new Error('Product with this SKU already exists');
      }
    }

    // Validate price if being updated
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error('Product price cannot be negative');
    }

    // Validate type if being updated
    if (updates.type && !['good', 'service'].includes(updates.type)) {
      throw new Error('Product type must be either "good" or "service"');
    }

    return await this.productRepository.update(id, tenantId, updates);
  }

  async deleteProduct(id: string, tenantId: string) {
    await this.getProductById(id, tenantId); // Ensure exists
    await this.productRepository.delete(id, tenantId);
  }

  async updateProductStock(id: string, tenantId: string, stockChange: number) {
    const product = await this.getProductById(id, tenantId);

    if (product.type === 'service') {
      throw new Error('Cannot update stock for service products');
    }

    if (product.stock === null) {
      throw new Error('Cannot update stock for products without stock tracking');
    }

    // Validate stock operation
    ProductDomainService.validateStockOperation(product, -stockChange); // negative because we're reducing stock

    return await this.productRepository.updateStock(id, tenantId, stockChange);
  }

  async checkProductAvailability(id: string, tenantId: string, requiredQuantity: number): Promise<boolean> {
    const product = await this.getProductById(id, tenantId);
    
    if (product.type === 'service') {
      return true; // Services are always available
    }

    return product.canDecreaseStock(requiredQuantity);
  }
}