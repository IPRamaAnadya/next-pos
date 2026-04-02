import { NextRequest } from 'next/server';
import { authService } from '@/v3/modules/auth/auth.service';
import { handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    const validationErrors: { field: string; message: string }[] = [];
    if (!email) validationErrors.push({ field: 'email', message: 'Email is required' });
    if (!otp) validationErrors.push({ field: 'otp', message: 'OTP is required' });
    if (!newPassword) validationErrors.push({ field: 'newPassword', message: 'New password is required' });
    if (newPassword && newPassword.length < 6) validationErrors.push({ field: 'newPassword', message: 'Password must be at least 6 characters' });

    if (validationErrors.length > 0) {
      return apiResponse.validationError(validationErrors);
    }

    await authService.resetPassword({ email, otp, newPassword });
    return apiResponse.success({ message: 'Password reset successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
