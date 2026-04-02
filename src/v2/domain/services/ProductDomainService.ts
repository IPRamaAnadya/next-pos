import { Product } from '../entities/Product';

export class ProductDomainService {
  static validateBusinessRules(product: Product): void {
    if (!product.isValid()) {
      throw new Error('Invalid product data: name must not be empty and price must be non-negative');
    }

    // Validate product type
    if (!['good', 'service'].includes(product.type)) {
      throw new Error('Product type must be either "good" or "service"');
    }

    // Validate stock for goods (only if stock tracking is enabled)
    if (product.type === 'good' && product.stock !== null && product.stock < 0) {
      throw new Error('Stock value cannot be negative');
    }

    // Validate SKU uniqueness (this would typically be handled at repository level)
    if (product.sku && product.sku.length === 0) {
      throw new Error('SKU cannot be empty string if provided');
    }
  }

  static validateStockOperation(product: Product, quantity: number): void {
    if (product.type === 'service') {
      return; // Services don't have stock constraints
    }

    if (product.stock === null) {
      return; // Products without stock tracking have no constraints
    }

    if (!product.canDecreaseStock(quantity)) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Required: ${quantity}`);
    }
  }

  static calculateNewStock(currentStock: number | null, stockChange: number): number | null {
    if (currentStock === null) return null;
    return Math.max(0, currentStock + stockChange);
  }
}