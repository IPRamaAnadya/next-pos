import { NextRequest } from 'next/server';
import { ExpenseController } from '../../../../../../presentation/controllers/ExpenseController';

// Use singleton to prevent memory leaks
const getExpenseController = () => ExpenseController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const expenseController = getExpenseController();
  return await expenseController.getExpenses(req, tenantId);
}

export async function POST(
  req: NextRequest,
  paramsPromise: Promise<{ params: { tenantId: string } }>
) {
  const { params } = await paramsPromise;
  const { tenantId } = params;
  const expenseController = getExpenseController();
  return await expenseController.createExpense(req, tenantId);
}