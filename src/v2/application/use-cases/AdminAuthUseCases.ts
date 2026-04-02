import { PrismaClient, AdminRole } from "@/app/generated/prisma";
import { AdminLoginRequest, AdminRegistrationRequest } from "@/presentation/dto/AdminAuthRequestDTO";
import { BcryptPasswordService } from "@/infrastructure/services/BcryptPasswordService";
import { generateToken } from "@/app/api/utils/jwt";

const prisma = new PrismaClient();

/**
 * Admin Authentication Use Cases
 * Handles admin login and first-time admin creation
 */
export class AdminAuthUseCases {
  private static instance: AdminAuthUseCases;
  private passwordService: BcryptPasswordService;

  private constructor() {
    this.passwordService = BcryptPasswordService.getInstance();
  }

  public static getInstance(): AdminAuthUseCases {
    if (!AdminAuthUseCases.instance) {
      AdminAuthUseCases.instance = new AdminAuthUseCases();
    }
    return AdminAuthUseCases.instance;
  }

  /**
   * Check if any admin exists in the database
   */
  async checkAdminExists(): Promise<{ exists: boolean; count: number }> {
    const count = await prisma.admin.count();
    return {
      exists: count > 0,
      count,
    };
  }

  /**
   * Admin Login
   * Validates credentials and returns token
   * @param request - Login credentials
   */
  async login(request: AdminLoginRequest): Promise<{ token: string; admin: any }> {
    const { identifier, password } = request;

    // Find admin by username or email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        password: true,
        isActive: true,
      },
    });

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login timestamp
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const payload = {
      adminId: admin.id,
      role: admin.role,
      username: admin.username,
      email: admin.email,
    };

    const token = generateToken(payload);

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  /**
   * Register First Admin
   * Creates the first SUPERADMIN account if no admins exist
   * @param request - Registration data
   */
  async registerFirstAdmin(request: AdminRegistrationRequest): Promise<{ token: string; admin: any }> {
    // Verify that no admins exist
    const existingCount = await prisma.admin.count();
    if (existingCount > 0) {
      throw new Error('Admin account already exists. Please login instead.');
    }

    // Check if username already taken (should not happen if count is 0, but for safety)
    const existingUsername = await prisma.admin.findUnique({
      where: { username: request.username },
    });

    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already taken
    const existingEmail = await prisma.admin.findUnique({
      where: { email: request.email },
    });

    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(request.password);

    // Create SUPERADMIN account
    const admin = await prisma.admin.create({
      data: {
        username: request.username,
        email: request.email,
        password: hashedPassword,
        fullName: request.fullName,
        role: AdminRole.SUPERADMIN,
        isActive: true,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    // Generate JWT token
    const payload = {
      adminId: admin.id,
      role: admin.role,
      username: admin.username,
      email: admin.email,
    };

    const token = generateToken(payload);

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  /**
   * Attempt Login or Auto-Create First Admin
   * This is a convenience method that tries to login,
   * and if no admin exists, creates one automatically
   * @param loginRequest - Login credentials
   * @param registrationRequest - Optional registration data for auto-creation
   */
  async loginOrCreateFirstAdmin(
    loginRequest: AdminLoginRequest,
    registrationRequest?: AdminRegistrationRequest
  ): Promise<{ token: string; admin: any; wasCreated: boolean }> {
    try {
      // Try normal login first
      const result = await this.login(loginRequest);
      return {
        ...result,
        wasCreated: false,
      };
    } catch (error: any) {
      // If login failed, check if it's because no admins exist
      if (error.message === 'Invalid credentials') {
        const { exists } = await this.checkAdminExists();
        
        if (!exists && registrationRequest) {
          // No admins exist and we have registration data - create first admin
          const result = await this.registerFirstAdmin(registrationRequest);
          return {
            ...result,
            wasCreated: true,
          };
        }
      }
      
      // Re-throw the error if we can't handle it
      throw error;
    }
  }
}
