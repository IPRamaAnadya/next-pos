import type { TenantProfile, TenantSettingProfile } from './tenant.type';

// ─────────────────────────────────────────────
//  TenantSettingEntity
// ─────────────────────────────────────────────

export class TenantSettingEntity {
  readonly id: bigint;
  readonly tenantId: string;
  readonly showDiscount: boolean;
  readonly showTax: boolean;

  constructor(data: {
    id: bigint;
    tenantId: string;
    showDiscount: boolean;
    showTax: boolean;
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.showDiscount = data.showDiscount;
    this.showTax = data.showTax;
  }

  toProfile(): TenantSettingProfile {
    return {
      showDiscount: this.showDiscount,
      showTax: this.showTax,
    };
  }

  static defaults(): TenantSettingProfile {
    return { showDiscount: false, showTax: false };
  }
}

// ─────────────────────────────────────────────
//  TenantEntity
// ─────────────────────────────────────────────

export class TenantEntity {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly address: string | null;
  readonly phone: string | null;
  readonly storeCode: string | null;
  readonly isSubscribed: boolean | null;
  readonly subscribedUntil: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: {
    id: string;
    userId: string;
    name: string;
    email: string;
    address?: string | null;
    phone?: string | null;
    storeCode?: string | null;
    isSubscribed?: boolean | null;
    subscribedUntil?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.name = data.name;
    this.email = data.email;
    this.address = data.address ?? null;
    this.phone = data.phone ?? null;
    this.storeCode = data.storeCode ?? null;
    this.isSubscribed = data.isSubscribed ?? null;
    this.subscribedUntil = data.subscribedUntil ?? null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /** Returns true if this tenant belongs to the given userId */
  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  toProfile(settings?: TenantSettingProfile): TenantProfile {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      address: this.address,
      phone: this.phone,
      storeCode: this.storeCode,
      isSubscribed: this.isSubscribed,
      subscribedUntil: this.subscribedUntil,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      settings: settings ?? TenantSettingEntity.defaults(),
    };
  }
}
