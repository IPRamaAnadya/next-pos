import { AuthUseCases } from '../use-cases/AuthUseCases';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { PrismaTenantRepository } from '../../infrastructure/repositories/PrismaTenantRepository';
import { JwtAuthTokenService } from '../../infrastructure/services/JwtAuthTokenService';
import { BcryptPasswordService } from '../../infrastructure/services/BcryptPasswordService';
import { FirebaseGoogleAuthService } from '../../infrastructure/services/FirebaseGoogleAuthService';
import { AuthDomainService } from '../../domain/services/AuthDomainService';
import { PrismaStaffRepository } from '@/infrastructure/repositories/PrismaStaffRepository';

export class AuthServiceContainer {
  private static authUseCases: AuthUseCases;

  static getAuthUseCases(): AuthUseCases {
    if (!this.authUseCases) {
      const userRepository = PrismaUserRepository.getInstance();
      const tenantRepository = PrismaTenantRepository.getInstance();
      const authTokenService = JwtAuthTokenService.getInstance();
      const passwordService = BcryptPasswordService.getInstance();
      const staffRepository = PrismaStaffRepository.getInstance(); 
      const googleAuthService = FirebaseGoogleAuthService.getInstance();
      const authDomainService = new AuthDomainService(passwordService);

      this.authUseCases = AuthUseCases.getInstance(
        userRepository,
        tenantRepository,
        authTokenService,
        passwordService,
        staffRepository,
        authDomainService,
        googleAuthService
      );
    }
    return this.authUseCases;
  }
}