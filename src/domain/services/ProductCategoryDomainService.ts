import { ProductCategory } from '../entities/ProductCategory';

export class ProductCategoryDomainService {
  static validateBusinessRules(category: ProductCategory): void {
    if (!category.isValid()) {
      throw new Error('Invalid product category data: name cannot be empty');
    }

    // Validate name length
    if (category.name.length > 255) {
      throw new Error('Category name cannot exceed 255 characters');
    }

    // Validate description length
    if (category.description && category.description.length > 1000) {
      throw new Error('Category description cannot exceed 1000 characters');
    }
  }

  static validateHierarchy(category: ProductCategory, potentialParent?: ProductCategory): void {
    if (!potentialParent) {
      return; // Root category is always valid
    }

    // Prevent circular references
    if (potentialParent.id === category.id) {
      throw new Error('A category cannot be its own parent');
    }

    // Basic hierarchy validation
    if (!potentialParent.canBeParentOf(category)) {
      throw new Error('Invalid parent-child relationship');
    }
  }

  static validateDeletion(category: ProductCategory, childCount: number, productCount: number): void {
    if (childCount > 0) {
      throw new Error('Cannot delete category that has subcategories. Please move or delete subcategories first.');
    }

    if (productCount > 0) {
      throw new Error('Cannot delete category that has products. Please move or delete products first.');
    }
  }

  static validateNameUniqueness(name: string, existingCategory?: ProductCategory): void {
    if (existingCategory) {
      throw new Error(`A category with the name "${name}" already exists`);
    }
  }

  static calculateCategoryPath(category: ProductCategory, parentCategory?: ProductCategory): string {
    if (!parentCategory) {
      return category.name;
    }
    
    return `${parentCategory.name} > ${category.name}`;
  }

  static validateMaxDepth(currentDepth: number, maxDepth: number = 3): void {
    if (currentDepth >= maxDepth) {
      throw new Error(`Category hierarchy cannot exceed ${maxDepth} levels`);
    }
  }
}