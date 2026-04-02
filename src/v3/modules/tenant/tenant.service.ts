import { tenantRepository } from './tenant.repository';
import { TenantSettingEntity } from './tenant.entity';
import type { TenantProfile, TenantSettingProfile, UpdateTenantInput, UpdateTenantSettingInput } from './tenant.type';

class TenantService {
  // ─────────────────────────────────────────────
  //  Read
  // ─────────────────────────────────────────────

  async getTenant(tenantId: string): Promise<TenantProfile> {
    const [tenant, setting] = await Promise.all([
      tenantRepository.findById(tenantId),
      tenantRepository.findSettingByTenantId(tenantId),
    ]);

    if (!tenant) throw new Error('Store not found');

    return tenant.toProfile(setting?.toProfile() ?? TenantSettingEntity.defaults());
  }

  async getSettings(tenantId: string): Promise<TenantSettingProfile> {
    const setting = await tenantRepository.findSettingByTenantId(tenantId);
    return setting?.toProfile() ?? TenantSettingEntity.defaults();
  }

  // ─────────────────────────────────────────────
  //  Update (owner only)
  // ─────────────────────────────────────────────

  async updateTenant(tenantId: string, requestingUserId: string, input: UpdateTenantInput): Promise<TenantProfile> {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new Error('Store not found');

    if (!tenant.isOwnedBy(requestingUserId)) {
      throw new Error('You do not have permission to update this store');
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error('Store name cannot be empty');
    }

    const [updated, setting] = await Promise.all([
      tenantRepository.update(tenantId, input),
      tenantRepository.findSettingByTenantId(tenantId),
    ]);

    return updated.toProfile(setting?.toProfile() ?? TenantSettingEntity.defaults());
  }

  async updateSettings(
    tenantId: string,
    requestingUserId: string,
    input: UpdateTenantSettingInput,
  ): Promise<TenantSettingProfile> {
    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw new Error('Store not found');

    if (!tenant.isOwnedBy(requestingUserId)) {
      throw new Error('You do not have permission to update this store');
    }

    const setting = await tenantRepository.upsertSetting(tenantId, input);
    return setting.toProfile();
  }
}

export const tenantService = new TenantService();
