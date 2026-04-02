import { NextRequest } from 'next/server';
import { createExpenseCategorySchema, updateExpenseCategorySchema, expenseCategoryQuerySchema, validateCodeSchema } from '../dto/ExpenseCategoryRequestDTO';
import { ExpenseCategoryMapper } from '../mappers/ExpenseCategoryMapper';
import { ExpenseCategoryServiceContainer } from '../../application/services/ExpenseCategoryServiceContainer';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';
import { ValidationError } from 'yup';

export class ExpenseCategoryController {
  private static instance: ExpenseCategoryController;

  private constructor() {}

  public static getInstance(): ExpenseCategoryController {
    if (!ExpenseCategoryController.instance) {
      ExpenseCategoryController.instance = new ExpenseCategoryController();
    }
    return ExpenseCategoryController.instance;
  }

  async create(req: NextRequest) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;
      
      if (role === 'CASHIER') {
        return apiResponse.forbidden('Cashiers cannot create expense categories');
      }

      const body = await req.json();
      const validatedData = await createExpenseCategorySchema.validate(body, { abortEarly: false });

      const expenseCategoryUseCases = ExpenseCategoryServiceContainer.getExpenseCategoryUseCases();
      const expenseCategory = await expenseCategoryUseCases.createExpenseCategory({
        tenantId,
        name: validatedData.name,
        code: validatedData.code,
        isPrivate: validatedData.is_private || false
      });

      const response = ExpenseCategoryMapper.toResponseDTO(expenseCategory);
      return apiResponse.success({ data: response, message: 'Expense category created successfully' });
    } catch (error: any) {
      console.error('Error creating expense category:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('Code already exists') || error.message?.includes('already exists')) {
        return apiResponse.success({ data: null, message: 'Code already exists for this tenant' });
      }

      return apiResponse.internalError();
    }
  }

  async update(req: NextRequest, id: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;
      
      if (role === 'CASHIER') {
        return apiResponse.forbidden('Cashiers cannot update expense categories');
      }

      const body = await req.json();
      const validatedData = await updateExpenseCategorySchema.validate(body, { abortEarly: false });

      const expenseCategoryUseCases = ExpenseCategoryServiceContainer.getExpenseCategoryUseCases();
      const expenseCategory = await expenseCategoryUseCases.updateExpenseCategory(
        id,
        tenantId,
        validatedData
      );

      const response = ExpenseCategoryMapper.toResponseDTO(expenseCategory);
      return apiResponse.success({ data: response, message: 'Expense category updated successfully' });
    } catch (error: any) {
      console.error('Error updating expense category:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      if (error.message?.includes('not found')) {
        return apiResponse.notFound('Expense category not found');
      }

      if (error.message?.includes('Code already exists') || error.message?.includes('already exists')) {
        return apiResponse.success({ data: null, message: 'Code already exists for this tenant' });
      }

      if (error.message?.includes('system category') || error.message?.includes('System categories')) {
        return apiResponse.forbidden('System categories cannot be modified');
      }

      return apiResponse.internalError();
    }
  }

  async delete(req: NextRequest, id: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;
      
      if (role === 'CASHIER') {
        return apiResponse.forbidden('Cashiers cannot delete expense categories');
      }

      const expenseCategoryUseCases = ExpenseCategoryServiceContainer.getExpenseCategoryUseCases();
      await expenseCategoryUseCases.deleteExpenseCategory(id, tenantId);

      const response = ExpenseCategoryMapper.toDeleteResponseDTO(true, 'Expense category deleted successfully');
      return apiResponse.success({ data: response, message: 'Expense category deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting expense category:', error);

      if (error.message?.includes('not found')) {
        return apiResponse.notFound('Expense category not found');
      }

      if (error.message?.includes('system category') || error.message?.includes('System categories')) {
        return apiResponse.forbidden('System categories cannot be deleted');
      }

      if (error.message?.includes('cannot be deleted because') || error.message?.includes('is being used')) {
        return apiResponse.success({ data: null, message: 'Category cannot be deleted because it is being used by existing expenses' });
      }

      return apiResponse.internalError();
    }
  }

  async getById(req: NextRequest, id: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;

      const expenseCategoryUseCases = ExpenseCategoryServiceContainer.getExpenseCategoryUseCases();
      const expenseCategory = await expenseCategoryUseCases.getExpenseCategoryById(id, tenantId, role === 'CASHIER');

      const response = ExpenseCategoryMapper.toResponseDTO(expenseCategory);
      return apiResponse.success({ data: response, message: 'Expense category retrieved successfully' });
    } catch (error: any) {
      console.error('Error getting expense category by id:', error);

      if (error.message?.includes('not found') || error.message?.includes('Access denied')) {
        return apiResponse.notFound('Expense category not found');
      }

      return apiResponse.internalError();
    }
  }

  async getAll(req: NextRequest) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;

      const url = new URL(req.url);
      const searchParams = url.searchParams;
      
      const queryParams = {
        p_limit: searchParams.get('p_limit') ? parseInt(searchParams.get('p_limit')!) : 10,
        p_page: searchParams.get('p_page') ? parseInt(searchParams.get('p_page')!) : 1,
        p_sort_by: searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('p_sort_dir') || 'desc',
        p_search: searchParams.get('p_search') || undefined,
        p_code: searchParams.get('p_code') || undefined,
        p_is_private: searchParams.get('p_is_private') === 'true' ? true : 
                     searchParams.get('p_is_private') === 'false' ? false : undefined,
        is_cashier: role === 'CASHIER',
      };

      const validatedData = await expenseCategoryQuerySchema.validate(queryParams, { abortEarly: false });

      const expenseCategoryUseCases = ExpenseCategoryServiceContainer.getExpenseCategoryUseCases();
      const result = await expenseCategoryUseCases.getExpenseCategories(tenantId, {
        limit: validatedData.p_limit,
        page: validatedData.p_page,
        sortBy: validatedData.p_sort_by,
        sortDir: validatedData.p_sort_dir,
        search: validatedData.p_search,
        code: validatedData.p_code,
        isPrivate: validatedData.p_is_private,
        isCashier: validatedData.is_cashier,
      });

      const response = ExpenseCategoryMapper.toListResponseDTO(
        result.data,
        result.pagination.total,
        validatedData.p_page,
        validatedData.p_limit
      );

      return apiResponse.success({ data: response, message: 'Expense categories retrieved successfully' });
    } catch (error: any) {
      console.error('Error getting expense categories:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      return apiResponse.internalError();
    }
  }

  async getVisible(req: NextRequest) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;

      const expenseCategoryUseCases = ExpenseCategoryServiceContainer.getExpenseCategoryUseCases();
      const categories = await expenseCategoryUseCases.getVisibleCategories(tenantId, role === 'CASHIER');

      const response = categories.map((category: any) => ExpenseCategoryMapper.toResponseDTO(category));
      return apiResponse.success({ data: response, message: 'Visible expense categories retrieved successfully' });
    } catch (error: any) {
      console.error('Error getting visible expense categories:', error);
      return apiResponse.internalError();
    }
  }

  async validateCode(req: NextRequest) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (!decoded) {
        return apiResponse.unauthorized('Invalid token');
      }

      const { userId, tenantId, role } = decoded;

      if (role === 'CASHIER') {
        return apiResponse.forbidden('Cashiers cannot validate codes');
      }

      const body = await req.json();
      const validatedData = await validateCodeSchema.validate(body, { abortEarly: false });

      const expenseCategoryUseCases = ExpenseCategoryServiceContainer.getExpenseCategoryUseCases();
      
      // Check if code exists by trying to find it
      try {
        await expenseCategoryUseCases.getExpenseCategoryByCode(validatedData.code, tenantId);
        // If we get here, the code exists
        const response = ExpenseCategoryMapper.toValidationResponseDTO(false, 'Code already exists for this tenant');
        return apiResponse.success({ data: response, message: 'Code validation completed' });
      } catch (error: any) {
        if (error.message?.includes('not found')) {
          // Code doesn't exist, so it's available
          const response = ExpenseCategoryMapper.toValidationResponseDTO(true, 'Code is available');
          return apiResponse.success({ data: response, message: 'Code validation completed' });
        }
        throw error; // Re-throw other errors
      }
    } catch (error: any) {
      console.error('Error validating code:', error);
      
      if (error instanceof ValidationError) {
        const validationErrors: { field: string; message: string }[] = [];
        
        if (error.inner && error.inner.length > 0) {
          error.inner.forEach((err) => {
            if (err.path) {
              validationErrors.push({ field: err.path, message: err.message });
            }
          });
        } else if (error.path) {
          validationErrors.push({ field: error.path, message: error.message });
        }

        if (validationErrors.length === 0) {
          validationErrors.push({ field: 'general', message: error.message || 'Validation failed' });
        }

        return apiResponse.validationError(validationErrors);
      }

      return apiResponse.internalError();
    }
  }
}