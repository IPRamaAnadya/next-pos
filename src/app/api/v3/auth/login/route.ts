import { NextRequest } from 'next/server';
import { authService } from '@/v3/modules/auth/auth.service';
import { handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiResponse.validationError([
        ...(!email ? [{ field: 'email', message: 'Email is required' }] : []),
        ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
      ]);
    }

    const result = await authService.login({ email, password });
    return apiResponse.success({ data: result, message: 'Login successful' });
  } catch (error) {
    return handleAuthError(error);
  }
}
