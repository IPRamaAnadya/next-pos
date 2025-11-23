import { NextRequest } from 'next/server';
import { ExpenseController } from '../../../../../../../presentation/controllers/ExpenseController';

// Use singleton to prevent memory leaks
const getExpenseController = () => ExpenseController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; expenseId: string } }
) {
  const { tenantId, expenseId } = await params;
  const expenseController = getExpenseController();
  return await expenseController.getExpenseById(req, tenantId, expenseId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; expenseId: string } }
) {
  const { tenantId, expenseId } = await params;
  const expenseController = getExpenseController();
  return await expenseController.updateExpense(req, tenantId, expenseId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; expenseId: string } }
) {
  const { tenantId, expenseId } = await params;
  const expenseController = getExpenseController();
  return await expenseController.deleteExpense(req, tenantId, expenseId);
}