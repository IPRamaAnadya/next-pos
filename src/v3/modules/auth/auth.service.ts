import { generateToken, verifyToken } from '@/v3/lib/jwt';
import { hashPassword, comparePassword } from '@/v3/lib/bcrypt';
import { redis } from '@/v3/lib/redis';
import { sendPasswordResetEmail } from '@/v3/lib/resend';
import { TenantEntity } from './auth.entity';
import { authRepository } from './auth.repository';
import type {
  LoginInput,
  StaffLoginInput,
  RegisterInput,
  ResetPasswordInput,
  ChangePasswordInput,
  AuthResult,
  UserProfile,
  StaffProfile,
  OwnerTokenPayload,
  StaffTokenPayload,
} from './auth.type';

const RESET_OTP_TTL = 15 * 60; // 15 minutes in seconds
const RESET_OTP_KEY = (email: string) => `PASSWORD_RESET:${email}`;

class AuthService {
  // ─────────────────────────────────────────────
  //  Login flows
  // ─────────────────────────────────────────────

  /** Owner logs in to the dashboard app */
  async login(input: LoginInput): Promise<AuthResult> {
    const found = await authRepository.findUserByEmail(input.email);
    if (!found) throw new Error('Invalid email or password');

    const { user, tenants } = found;

    if (!user.canLogin()) throw new Error('This account uses social login. Please sign in with Google.');

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');

    const tenant = tenants[0];
    if (!tenant) throw new Error('No store associated with this account');

    const payload: OwnerTokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      type: 'owner',
    };

    const token = generateToken(payload);

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      tenantId: tenant.id,
      tenantName: tenant.name,
      storeCode: tenant.storeCode,
      role: user.role,
      type: 'owner',
    };

    return { token, user: profile };
  }

  /** Staff employee logs into the cashier using their staff credentials */
  async staffLogin(input: StaffLoginInput): Promise<AuthResult> {
    const staff = await authRepository.findStaffByStoreCode(input.username, input.storeCode);
    if (!staff) throw new Error('Invalid username, password, or store code');

    const isMatch = await comparePassword(input.password, staff.password);
    if (!isMatch) throw new Error('Invalid username, password, or store code');

    const tenant = await authRepository.findTenantByCode(input.storeCode);
    if (!tenant) throw new Error('Store not found');

    const payload: StaffTokenPayload = {
      staffId: staff.id,
      tenantId: tenant.id,
      role: staff.role,
      isOwner: staff.isOwner,
      type: 'staff',
    };

    const token = generateToken(payload);

    const profile: StaffProfile = {
      id: staff.id,
      username: staff.username,
      tenantId: tenant.id,
      tenantName: staff.tenantName,
      storeCode: tenant.storeCode,
      role: staff.role,
      isOwner: staff.isOwner,
      type: 'staff',
    };

    return { token, user: profile };
  }

  // ─────────────────────────────────────────────
  //  Register
  // ─────────────────────────────────────────────

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) throw new Error('An account with this email already exists');

    // Resolve storeCode — use supplied value or generate a unique one
    const storeCode = await this.resolveUniqueStoreCode(input.storeCode);

    const hashedPassword = await hashPassword(input.password);

    const { user, tenant } = await authRepository.createUserWithTenant({
      email: input.email,
      hashedPassword,
      displayName: undefined,
      tenantName: input.tenantName,
      tenantAddress: input.tenantAddress,
      tenantPhone: input.tenantPhone,
      storeCode,
    });

    const payload: OwnerTokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      type: 'owner',
    };

    const token = generateToken(payload);

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      tenantId: tenant.id,
      tenantName: tenant.name,
      storeCode: tenant.storeCode,
      role: user.role,
      type: 'owner',
    };

    return { token, user: profile };
  }

  // ─────────────────────────────────────────────
  //  Forgot / Reset password
  // ─────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    // Always respond successfully to prevent email enumeration
    const found = await authRepository.findUserByEmail(email);
    if (!found) return;

    const otp = this.generateOtp();
    await redis.set(RESET_OTP_KEY(email), otp, 'EX', RESET_OTP_TTL);
    await sendPasswordResetEmail(email, otp);
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const storedOtp = await redis.get(RESET_OTP_KEY(input.email));
    if (!storedOtp || storedOtp !== input.otp) {
      throw new Error('Invalid or expired OTP');
    }

    const found = await authRepository.findUserByEmail(input.email);
    if (!found) throw new Error('Account not found');

    const hashedPassword = await hashPassword(input.newPassword);
    await authRepository.updateUserPassword(found.user.id, hashedPassword);
    await redis.del(RESET_OTP_KEY(input.email));
  }

  // ─────────────────────────────────────────────
  //  Change password (authenticated)
  // ─────────────────────────────────────────────

  async changeOwnerPassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new Error('User not found');

    const isMatch = await comparePassword(input.currentPassword, user.password);
    if (!isMatch) throw new Error('Current password is incorrect');

    const hashedPassword = await hashPassword(input.newPassword);
    await authRepository.updateUserPassword(userId, hashedPassword);
  }

  // ─────────────────────────────────────────────
  //  Get profile (me)
  // ─────────────────────────────────────────────

  async getOwnerProfile(userId: string, tenantId: string): Promise<UserProfile> {
    const prisma = (await import('@/v3/lib/prisma')).default;

    const [user, tenantRow] = await Promise.all([
      authRepository.findUserById(userId),
      prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    if (!user) throw new Error('User not found');
    if (!tenantRow) throw new Error('Store not found');

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      tenantId: tenantRow.id,
      tenantName: tenantRow.name,
      storeCode: tenantRow.storeCode,
      role: user.role,
      type: 'owner',
    };
  }

  async getStaffProfile(staffId: string, tenantId: string): Promise<StaffProfile> {
    const prisma = (await import('@/v3/lib/prisma')).default;

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new Error('Staff not found');

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Store not found');

    return {
      id: staff.id,
      username: staff.username,
      tenantId: tenant.id,
      tenantName: tenant.name,
      storeCode: tenant.storeCode,
      role: staff.role,
      isOwner: staff.isOwner,
      type: 'staff',
    };
  }

  /** Validate a raw token string and return the decoded payload */
  validateToken(token: string): OwnerTokenPayload | StaffTokenPayload {
    const payload = verifyToken(token);
    if (!payload) throw new Error('Invalid or expired token');
    return payload;
  }

  // ─────────────────────────────────────────────
  //  Private helpers
  // ─────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async resolveUniqueStoreCode(preferred?: string): Promise<string> {
    if (preferred) {
      const existing = await authRepository.findTenantByCode(preferred);
      if (existing) throw new Error('Store code already taken. Please choose another.');
      return preferred.toUpperCase();
    }

    // Auto-generate until unique
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = TenantEntity.generateCode();
      const existing = await authRepository.findTenantByCode(code);
      if (!existing) return code;
    }

    throw new Error('Failed to generate a unique store code. Please try again.');
  }
}

export const authService = new AuthService();
