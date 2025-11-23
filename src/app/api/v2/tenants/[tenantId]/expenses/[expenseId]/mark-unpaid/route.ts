import { NextRequest } from 'next/server';
import { ExpenseController } from '../../../../../../../../presentation/controllers/ExpenseController';

// Use singleton to prevent memory leaks
const getExpenseController = () => ExpenseController.getInstance();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tenantId: string; expenseId: string } }
) {
  const { tenantId, expenseId } = await params;
  const expenseController = getExpenseController();
  return await expenseController.markExpenseAsUnpaid(req, tenantId, expenseId);
}