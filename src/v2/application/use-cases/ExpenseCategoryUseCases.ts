import { ExpenseCategory } from '../../domain/entities/ExpenseCategory';
import { ExpenseCategoryRepository } from '../../domain/repositories/ExpenseCategoryRepository';
import { ExpenseCategoryQueryOptions } from './interfaces/ExpenseCategoryQueryOptions';
import { ExpenseCategoryDomainService } from '../../domain/services/ExpenseCategoryDomainService';

export class ExpenseCategoryUseCases {
  private static instance: ExpenseCategoryUseCases;

  private constructor(private expenseCategoryRepository: ExpenseCategoryRepository) {}

  public static getInstance(expenseCategoryRepository: ExpenseCategoryRepository): ExpenseCategoryUseCases {
    if (!ExpenseCategoryUseCases.instance) {
      ExpenseCategoryUseCases.instance = new ExpenseCategoryUseCases(expenseCategoryRepository);
    }
    return ExpenseCategoryUseCases.instance;
  }

  async getExpenseCategories(tenantId: string, options: ExpenseCategoryQueryOptions) {
    const result = await this.expenseCategoryRepository.findAll(tenantId, options);
    
    // Apply business rules for cashier visibility
    if (options.isCashier) {
      result.data = ExpenseCategoryDomainService.filterCategoriesByRole(result.data, true);
    }
    
    return result;
  }

  async getExpenseCategoryById(id: string, tenantId: string, isCashier: boolean = false) {
    const category = await this.expenseCategoryRepository.findById(id, tenantId);
    if (!category) {
      throw new Error('Expense category not found');
    }

    // Check if cashier can view this category
    if (isCashier && !category.isVisibleToRole(true)) {
      throw new Error('Access denied: Cannot view private expense category');
    }

    return category;
  }

  async createExpenseCategory(data: {
    tenantId: string;
    name: string;
    code: string;
    isPrivate?: boolean;
  }) {
    // Business validation
    ExpenseCategoryDomainService.validateCategoryName(data.name);
    ExpenseCategoryDomainService.validateCategoryCode(data.code);

    const normalizedCode = ExpenseCategoryDomainService.normalizeCode(data.code);

    // Check code uniqueness
    const isCodeUnique = await this.expenseCategoryRepository.checkCodeUniqueness(normalizedCode, data.tenantId);
    if (!isCodeUnique) {
      throw new Error(`Category code '${normalizedCode}' already exists in this tenant`);
    }

    const categoryData = ExpenseCategory.createNew(
      data.tenantId,
      data.name,
      normalizedCode,
      data.isPrivate || false
    );

    return await this.expenseCategoryRepository.create(categoryData);
  }

  async updateExpenseCategory(id: string, tenantId: string, updates: {
    name?: string;
    code?: string;
    isPrivate?: boolean;
  }) {
    const existingCategory = await this.getExpenseCategoryById(id, tenantId);
    
    // Business validation for updates
    if (updates.name !== undefined) {
      ExpenseCategoryDomainService.validateCategoryName(updates.name);
    }

    if (updates.code !== undefined) {
      ExpenseCategoryDomainService.validateCategoryCode(updates.code);
      const normalizedCode = ExpenseCategoryDomainService.normalizeCode(updates.code);
      
      // Check code uniqueness (excluding current category)
      const isCodeUnique = await this.expenseCategoryRepository.checkCodeUniqueness(normalizedCode, tenantId, id);
      if (!isCodeUnique) {
        throw new Error(`Category code '${normalizedCode}' already exists in this tenant`);
      }
      
      updates.code = normalizedCode;
    }

    // Prevent making system categories private or changing their codes
    if (existingCategory.isSystemCategory()) {
      if (updates.code !== undefined && updates.code !== existingCategory.code) {
        throw new Error('Cannot change code of system categories');
      }
      if (updates.isPrivate === true) {
        throw new Error('System categories cannot be made private');
      }
    }

    return await this.expenseCategoryRepository.update(id, tenantId, updates);
  }

  async deleteExpenseCategory(id: string, tenantId: string) {
    const category = await this.getExpenseCategoryById(id, tenantId);
    
    // Check if category has expenses
    const expenseCount = await this.expenseCategoryRepository.countExpensesByCategory(id, tenantId);
    
    // Apply business rules for deletion
    const deleteCheck = ExpenseCategoryDomainService.canDeleteCategory(category, expenseCount);
    if (!deleteCheck.canDelete) {
      throw new Error(deleteCheck.reason!);
    }

    await this.expenseCategoryRepository.delete(id, tenantId);
  }

  async getExpenseCategoryByCode(code: string, tenantId: string) {
    const normalizedCode = ExpenseCategoryDomainService.normalizeCode(code);
    const category = await this.expenseCategoryRepository.findByCode(normalizedCode, tenantId);
    if (!category) {
      throw new Error('Expense category not found');
    }
    return category;
  }

  async getVisibleCategories(tenantId: string, isCashier: boolean) {
    return await this.expenseCategoryRepository.findVisibleToRole(tenantId, isCashier);
  }

  async validateCategoryAccess(categoryId: string, tenantId: string, isCashier: boolean) {
    const category = await this.getExpenseCategoryById(categoryId, tenantId, isCashier);
    
    if (isCashier && !category.canBeUsedByRole(true)) {
      throw new Error('Access denied: Cannot use private expense category');
    }
    
    return category;
  }
}