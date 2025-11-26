import { User } from '../../domain/entities/User';
import { AuthSession } from '../../domain/entities/AuthSession';
import { apiResponse } from '@/app/api/utils/response';

export class AuthResponseDTO {
  static mapLoginResponse(result: { token: string; user: any }) {
    return apiResponse.success({
      data: {
        token: result.token,
        user: {
          id: result.user.userId,
          email: result.user.email,
          tenant_id: result.user.tenantId,
          tenant_name: result.user.tenantName,
          tenant_address: result.user.tenantAddress,
          tenant_phone: result.user.tenantPhone,
          role: result.user.role,
          staff_id: result.user.staffId,
          limits: result.user.limits,
          subscription_end_date: result.user.subscriptionEndDate,
        },
      },
      message: 'Login successful',
    });
  }

  static mapSignupResponse(result: { token: string; user: any }) {
    return apiResponse.success({
      data: {
        token: result.token,
        user: {
          id: result.user.userId,
          email: result.user.email,
          tenant_id: result.user.tenantId,
          tenant_name: result.user.tenantName,
          role: result.user.role,
          staff_id: result.user.staffId,
          limits: result.user.limits,
          subscription_end_date: result.user.subscriptionEndDate,
        },
      },
      message: 'Account created successfully',
    });
  }

  static mapCashierLoginResponse(result: { token: string; user: any }) {
    return apiResponse.success({
      data: {
        token: result.token,
        user: {
          id: result.user.userId,
          email: result.user.email,
          tenant_id: result.user.tenantId,
          tenant_name: result.user.tenantName,
          role: result.user.role,
          staff_id: result.user.staffId,
          limits: result.user.limits,
          subscription_end_date: result.user.subscriptionEndDate,
        },
      },
      message: 'Cashier login successful',
    });
  }

  static mapTenantLoginResponse(result: { token: string; user: any }) {
    return apiResponse.success({
      data: {
        token: result.token,
        user: {
          id: result.user.userId,
          username: result.user.username,
          tenant_id: result.user.tenantId,
          tenant_name: result.user.tenantName,
          role: result.user.role,
          staff_id: result.user.staffId,
          is_owner: result.user.isOwner,
          limits: result.user.limits,
          subscription_end_date: result.user.subscriptionEndDate,
        },
      },
      message: 'Tenant login successful',
    });
  }

  static mapValidateTokenResponse(session: AuthSession) {
    return apiResponse.success({
      data: {
        valid: true,
        user: {
          id: session.userId,
          tenant_id: session.tenantId,
          role: session.role,
          staff_id: session.staffId,
          expires_at: session.expiresAt.toISOString(),
          subscription_end_date: session.subscriptionEndDate?.toISOString() || null,
        },
      },
      message: 'Token is valid',
    });
  }

  static mapUserResponse(user: User) {
    return apiResponse.success({
      data: {
        id: user.id,
        email: user.email,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      message: 'User retrieved successfully',
    });
  }

  static mapUnauthorizedResponse() {
    return apiResponse.unauthorized('Authentication required');
  }

  static mapForbiddenResponse() {
    return apiResponse.forbidden('Insufficient permissions');
  }

  static mapInvalidCredentialsResponse() {
    return apiResponse.unauthorized('Invalid email or password');
  }

  static mapUserExistsResponse() {
    return apiResponse.validationError([{ field: 'email', message: 'User already exists' }]);
  }

  static mapGoogleLoginResponse(result: { token: string; user: any; isNewUser: boolean }) {
    return apiResponse.success({
      data: {
        token: result.token,
        user: {
          id: result.user.userId,
          email: result.user.email,
          display_name: result.user.displayName,
          photo_url: result.user.photoURL,
          provider: result.user.provider,
          email_verified: result.user.emailVerified,
          tenant_id: result.user.tenantId,
          tenant_name: result.user.tenantName,
          role: result.user.role,
          staff_id: result.user.staffId,
          limits: result.user.limits,
          subscription_end_date: result.user.subscriptionEndDate,
        },
        is_new_user: result.isNewUser,
      },
      message: result.isNewUser ? 'Google account created successfully' : 'Google login successful',
    });
  }

  static mapInvalidTokenResponse() {
    return apiResponse.unauthorized('Invalid or expired token');
  }
}