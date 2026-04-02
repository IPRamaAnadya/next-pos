import { AuthSession } from '../entities/AuthSession';
import { GoogleUser } from '../entities/GoogleUser';

export interface AuthTokenService {
  generateToken(payload: any): Promise<string>;
  verifyToken(token: string): AuthSession | null;
  extractTokenFromHeader(authHeader: string | null): string | null;
}

export interface GoogleAuthService {
  verifyGoogleToken(idToken: string): Promise<GoogleUser>;
  signInWithGoogle(idToken: string): Promise<GoogleUser>;
}

export interface PasswordService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

export interface AuthorizationService {
  validateTenantAccess(session: AuthSession, tenantId: string): boolean;
  validateRoleAccess(session: AuthSession, requiredRoles: string[]): boolean;
}