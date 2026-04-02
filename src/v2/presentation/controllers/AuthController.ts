import { NextRequest } from 'next/server';
import { AuthServiceContainer } from '../../application/services/AuthServiceContainer';
import { AuthResponseDTO } from '../dto/AuthResponseDTO';
import { 
  loginSchema, 
  signupSchema, 
  cashierLoginSchema,
  tenantLoginSchema,
  googleLoginSchema,
  validateTokenSchema,
  LoginRequest,
  SignupRequest,
  CashierLoginRequest,
  TenantLoginRequest,
  GoogleLoginRequest
} from '../dto/AuthRequestDTO';
import { apiResponse } from '@/app/api/utils/response';

export class AuthController {
  private static instance: AuthController;

  private constructor() {}

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData: LoginRequest = await loginSchema.validate(body);

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const result = await authUseCases.login(validatedData);

      return AuthResponseDTO.mapLoginResponse(result);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message === 'Invalid email or password') {
        return AuthResponseDTO.mapInvalidCredentialsResponse();
      }

      if (error.message.includes('No tenant associated')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async signup(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData: SignupRequest = await signupSchema.validate(body);

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const result = await authUseCases.signup(validatedData);

      return AuthResponseDTO.mapSignupResponse(result);
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message === 'User already exists') {
        return AuthResponseDTO.mapUserExistsResponse();
      }

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async cashierLogin(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData: CashierLoginRequest = await cashierLoginSchema.validate(body);

      // If no tenantId provided, we'll extract it from other means or use a default approach
      const requestData = {
        ...validatedData,
        tenantId: validatedData.tenantId || '', // This would need proper tenant resolution
      };

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const result = await authUseCases.cashierLogin(requestData);

      return AuthResponseDTO.mapCashierLoginResponse(result);
    } catch (error: any) {
      console.error('Cashier login error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message === 'Invalid credentials') {
        return AuthResponseDTO.mapInvalidCredentialsResponse();
      }

      if (error.message.includes('No access to')) {
        return apiResponse.forbidden(error.message);
      }

      return apiResponse.internalError();
    }
  }

  async tenantLogin(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData: TenantLoginRequest = await tenantLoginSchema.validate(body);

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const result = await authUseCases.tenantLogin(validatedData);

      return AuthResponseDTO.mapTenantLoginResponse(result);
    } catch (error: any) {
      console.error('Tenant login error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message === 'Invalid credentials') {
        return AuthResponseDTO.mapInvalidCredentialsResponse();
      }

      if (error.message === 'Tenant not found') {
        return apiResponse.notFound('Tenant not found');
      }

      return apiResponse.internalError();
    }
  }

  async validateToken(req: NextRequest) {
    try {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return AuthResponseDTO.mapUnauthorizedResponse();
      }

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateToken(token);

      return AuthResponseDTO.mapValidateTokenResponse(session);
    } catch (error: any) {
      console.error('Token validation error:', error);
      
      if (error.message.includes('Invalid or expired')) {
        return AuthResponseDTO.mapInvalidTokenResponse();
      }

      return apiResponse.internalError();
    }
  }

  async validateTenantAccess(req: NextRequest, tenantId: string) {
    try {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return AuthResponseDTO.mapUnauthorizedResponse();
      }

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateTenantAccess(token, tenantId);

      return AuthResponseDTO.mapValidateTokenResponse(session);
    } catch (error: any) {
      console.error('Tenant access validation error:', error);
      
      if (error.message.includes('Invalid or expired')) {
        return AuthResponseDTO.mapInvalidTokenResponse();
      }

      if (error.message.includes('Unauthorized: Tenant ID mismatch')) {
        return AuthResponseDTO.mapForbiddenResponse();
      }

      return apiResponse.internalError();
    }
  }

  async validateRoleAccess(req: NextRequest, requiredRoles: string[]) {
    try {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return AuthResponseDTO.mapUnauthorizedResponse();
      }

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateRoleAccess(token, requiredRoles);

      return AuthResponseDTO.mapValidateTokenResponse(session);
    } catch (error: any) {
      console.error('Role access validation error:', error);
      
      if (error.message.includes('Invalid or expired')) {
        return AuthResponseDTO.mapInvalidTokenResponse();
      }

      if (error.message.includes('Forbidden: Insufficient role permission')) {
        return AuthResponseDTO.mapForbiddenResponse();
      }

      return apiResponse.internalError();
    }
  }

  async getUserProfile(req: NextRequest) {
    try {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return AuthResponseDTO.mapUnauthorizedResponse();
      }

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const session = await authUseCases.validateToken(token);
      const user = await authUseCases.getUserById(session.userId);

      return AuthResponseDTO.mapUserResponse(user);
    } catch (error: any) {
      console.error('Get user profile error:', error);
      
      if (error.message.includes('Invalid or expired')) {
        return AuthResponseDTO.mapInvalidTokenResponse();
      }

      if (error.message === 'User not found') {
        return apiResponse.notFound('User not found');
      }

      return apiResponse.internalError();
    }
  }

  async googleLogin(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData: GoogleLoginRequest = await googleLoginSchema.validate(body);

      const authUseCases = AuthServiceContainer.getAuthUseCases();
      const result = await authUseCases.googleLogin(validatedData);

      return AuthResponseDTO.mapGoogleLoginResponse(result);
    } catch (error: any) {
      console.error('Google login error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('Invalid Google')) {
        return apiResponse.unauthorized('Invalid Google authentication');
      }

      if (error.message.includes('Google email is not verified')) {
        return apiResponse.validationError([{ field: 'email', message: 'Google email is not verified' }]);
      }

      if (error.message.includes('Network error')) {
        return apiResponse.internalError();
      }

      if (error.message.includes('Too many requests')) {
        return apiResponse.validationError([{ field: 'general', message: 'Too many authentication requests. Please try again later' }]);
      }

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }
}