import { NextRequest } from 'next/server';
import { customerService } from '@/v3/modules/customer/customer.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const { searchParams } = request.nextUrl;
    const hasActiveMembershipParam = searchParams.get('hasActiveMembership');

    const query = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      email: searchParams.get('email') ?? undefined,
      phone: searchParams.get('phone') ?? undefined,
      membershipCode: searchParams.get('membershipCode') ?? undefined,
      hasActiveMembership:
        hasActiveMembershipParam !== null ? hasActiveMembershipParam === 'true' : undefined,
    };

    const { items, pagination } = await customerService.listCustomers(payload.tenantId, query);
    return apiResponse.success({ data: items, pagination });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const body = await request.json();
    const { name, membershipCode, email, phone, address, birthday, membershipExpiredAt, points } = body;

    if (!name) return apiResponse.validationError([{ field: 'name', message: 'Customer name is required' }]);

    const data = await customerService.createCustomer(payload.tenantId, {
      name,
      membershipCode,
      email,
      phone,
      address,
      birthday: birthday ? new Date(birthday) : null,
      membershipExpiredAt: membershipExpiredAt ? new Date(membershipExpiredAt) : null,
      points: points !== undefined ? Number(points) : undefined,
    });

    return apiResponse.success({ data, message: 'Customer created successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
