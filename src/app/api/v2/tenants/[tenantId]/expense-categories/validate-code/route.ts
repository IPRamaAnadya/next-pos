import { NextRequest } from 'next/server';
import { ExpenseCategoryController } from '@/presentation/controllers/ExpenseCategoryController';

// Use singleton to prevent memory leaks
const getExpenseCategoryController = () => ExpenseCategoryController.getInstance();

export async function POST(req: NextRequest) {
  const expenseCategoryController = getExpenseCategoryController();
  return await expenseCategoryController.validateCode(req);
}