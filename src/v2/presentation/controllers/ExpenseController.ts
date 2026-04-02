import { NextRequest } from 'next/server';
import { ExpenseServiceContainer } from '../../application/services/ExpenseServiceContainer';
import { ExpenseResponseDTO } from '../dto/ExpenseResponseDTO';
import { 
  createExpenseSchema, 
  updateExpenseSchema, 
  expenseQuerySchema,
  markPaidSchema,
  dateRangeSchema,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  MarkPaidRequest,
  DateRangeRequest
} from '../dto/ExpenseRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class ExpenseController {
  private static instance: ExpenseController;

  private constructor() {}

  public static getInstance(): ExpenseController {
    if (!ExpenseController.instance) {
      ExpenseController.instance = new ExpenseController();
    }
    return ExpenseController.instance;
  }

  async getExpenses(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('p_sort_dir') || 'desc',
        p_description: searchParams.get('p_description') || undefined,
        p_expense_category_id: searchParams.get('p_expense_category_id') || undefined,
        p_staff_id: searchParams.get('p_staff_id') || undefined,
        p_payment_type: searchParams.get('p_payment_type') || undefined,
        p_is_show: searchParams.get('p_is_show') === 'true' ? true : 
                   searchParams.get('p_is_show') === 'false' ? false : undefined,
        p_is_paid: searchParams.get('p_is_paid') === 'true' ? true : 
                   searchParams.get('p_is_paid') === 'false' ? false : undefined,
        p_min_amount: searchParams.get('p_min_amount') ? parseFloat(searchParams.get('p_min_amount')!) : undefined,
        p_max_amount: searchParams.get('p_max_amount') ? parseFloat(searchParams.get('p_max_amount')!) : undefined,
        p_start_date: searchParams.get('p_start_date') ? new Date(searchParams.get('p_start_date')!) : undefined,
        p_end_date: searchParams.get('p_end_date') ? new Date(searchParams.get('p_end_date')!) : undefined,
        is_cashier: searchParams.get('is_cashier') === 'true' || searchParams.get('isCashier') === 'true',
      };

      const validatedQuery = await expenseQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir as 'asc' | 'desc',
        filters: {
          description: validatedQuery.p_description,
          expenseCategoryId: validatedQuery.p_expense_category_id,
          staffId: validatedQuery.p_staff_id,
          paymentType: validatedQuery.p_payment_type,
          isShow: validatedQuery.p_is_show,
          isPaid: validatedQuery.p_is_paid,
          minAmount: validatedQuery.p_min_amount,
          maxAmount: validatedQuery.p_max_amount,
          startDate: validatedQuery.p_start_date,
          endDate: validatedQuery.p_end_date,
        },
        isCashier: validatedQuery.is_cashier,
      };

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const result = await expenseUseCases.getExpenses(tenantId, options);

      return ExpenseResponseDTO.mapPaginatedResponse(result);
    } catch (error: any) {
      console.error('Get expenses error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = error.errors || [];
        const formattedErrors = validationErrors.map((err: any) => {
          if (typeof err === 'string') {
            return { field: 'general', message: err };
          }
          return { field: err.path || 'unknown', message: err.message || err };
        });
        return apiResponse.validationError(formattedErrors);
      }

      return apiResponse.internalError();
    }
  }

  async getExpenseById(req: NextRequest, tenantId: string, expenseId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      // Check if user is cashier
      const { searchParams } = new URL(req.url);
      const isCashier = searchParams.get('is_cashier') === 'true' || searchParams.get('isCashier') === 'true';

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expense = await expenseUseCases.getExpenseById(expenseId, tenantId, isCashier);

      return ExpenseResponseDTO.mapSingleResponse(expense);
    } catch (error: any) {
      console.error('Get expense by ID error:', error);
      
      if (error.message === 'Expense not found') {
        return apiResponse.notFound('Expense not found');
      }

      if (error.message === 'Access denied: Cannot view private expense') {
        return apiResponse.forbidden('Access denied: Cannot view private expense');
      }

      return apiResponse.internalError();
    }
  }

  async createExpense(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      
      // Add detailed logging for debugging
      console.log('Request body for expense creation:', JSON.stringify(body));
      
      // Basic validation checks
      if (!body || typeof body !== 'object') {
        return apiResponse.validationError([{ field: 'body', message: 'Request body must be a valid JSON object' }]);
      }
      
      let validatedData: CreateExpenseRequest;
      try {
        validatedData = await createExpenseSchema.validate(body, { abortEarly: false });
      } catch (validationError: any) {
        console.error('Validation error details:', {
          name: validationError.name,
          message: validationError.message,
          errors: validationError.errors,
          inner: validationError.inner,
          path: validationError.path,
          type: validationError.type,
          value: validationError.value
        });
        
        let formattedErrors = [];
        
        if (validationError.inner && validationError.inner.length > 0) {
          // Handle multiple validation errors
          formattedErrors = validationError.inner.map((err: any) => ({
            field: err.path || 'unknown',
            message: err.message || 'Invalid value'
          }));
        } else if (validationError.path) {
          // Handle single validation error
          formattedErrors = [{
            field: validationError.path,
            message: validationError.message || 'Invalid value'
          }];
        } else {
          // Handle general validation error
          formattedErrors = [{
            field: 'general',
            message: validationError.message || 'Validation failed'
          }];
        }
        
        return apiResponse.validationError(formattedErrors);
      }

      // Check if user is cashier
      const { searchParams } = new URL(req.url);
      const isCashier = searchParams.get('is_cashier') === 'true' || searchParams.get('isCashier') === 'true';

      const expenseData = {
        tenantId,
        expenseCategoryId: validatedData.expense_category_id,
        staffId: validatedData.staff_id,
        description: validatedData.description,
        amount: validatedData.amount,
        paymentType: validatedData.payment_type || 'Cash',
        isShow: isCashier ? true : (validatedData.is_show ?? true),
        paidAt: validatedData.paid_at || null,
        attachmentUrl: validatedData.attachment_url || null,
        payrollDetailId: validatedData.payroll_detail_id || null,
      };

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expense = await expenseUseCases.createExpense(expenseData);

      return ExpenseResponseDTO.mapCreatedResponse(expense);
    } catch (error: any) {
      console.error('Create expense error:', {
        message: error.message,
        name: error.name,
        errors: error.errors,
        stack: error.stack
      });
      
      if (error.name === 'ValidationError') {
        const validationErrors = error.errors || [];
        const formattedErrors = validationErrors.map((err: any) => {
          if (typeof err === 'string') {
            return { field: 'general', message: err };
          }
          return { field: err.path || 'unknown', message: err.message || err };
        });
        return apiResponse.validationError(formattedErrors);
      }

      if (error.message && (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be'))) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async updateExpense(req: NextRequest, tenantId: string, expenseId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: UpdateExpenseRequest = await updateExpenseSchema.validate(body);

      const updates: any = {};
      if (validatedData.expense_category_id !== undefined) updates.expenseCategoryId = validatedData.expense_category_id;
      if (validatedData.staff_id !== undefined) updates.staffId = validatedData.staff_id;
      if (validatedData.description !== undefined) updates.description = validatedData.description;
      if (validatedData.amount !== undefined) updates.amount = validatedData.amount;
      if (validatedData.payment_type !== undefined) updates.paymentType = validatedData.payment_type;
      if (validatedData.is_show !== undefined) updates.isShow = validatedData.is_show;
      if (validatedData.paid_at !== undefined) updates.paidAt = validatedData.paid_at;
      if (validatedData.attachment_url !== undefined) updates.attachmentUrl = validatedData.attachment_url;
      if (validatedData.payroll_detail_id !== undefined) updates.payrollDetailId = validatedData.payroll_detail_id;

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expense = await expenseUseCases.updateExpense(expenseId, tenantId, updates);

      return ExpenseResponseDTO.mapUpdatedResponse(expense);
    } catch (error: any) {
      console.error('Update expense error:', {
        message: error.message,
        name: error.name,
        errors: error.errors,
        stack: error.stack
      });
      
      if (error.message === 'Expense not found') {
        return apiResponse.notFound('Expense not found');
      }

      if (error.name === 'ValidationError') {
        const validationErrors = error.errors || [];
        const formattedErrors = validationErrors.map((err: any) => {
          if (typeof err === 'string') {
            return { field: 'general', message: err };
          }
          return { field: err.path || 'unknown', message: err.message || err };
        });
        return apiResponse.validationError(formattedErrors);
      }

      if (error.message && (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('must be'))) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async deleteExpense(req: NextRequest, tenantId: string, expenseId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      await expenseUseCases.deleteExpense(expenseId, tenantId);

      return ExpenseResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete expense error:', error);
      
      if (error.message === 'Expense not found') {
        return apiResponse.notFound('Expense not found');
      }

      return apiResponse.internalError();
    }
  }

  async getExpensesByCategory(req: NextRequest, tenantId: string, categoryId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expenses = await expenseUseCases.getExpensesByCategory(categoryId, tenantId);

      return ExpenseResponseDTO.mapExpenseListResponse(expenses);
    } catch (error: any) {
      console.error('Get expenses by category error:', error);
      return apiResponse.internalError();
    }
  }

  async getExpensesByStaff(req: NextRequest, tenantId: string, staffId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expenses = await expenseUseCases.getExpensesByStaff(staffId, tenantId);

      return ExpenseResponseDTO.mapExpenseListResponse(expenses);
    } catch (error: any) {
      console.error('Get expenses by staff error:', error);
      return apiResponse.internalError();
    }
  }

  async getExpensesByDateRange(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: DateRangeRequest = await dateRangeSchema.validate(body);

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expenses = await expenseUseCases.getExpensesByDateRange(
        tenantId, 
        validatedData.start_date, 
        validatedData.end_date
      );

      return ExpenseResponseDTO.mapExpenseListResponse(expenses);
    } catch (error: any) {
      console.error('Get expenses by date range error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('Start date cannot be after end date')) {
        return apiResponse.validationError([{ field: 'date_range', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async getTotalExpensesByCategory(req: NextRequest, tenantId: string, categoryId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const total = await expenseUseCases.getTotalExpensesByCategory(tenantId, categoryId);

      return ExpenseResponseDTO.mapTotalAmountResponse(total, categoryId);
    } catch (error: any) {
      console.error('Get total expenses by category error:', error);
      return apiResponse.internalError();
    }
  }

  async markExpenseAsPaid(req: NextRequest, tenantId: string, expenseId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: MarkPaidRequest = await markPaidSchema.validate(body);

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expense = await expenseUseCases.markExpenseAsPaid(expenseId, tenantId, validatedData.paid_at);

      return ExpenseResponseDTO.mapMarkPaidResponse(expense);
    } catch (error: any) {
      console.error('Mark expense as paid error:', error);
      
      if (error.message === 'Expense not found') {
        return apiResponse.notFound('Expense not found');
      }

      if (error.message === 'Expense is already marked as paid') {
        return apiResponse.validationError([{ field: 'expense', message: error.message }]);
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async markExpenseAsUnpaid(req: NextRequest, tenantId: string, expenseId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const expenseUseCases = ExpenseServiceContainer.getExpenseUseCases();
      const expense = await expenseUseCases.markExpenseAsUnpaid(expenseId, tenantId);

      return ExpenseResponseDTO.mapMarkUnpaidResponse(expense);
    } catch (error: any) {
      console.error('Mark expense as unpaid error:', error);
      
      if (error.message === 'Expense not found') {
        return apiResponse.notFound('Expense not found');
      }

      if (error.message === 'Expense is already unpaid') {
        return apiResponse.validationError([{ field: 'expense', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }
}