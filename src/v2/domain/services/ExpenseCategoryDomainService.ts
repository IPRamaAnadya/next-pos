import { ExpenseCategory } from '../entities/ExpenseCategory';

export class ExpenseCategoryDomainService {
  static validateBusinessRules(category: ExpenseCategory): void {
    if (!category.isValid()) {
      throw new Error('Invalid expense category: name and code are required');
    }

    if (!category.hasValidCode()) {
      throw new Error('Category code must be between 2 and 10 characters long');
    }
  }

  static validateCategoryName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name is required');
    }

    if (name.trim().length < 2) {
      throw new Error('Category name must be at least 2 characters long');
    }

    if (name.trim().length > 100) {
      throw new Error('Category name cannot exceed 100 characters');
    }
  }

  static validateCategoryCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('Category code is required');
    }

    if (code.trim().length < 2) {
      throw new Error('Category code must be at least 2 characters long');
    }

    if (code.trim().length > 10) {
      throw new Error('Category code cannot exceed 10 characters');
    }

    // Check if code contains only alphanumeric characters and underscores
    const codeRegex = /^[A-Z0-9_]+$/;
    if (!codeRegex.test(code.trim().toUpperCase())) {
      throw new Error('Category code can only contain letters, numbers, and underscores');
    }
  }

  static normalizeCode(code: string): string {
    return code.trim().toUpperCase().replace(/\s+/g, '_');
  }

  static filterCategoriesByRole(categories: ExpenseCategory[], isCashier: boolean): ExpenseCategory[] {
    return categories.filter(category => category.isVisibleToRole(isCashier));
  }

  static sortCategoriesByName(categories: ExpenseCategory[]): ExpenseCategory[] {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  static sortCategoriesByCode(categories: ExpenseCategory[]): ExpenseCategory[] {
    return [...categories].sort((a, b) => a.code.localeCompare(b.code));
  }

  static groupCategoriesByPrivacy(categories: ExpenseCategory[]): { public: ExpenseCategory[]; private: ExpenseCategory[] } {
    return categories.reduce(
      (groups, category) => {
        if (category.isPrivate) {
          groups.private.push(category);
        } else {
          groups.public.push(category);
        }
        return groups;
      },
      { public: [] as ExpenseCategory[], private: [] as ExpenseCategory[] }
    );
  }

  static canDeleteCategory(category: ExpenseCategory, expenseCount: number): { canDelete: boolean; reason?: string } {
    if (category.isSystemCategory()) {
      return { canDelete: false, reason: 'Cannot delete system categories' };
    }

    if (expenseCount > 0) {
      return { canDelete: false, reason: `Cannot delete category with ${expenseCount} existing expenses` };
    }

    return { canDelete: true };
  }
}