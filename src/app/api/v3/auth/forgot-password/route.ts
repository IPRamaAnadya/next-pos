import { NextRequest } from 'next/server';
import { authService } from '@/v3/modules/auth/auth.service';
import { handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return apiResponse.validationError([{ field: 'email', message: 'Email is required' }]);
    }

    await authService.forgotPassword(email);

    // Always return success to prevent email enumeration
    return apiResponse.success({ message: 'If this email is registered, you will receive an OTP.' });
  } catch (error) {
    return handleAuthError(error);
  }
}
