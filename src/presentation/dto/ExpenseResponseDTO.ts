import { Expense } from '../../domain/entities/Expense';
import { PaginatedExpenses } from '../../domain/repositories/ExpenseRepository';
import { apiResponse } from '@/app/api/utils/response';

export class ExpenseResponseDTO {
  static mapToResponse(expense: Expense) {
    return {
      id: expense.id,
      tenant_id: expense.tenantId,
      expense_category_id: expense.expenseCategoryId,
      staff_id: expense.staffId,
      description: expense.description,
      amount: expense.getAmountAsNumber(),
      payment_type: expense.paymentType,
      is_show: expense.isShow,
      paid_at: expense.paidAt?.toISOString() || null,
      attachment_url: expense.attachmentUrl,
      payroll_detail_id: expense.payrollDetailId,
      created_at: expense.createdAt.toISOString(),
      is_paid: expense.isPaid(),
      expense_category: expense.expenseCategory ? {
        id: expense.expenseCategory.id,
        name: expense.expenseCategory.name,
        code: expense.expenseCategory.code,
        is_private: expense.expenseCategory.isPrivate,
      } : null,
      staff: expense.staff ? {
        id: expense.staff.id,
        username: expense.staff.username,
        role: expense.staff.role,
      } : null,
    };
  }

  static mapPaginatedResponse(paginatedExpenses: PaginatedExpenses) {
    return apiResponse.success({
      data: paginatedExpenses.data.map(this.mapToResponse),
      pagination: {
        page: paginatedExpenses.pagination.page,
        pageSize: paginatedExpenses.pagination.limit,
        total: paginatedExpenses.pagination.total,
      },
    });
  }

  static mapSingleResponse(expense: Expense) {
    return apiResponse.success({
      data: this.mapToResponse(expense),
      message: 'Expense retrieved successfully',
    });
  }

  static mapCreatedResponse(expense: Expense) {
    return apiResponse.success({
      data: this.mapToResponse(expense),
      message: 'Expense created successfully',
    });
  }

  static mapUpdatedResponse(expense: Expense) {
    return apiResponse.success({
      data: this.mapToResponse(expense),
      message: 'Expense updated successfully',
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      data: {},
      message: 'Expense deleted successfully',
    });
  }

  static mapExpenseListResponse(expenses: Expense[]) {
    return apiResponse.success({
      data: expenses.map(this.mapToResponse),
      message: 'Expenses retrieved successfully',
    });
  }

  static mapTotalAmountResponse(total: number, categoryId?: string) {
    return apiResponse.success({
      data: {
        total_amount: total,
        expense_category_id: categoryId || null,
      },
      message: 'Total expense amount calculated successfully',
    });
  }

  static mapMarkPaidResponse(expense: Expense) {
    return apiResponse.success({
      data: this.mapToResponse(expense),
      message: 'Expense marked as paid successfully',
    });
  }

  static mapMarkUnpaidResponse(expense: Expense) {
    return apiResponse.success({
      data: this.mapToResponse(expense),
      message: 'Expense marked as unpaid successfully',
    });
  }
}