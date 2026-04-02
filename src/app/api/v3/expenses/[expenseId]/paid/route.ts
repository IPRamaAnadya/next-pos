import { NextRequest } from 'next/server';
import { expenseService } from '@/v3/modules/expense/expense.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ expenseId: string }> };

/** PUT  → mark as paid */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { expenseId } = await params;
    const body = await request.json().catch(() => ({}));
    const paidAt = body.paidAt ? new Date(body.paidAt) : undefined;

    const data = await expenseService.markAsPaid(expenseId, payload.tenantId, { paidAt });
    return apiResponse.success({ data, message: 'Expense marked as paid' });
  } catch (error) {
    return handleAuthError(error);
  }
}

/** DELETE → mark as unpaid */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { expenseId } = await params;

    const data = await expenseService.markAsUnpaid(expenseId, payload.tenantId);
    return apiResponse.success({ data, message: 'Expense marked as unpaid' });
  } catch (error) {
    return handleAuthError(error);
  }
}
