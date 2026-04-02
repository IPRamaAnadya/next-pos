import { NextRequest } from 'next/server';
import { expenseService } from '@/v3/modules/expense/expense.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ expenseId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { expenseId } = await params;
    const data = await expenseService.getExpense(expenseId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { expenseId } = await params;
    const body = await request.json();
    const {
      expenseCategoryId, staffId, description, amount,
      paymentType, isShow, paidAt, attachmentUrl, payrollDetailId,
    } = body;

    const data = await expenseService.updateExpense(expenseId, payload.tenantId, {
      expenseCategoryId,
      staffId,
      description,
      amount: amount !== undefined ? Number(amount) : undefined,
      paymentType,
      isShow,
      paidAt: paidAt !== undefined ? (paidAt ? new Date(paidAt) : null) : undefined,
      attachmentUrl,
      payrollDetailId,
    });
    return apiResponse.success({ data, message: 'Expense updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    if (payload.type !== 'owner') return apiResponse.forbidden('Only owners can delete expenses');

    const { expenseId } = await params;
    await expenseService.deleteExpense(expenseId, payload.tenantId);
    return apiResponse.success({ message: 'Expense deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
