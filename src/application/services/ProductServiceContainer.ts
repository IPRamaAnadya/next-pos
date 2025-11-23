import { ProductUseCases } from '../use-cases/ProductUseCases';
import { PrismaProductRepository } from '../../infrastructure/repositories/PrismaProductRepository';

export class ProductServiceContainer {
  private static productUseCases: ProductUseCases;

  static getProductUseCases(): ProductUseCases {
    if (!this.productUseCases) {
      const productRepository = PrismaProductRepository.getInstance();
      this.productUseCases = ProductUseCases.getInstance(productRepository);
    }
    return this.productUseCases;
  }
}