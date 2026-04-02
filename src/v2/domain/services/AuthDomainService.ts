import { User } from '../entities/User';
import { Tenant } from '../entities/Tenant';
import { AuthSession } from '../entities/AuthSession';
import { GoogleUser } from '../entities/GoogleUser';
import { PasswordService } from '../repositories/AuthRepository';

export class AuthDomainService {
  constructor(private passwordService: PasswordService) {}

  static validateUserCredentials(user: User): void {
    if (!user.isValidEmail()) {
      throw new Error('Invalid email format');
    }
    
    if (!user.hasValidPassword()) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  static validateTenantData(tenant: Tenant): void {
    if (!tenant.isValidName()) {
      throw new Error('Tenant name is required');
    }
    
    if (!tenant.isValidEmail()) {
      throw new Error('Invalid tenant email format');
    }

    if (!tenant.canBeActivated()) {
      throw new Error('Tenant cannot be activated with current data');
    }
  }

  static validateAuthSession(session: AuthSession): void {
    if (!session.isValid()) {
      throw new Error('Invalid or expired authentication session');
    }
  }

  static validateTenantAccess(session: AuthSession, tenantId: string): void {
    if (!session.belongsToTenant(tenantId)) {
      throw new Error('Unauthorized: Tenant ID mismatch');
    }
  }

  static validateRoleAccess(session: AuthSession, requiredRoles: string[]): void {
    if (!session.hasRole(requiredRoles)) {
      throw new Error('Forbidden: Insufficient role permission');
    }
  }

  async validatePasswordStrength(password: string): Promise<void> {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Add more validation rules as needed
    if (!/[a-zA-Z]/.test(password)) {
      throw new Error('Password must contain at least one letter');
    }
  }

  async hashUserPassword(password: string): Promise<string> {
    await this.validatePasswordStrength(password);
    return await this.passwordService.hashPassword(password);
  }

  async verifyUserPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await this.passwordService.comparePassword(password, hashedPassword);
  }

  static validateGoogleUser(googleUser: GoogleUser): void {
    if (!googleUser.isValidGoogleUser()) {
      throw new Error('Invalid Google user data');
    }

    if (!googleUser.hasValidEmail()) {
      throw new Error('Invalid email from Google');
    }

    if (!googleUser.isEmailVerified()) {
      throw new Error('Google email is not verified');
    }

    if (!googleUser.canCreateAccount()) {
      throw new Error('Google user cannot create account with current data');
    }
  }

  static validateGoogleUserForLogin(googleUser: GoogleUser): void {
    if (!googleUser.isValidGoogleUser()) {
      throw new Error('Invalid Google authentication');
    }

    if (!googleUser.hasValidEmail()) {
      throw new Error('Invalid email from Google');
    }
  }
}