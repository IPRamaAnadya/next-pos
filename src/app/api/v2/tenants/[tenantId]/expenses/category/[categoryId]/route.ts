import { NextRequest } from 'next/server';
import { ExpenseController } from '@/presentation/controllers/ExpenseController';

// Use singleton to prevent memory leaks
const getExpenseController = () => ExpenseController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; categoryId: string } }
) {
  const { tenantId, categoryId } = await params;
  const expenseController = getExpenseController();
  return await expenseController.getExpensesByCategory(req, tenantId, categoryId);
}