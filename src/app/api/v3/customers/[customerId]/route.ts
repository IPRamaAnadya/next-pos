import { NextRequest } from 'next/server';
import { customerService } from '@/v3/modules/customer/customer.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

type Params = { params: Promise<{ customerId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { customerId } = await params;

    const data = await customerService.getCustomer(customerId, payload.tenantId);
    return apiResponse.success({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { customerId } = await params;

    const body = await request.json();
    const { name, membershipCode, email, phone, address, birthday, lastPurchaseAt, membershipExpiredAt, points } = body;

    const data = await customerService.updateCustomer(customerId, payload.tenantId, {
      name,
      membershipCode,
      email,
      phone,
      address,
      birthday: birthday !== undefined ? (birthday ? new Date(birthday) : null) : undefined,
      lastPurchaseAt: lastPurchaseAt !== undefined ? (lastPurchaseAt ? new Date(lastPurchaseAt) : null) : undefined,
      membershipExpiredAt:
        membershipExpiredAt !== undefined ? (membershipExpiredAt ? new Date(membershipExpiredAt) : null) : undefined,
      points: points !== undefined ? Number(points) : undefined,
    });

    return apiResponse.success({ data, message: 'Customer updated successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = verifyAuth(request);
    const { customerId } = await params;

    await customerService.deleteCustomer(customerId, payload.tenantId);
    return apiResponse.success({ message: 'Customer deleted successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
