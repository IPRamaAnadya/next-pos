import { NextRequest } from 'next/server';
import { authService } from '@/v3/modules/auth/auth.service';
import { handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, tenantName, tenantAddress, tenantPhone, storeCode } = body;

    const validationErrors: { field: string; message: string }[] = [];
    if (!email) validationErrors.push({ field: 'email', message: 'Email is required' });
    if (!password) validationErrors.push({ field: 'password', message: 'Password is required' });
    if (!tenantName) validationErrors.push({ field: 'tenantName', message: 'Store name is required' });
    if (password && password.length < 6) validationErrors.push({ field: 'password', message: 'Password must be at least 6 characters' });

    if (validationErrors.length > 0) {
      return apiResponse.validationError(validationErrors);
    }

    const result = await authService.register({
      email,
      password,
      tenantName,
      tenantAddress,
      tenantPhone,
      storeCode,
    });

    return apiResponse.success({ data: result, message: 'Registration successful' });
  } catch (error) {
    return handleAuthError(error);
  }
}
