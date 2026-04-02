import { TenantUseCases } from '../use-cases/TenantUseCases';
import { PrismaTenantRepository } from '../../infrastructure/repositories/PrismaTenantRepository';

export class TenantServiceContainer {
  private static tenantUseCases: TenantUseCases;

  static getTenantUseCases(): TenantUseCases {
    if (!this.tenantUseCases) {
      const tenantRepository = PrismaTenantRepository.getInstance();
      this.tenantUseCases = TenantUseCases.getInstance(tenantRepository);
    }
    return this.tenantUseCases;
  }
}