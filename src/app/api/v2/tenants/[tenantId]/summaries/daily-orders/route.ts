import { NextRequest } from 'next/server';
import { SummaryController } from '@/presentation/controllers/SummaryController';

const getSummaryController = () => SummaryController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  const summaryController = getSummaryController();
  return await summaryController.getDailyOrders(req, tenantId);
}
