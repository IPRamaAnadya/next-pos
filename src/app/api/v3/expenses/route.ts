import { NextRequest } from 'next/server';
import { expenseService } from '@/v3/modules/expense/expense.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const { searchParams } = request.nextUrl;
    const isShowParam = searchParams.get('isShow');
    const isPaidParam = searchParams.get('isPaid');
    const minAmountParam = searchParams.get('minAmount');
    const maxAmountParam = searchParams.get('maxAmount');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      expenseCategoryId: searchParams.get('expenseCategoryId') ?? undefined,
      staffId: searchParams.get('staffId') ?? undefined,
      paymentType: searchParams.get('paymentType') ?? undefined,
      isShow: isShowParam !== null ? isShowParam === 'true' : undefined,
      isPaid: isPaidParam !== null ? isPaidParam === 'true' : undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      minAmount: minAmountParam ? Number(minAmountParam) : undefined,
      maxAmount: maxAmountParam ? Number(maxAmountParam) : undefined,
    };

    const { items, pagination } = await expenseService.listExpenses(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);
    const body = await request.json();
    const {
      expenseCategoryId, staffId, description, amount,
      paymentType, isShow, paidAt, attachmentUrl, payrollDetailId,
    } = body;

    if (!expenseCategoryId) {
      return apiResponse.validationError([{ field: 'expenseCategoryId', message: 'expenseCategoryId is required' }]);
    }
    if (!staffId) {
      return apiResponse.validationError([{ field: 'staffId', message: 'staffId is required' }]);
    }
    if (!description) {
      return apiResponse.validationError([{ field: 'description', message: 'Description is required' }]);
    }
    if (amount == null) {
      return apiResponse.validationError([{ field: 'amount', message: 'Amount is required' }]);
    }

    const data = await expenseService.createExpense(payload.tenantId, {
      expenseCategoryId,
      staffId,
      description,
      amount: Number(amount),
      paymentType,
      isShow,
      paidAt: paidAt ? new Date(paidAt) : null,
      attachmentUrl,
      payrollDetailId,
    });
    return apiResponse.success({ data, message: 'Expense created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
