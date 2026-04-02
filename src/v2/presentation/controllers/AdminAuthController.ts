import { NextRequest } from 'next/server';
import { AdminAuthUseCases } from '@/application/use-cases/AdminAuthUseCases';
import {
  adminLoginSchema,
  adminRegistrationSchema,
  AdminLoginRequest,
  AdminRegistrationRequest,
} from '@/presentation/dto/AdminAuthRequestDTO';
import { apiResponse } from '@/app/api/utils/response';

/**
 * Admin Authentication Controller
 * Handles admin login, registration, and admin existence checks
 */
export class AdminAuthController {
  private static instance: AdminAuthController;

  private constructor() {}

  public static getInstance(): AdminAuthController {
    if (!AdminAuthController.instance) {
      AdminAuthController.instance = new AdminAuthController();
    }
    return AdminAuthController.instance;
  }

  /**
   * Check if any admin exists in the database
   * GET /api/v2/admin/auth/check
   */
  async checkAdminExists(req: NextRequest) {
    try {
      const adminAuthUseCases = AdminAuthUseCases.getInstance();
      const result = await adminAuthUseCases.checkAdminExists();

      return apiResponse.success({
        data: result,
        message: result.exists ? 'Admin accounts exist' : 'No admin accounts found',
      });
    } catch (error: any) {
      console.error('Check admin exists error:', error);
      return apiResponse.internalError();
    }
  }

  /**
   * Admin Login
   * POST /api/v2/admin/auth/login
   */
  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData: AdminLoginRequest = await adminLoginSchema.validate(body);

      const adminAuthUseCases = AdminAuthUseCases.getInstance();
      const result = await adminAuthUseCases.login(validatedData);

      return apiResponse.success({
        data: result,
        message: 'Login successful',
      });
    } catch (error: any) {
      console.error('Admin login error:', error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: any) => ({
            field: err.path,
            message: err.message,
          }))
        );
      }

      if (error.message === 'Invalid credentials') {
        return apiResponse.unauthorized('Invalid username/email or password');
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Register First Admin
   * POST /api/v2/admin/auth/register
   * Only works if no admin accounts exist
   */
  async registerFirstAdmin(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData: AdminRegistrationRequest = await adminRegistrationSchema.validate(body);

      const adminAuthUseCases = AdminAuthUseCases.getInstance();
      const result = await adminAuthUseCases.registerFirstAdmin(validatedData);

      return apiResponse.success({
        data: result,
        message: 'Admin account created successfully',
      });
    } catch (error: any) {
      console.error('Admin registration error:', error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: any) => ({
            field: err.path,
            message: err.message,
          }))
        );
      }

      if (error.message === 'Admin account already exists. Please login instead.') {
        return apiResponse.forbidden('Admin account already exists. Please login instead.');
      }

      if (error.message === 'Username already exists') {
        return apiResponse.validationError([
          { field: 'username', message: 'Username is already taken' },
        ]);
      }

      if (error.message === 'Email already exists') {
        return apiResponse.validationError([
          { field: 'email', message: 'Email is already registered' },
        ]);
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Login or Auto-Create First Admin
   * POST /api/v2/admin/auth/login-or-create
   * Convenience endpoint that tries login first, creates if no admins exist
   */
  async loginOrCreateFirstAdmin(req: NextRequest) {
    try {
      const body = await req.json();
      
      // Validate as login request first
      const loginData: AdminLoginRequest = await adminLoginSchema.validate({
        identifier: body.identifier || body.username || body.email,
        password: body.password,
      });

      // If we have registration data, validate it too
      let registrationData: AdminRegistrationRequest | undefined;
      if (body.username && body.email && body.fullName) {
        registrationData = await adminRegistrationSchema.validate({
          username: body.username,
          email: body.email,
          password: body.password,
          fullName: body.fullName,
        });
      }

      const adminAuthUseCases = AdminAuthUseCases.getInstance();
      const result = await adminAuthUseCases.loginOrCreateFirstAdmin(
        loginData,
        registrationData
      );

      const message = result.wasCreated
        ? 'Admin account created and logged in successfully'
        : 'Login successful';

      return apiResponse.success({
        data: {
          token: result.token,
          admin: result.admin,
          wasCreated: result.wasCreated,
        },
        message,
      });
    } catch (error: any) {
      console.error('Admin login or create error:', error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: any) => ({
            field: err.path,
            message: err.message,
          }))
        );
      }

      if (error.message === 'Invalid credentials') {
        return apiResponse.unauthorized('Invalid username/email or password');
      }

      return apiResponse.internalError();
    }
  }
}
