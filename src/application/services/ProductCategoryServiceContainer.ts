import { ProductCategoryUseCases } from '../use-cases/ProductCategoryUseCases';
import { PrismaProductCategoryRepository } from '../../infrastructure/repositories/PrismaProductCategoryRepository';

export class ProductCategoryServiceContainer {
  private static categoryUseCases: ProductCategoryUseCases;

  static getCategoryUseCases(): ProductCategoryUseCases {
    if (!this.categoryUseCases) {
      const categoryRepository = PrismaProductCategoryRepository.getInstance();
      this.categoryUseCases = ProductCategoryUseCases.getInstance(categoryRepository);
    }
    return this.categoryUseCases;
  }
}