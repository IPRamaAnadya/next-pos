import { NextRequest } from 'next/server';
import { AuthServiceContainer } from '../application/services/AuthServiceContainer';
import { AuthResponseDTO } from '../presentation/dto/AuthResponseDTO';
import { AuthSession } from '../domain/entities/AuthSession';

export interface AuthValidationResult {
  success: boolean;
  session?: AuthSession;
  response?: any;
}

export class AuthV2Utils {
  /**  
   * Validate authentication token from request header
   */
  static async validateAuth(request: NextRequest): Promise<AuthValidationResult> {
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return {
          success: false,
          response: AuthResponseDTO.mapUnauthorizedResponse(),
        };
      }

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateToken(token);

      return {
        success: true,
        session,
      };
    } catch (error: any) {
      console.error('Auth validation error:', error);
      return {
        success: false,
        response: AuthResponseDTO.mapInvalidTokenResponse(),
      };
    }
  }

  /**
   * Validate tenant access (token must belong to the specified tenant)
   */
  static async validateTenantAuth(
    request: NextRequest,
    tenantId: string
  ): Promise<AuthValidationResult> {
    try {
      const authResult = await this.validateAuth(request);
      if (!authResult.success || !authResult.session) {
        return authResult;
      }

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateTenantAccess(
        authResult.session.token,
        tenantId
      );

      return {
        success: true,
        session,
      };
    } catch (error: any) {
      console.error('Tenant auth validation error:', error);
      
      if (error.message.includes('Unauthorized: Tenant ID mismatch')) {
        return {
          success: false,
          response: AuthResponseDTO.mapForbiddenResponse(),
        };
      }

      return {
        success: false,
        response: AuthResponseDTO.mapInvalidTokenResponse(),
      };
    }
  }

  /**
   * Validate role access (token must have one of the required roles)
   */
  static async validateRoleAuth(
    request: NextRequest,
    requiredRoles: string[]
  ): Promise<AuthValidationResult> {
    try {
      const authResult = await this.validateAuth(request);
      if (!authResult.success || !authResult.session) {
        return authResult;
      }

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateRoleAccess(
        authResult.session.token,
        requiredRoles
      );

      return {
        success: true,
        session,
      };
    } catch (error: any) {
      console.error('Role auth validation error:', error);
      
      if (error.message.includes('Forbidden: Insufficient role permission')) {
        return {
          success: false,
          response: AuthResponseDTO.mapForbiddenResponse(),
        };
      }

      return {
        success: false,
        response: AuthResponseDTO.mapInvalidTokenResponse(),
      };
    }
  }

  /**
   * Validate both tenant and role access
   */
  static async validateTenantAndRoleAuth(
    request: NextRequest,
    tenantId: string,
    requiredRoles: string[]
  ): Promise<AuthValidationResult> {
    try {
      // First validate tenant access
      const tenantResult = await this.validateTenantAuth(request, tenantId);
      if (!tenantResult.success || !tenantResult.session) {
        return tenantResult;
      }

      // Then validate role access
      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateRoleAccess(
        tenantResult.session.token,
        requiredRoles
      );

      return {
        success: true,
        session,
      };
    } catch (error: any) {
      console.error('Tenant and role auth validation error:', error);
      
      if (error.message.includes('Forbidden: Insufficient role permission')) {
        return {
          success: false,
          response: AuthResponseDTO.mapForbiddenResponse(),
        };
      }

      return {
        success: false,
        response: AuthResponseDTO.mapInvalidTokenResponse(),
      };
    }
  }

  /**
   * Extract user ID from authenticated request
   */
  static async getUserId(request: NextRequest): Promise<string | null> {
    const authResult = await this.validateAuth(request);
    return authResult.success && authResult.session ? authResult.session.userId : null;
  }

  /**
   * Extract tenant ID from authenticated request
   */
  static async getTenantId(request: NextRequest): Promise<string | null> {
    const authResult = await this.validateAuth(request);
    return authResult.success && authResult.session ? authResult.session.tenantId : null;
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(request: NextRequest, role: string): Promise<boolean> {
    const authResult = await this.validateAuth(request);
    return authResult.success && authResult.session ? authResult.session.role === role : false;
  }

  /**
   * Check if user is owner
   */
  static async isOwner(request: NextRequest): Promise<boolean> {
    const authResult = await this.validateAuth(request);
    return authResult.success && authResult.session ? authResult.session.isOwner() : false;
  }

  /**
   * Check if user is staff
   */
  static async isStaff(request: NextRequest): Promise<boolean> {
    const authResult = await this.validateAuth(request);
    return authResult.success && authResult.session ? authResult.session.isStaff() : false;
  }
}