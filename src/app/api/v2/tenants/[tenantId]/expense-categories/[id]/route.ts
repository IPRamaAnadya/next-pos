import { NextRequest } from 'next/server';
import { ExpenseCategoryController } from '../../../../../../../presentation/controllers/ExpenseCategoryController';

// Use singleton to prevent memory leaks
const getExpenseCategoryController = () => ExpenseCategoryController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const expenseCategoryController = getExpenseCategoryController();
  return await expenseCategoryController.getById(req, id);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const expenseCategoryController = getExpenseCategoryController();
  return await expenseCategoryController.update(req, id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const expenseCategoryController = getExpenseCategoryController();
  return await expenseCategoryController.delete(req, id);
}