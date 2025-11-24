import { NextRequest } from 'next/server';
import { ExpenseController } from '@/presentation/controllers/ExpenseController';

// Use singleton to prevent memory leaks
const getExpenseController = () => ExpenseController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; staffId: string } }
) {
  const { tenantId, staffId } = await params;
  const expenseController = getExpenseController();
  return await expenseController.getExpensesByStaff(req, tenantId, staffId);
}