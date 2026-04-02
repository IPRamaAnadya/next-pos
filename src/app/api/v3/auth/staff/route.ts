import { NextRequest } from 'next/server';
import { authService } from '@/v3/modules/auth/auth.service';
import { handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, storeCode } = body;

    if (!username || !password || !storeCode) {
      return apiResponse.validationError([
        ...(!username ? [{ field: 'username', message: 'Username is required' }] : []),
        ...(!password ? [{ field: 'password', message: 'Password is required' }] : []),
        ...(!storeCode ? [{ field: 'storeCode', message: 'Store code is required' }] : []),
      ]);
    }

    const result = await authService.staffLogin({ username, password, storeCode });
    return apiResponse.success({ data: result, message: 'Login successful' });
  } catch (error) {
    return handleAuthError(error);
  }
}
