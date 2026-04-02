import prisma from '@/v3/lib/prisma';
import { TenantEntity, TenantSettingEntity } from './tenant.entity';
import type { UpdateTenantInput, UpdateTenantSettingInput } from './tenant.type';

// ─────────────────────────────────────────────
//  Interface
// ─────────────────────────────────────────────

export interface ITenantRepository {
  findById(id: string): Promise<TenantEntity | null>;
  update(id: string, data: UpdateTenantInput): Promise<TenantEntity>;
  findSettingByTenantId(tenantId: string): Promise<TenantSettingEntity | null>;
  upsertSetting(tenantId: string, data: UpdateTenantSettingInput): Promise<TenantSettingEntity>;
}

// ─────────────────────────────────────────────
//  Prisma implementation
// ─────────────────────────────────────────────

export class PrismaTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<TenantEntity | null> {
    const row = await prisma.tenant.findUnique({ where: { id } });
    if (!row) return null;
    return new TenantEntity(row);
  }

  async update(id: string, data: UpdateTenantInput): Promise<TenantEntity> {
    const row = await prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });
    return new TenantEntity(row);
  }

  async findSettingByTenantId(tenantId: string): Promise<TenantSettingEntity | null> {
    const row = await prisma.tenantSetting.findUnique({ where: { tenantId } });
    if (!row) return null;
    return new TenantSettingEntity(row);
  }

  async upsertSetting(tenantId: string, data: UpdateTenantSettingInput): Promise<TenantSettingEntity> {
    const row = await prisma.tenantSetting.upsert({
      where: { tenantId },
      create: {
        tenantId,
        showDiscount: data.showDiscount ?? false,
        showTax: data.showTax ?? false,
      },
      update: {
        ...(data.showDiscount !== undefined && { showDiscount: data.showDiscount }),
        ...(data.showTax !== undefined && { showTax: data.showTax }),
      },
    });
    return new TenantSettingEntity(row);
  }
}

// ─────────────────────────────────────────────
//  Singleton
// ─────────────────────────────────────────────

export const tenantRepository = new PrismaTenantRepository();
