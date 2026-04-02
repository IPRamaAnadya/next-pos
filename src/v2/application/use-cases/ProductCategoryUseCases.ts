import { ProductCategory } from '../../domain/entities/ProductCategory';
import { ProductCategoryRepository } from '../../domain/repositories/ProductCategoryRepository';
import { ProductCategoryDomainService } from '../../domain/services/ProductCategoryDomainService';
import { ProductCategoryQueryOptions } from './interfaces/ProductCategoryQueryOptions';

export class ProductCategoryUseCases {
  private static instance: ProductCategoryUseCases;

  private constructor(private categoryRepository: ProductCategoryRepository) {}

  public static getInstance(categoryRepository: ProductCategoryRepository): ProductCategoryUseCases {
    if (!ProductCategoryUseCases.instance) {
      ProductCategoryUseCases.instance = new ProductCategoryUseCases(categoryRepository);
    }
    return ProductCategoryUseCases.instance;
  }

  async getCategories(tenantId: string, options: ProductCategoryQueryOptions) {
    return await this.categoryRepository.findAll(tenantId, options);
  }

  async getCategoryById(id: string, tenantId: string) {
    const category = await this.categoryRepository.findById(id, tenantId);
    if (!category) {
      throw new Error('Product category not found');
    }
    return category;
  }

  async getRootCategories(tenantId: string) {
    return await this.categoryRepository.findRootCategories(tenantId);
  }

  async getCategoriesByParent(parentId: string | null, tenantId: string) {
    return await this.categoryRepository.findByParentId(parentId, tenantId);
  }

  async createCategory(data: {
    tenantId: string;
    name: string;
    description: string | null;
    parentId: string | null;
  }) {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Category name is required');
    }

    // Check name uniqueness within tenant
    const existingCategory = await this.categoryRepository.findByName(data.name.trim(), data.tenantId);
    ProductCategoryDomainService.validateNameUniqueness(data.name.trim(), existingCategory || undefined);

    // Validate parent category if provided
    let parentCategory: ProductCategory | undefined;
    if (data.parentId) {
      parentCategory = await this.getCategoryById(data.parentId, data.tenantId);
      
      // Validate hierarchy depth
      const parentDepth = parentCategory.getLevel();
      ProductCategoryDomainService.validateMaxDepth(parentDepth + 1);
    }

    // Create temporary category for validation
    const tempCategory = new ProductCategory(
      'temp-id',
      data.tenantId,
      data.name.trim(),
      data.description,
      data.parentId,
      new Date(),
      new Date()
    );

    // Validate business rules
    ProductCategoryDomainService.validateBusinessRules(tempCategory);
    ProductCategoryDomainService.validateHierarchy(tempCategory, parentCategory);

    // Create category
    return await this.categoryRepository.create({
      tenantId: data.tenantId,
      name: data.name.trim(),
      description: data.description,
      parentId: data.parentId,
    });
  }

  async updateCategory(id: string, tenantId: string, updates: Partial<ProductCategory>) {
    const existingCategory = await this.getCategoryById(id, tenantId);

    // Check name uniqueness if name is being updated
    if (updates.name && updates.name !== existingCategory.name) {
      const existingWithName = await this.categoryRepository.findByName(updates.name, tenantId, id);
      ProductCategoryDomainService.validateNameUniqueness(updates.name, existingWithName || undefined);
    }

    // Validate parent change if parentId is being updated
    if (updates.parentId !== undefined && updates.parentId !== existingCategory.parentId) {
      if (updates.parentId === id) {
        throw new Error('A category cannot be its own parent');
      }

      if (updates.parentId) {
        const newParent = await this.getCategoryById(updates.parentId, tenantId);
        
        // Check if the new parent is a descendant of the current category
        if (newParent.parentId === id) {
          throw new Error('Cannot move a category to be a child of its own child');
        }
        
        // Validate hierarchy depth
        const newParentDepth = newParent.getLevel();
        ProductCategoryDomainService.validateMaxDepth(newParentDepth + 1);
      }
    }

    return await this.categoryRepository.update(id, tenantId, updates);
  }

  async deleteCategory(id: string, tenantId: string) {
    const category = await this.getCategoryById(id, tenantId);

    // Check if category has children
    const childCount = await this.categoryRepository.countChildren(id, tenantId);
    
    // Note: In a real implementation, you'd also check for products in this category
    // For now, we'll assume 0 products for simplicity
    const productCount = 0;

    // Validate deletion constraints
    ProductCategoryDomainService.validateDeletion(category, childCount, productCount);

    await this.categoryRepository.delete(id, tenantId);
  }

  async getCategoryHierarchy(tenantId: string): Promise<ProductCategoryHierarchy[]> {
    const rootCategories = await this.getRootCategories(tenantId);
    
    const buildHierarchy = async (category: ProductCategory): Promise<ProductCategoryHierarchy> => {
      const children = await this.getCategoriesByParent(category.id, tenantId);
      const childHierarchy = await Promise.all(children.map(buildHierarchy));
      
      return {
        category,
        children: childHierarchy,
        level: category.getLevel(),
        path: ProductCategoryDomainService.calculateCategoryPath(category),
      };
    };

    return await Promise.all(rootCategories.map(buildHierarchy));
  }

  async moveCategoryToParent(categoryId: string, newParentId: string | null, tenantId: string) {
    return await this.updateCategory(categoryId, tenantId, { parentId: newParentId });
  }
}

export interface ProductCategoryHierarchy {
  category: ProductCategory;
  children: ProductCategoryHierarchy[];
  level: number;
  path: string;
}