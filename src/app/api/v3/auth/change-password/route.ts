import { NextRequest } from 'next/server';
import { authService } from '@/v3/modules/auth/auth.service';
import { verifyAuth, handleAuthError } from '@/v3/lib/auth-guard';
import { apiResponse } from '@/v3/lib/response';

export async function PUT(request: NextRequest) {
  try {
    const payload = verifyAuth(request);

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    const validationErrors: { field: string; message: string }[] = [];
    if (!currentPassword) validationErrors.push({ field: 'currentPassword', message: 'Current password is required' });
    if (!newPassword) validationErrors.push({ field: 'newPassword', message: 'New password is required' });
    if (newPassword && newPassword.length < 6) validationErrors.push({ field: 'newPassword', message: 'New password must be at least 6 characters' });

    if (validationErrors.length > 0) {
      return apiResponse.validationError(validationErrors);
    }

    if (payload.type === 'staff') {
      return apiResponse.forbidden('Staff password changes must be done by the store owner');
    }

    await authService.changeOwnerPassword(payload.userId, { currentPassword, newPassword });
    return apiResponse.success({ message: 'Password changed successfully' });
  } catch (error) {
    return handleAuthError(error);
  }
}
