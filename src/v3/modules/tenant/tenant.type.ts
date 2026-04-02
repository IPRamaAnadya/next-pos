// ─────────────────────────────────────────────
//  Sub-types
// ─────────────────────────────────────────────

export interface TenantSettingProfile {
  showDiscount: boolean;
  showTax: boolean;
}

// ─────────────────────────────────────────────
//  Response shapes
// ─────────────────────────────────────────────

export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  address: string | null;
  phone: string | null;
  storeCode: string | null;
  isSubscribed: boolean | null;
  subscribedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  settings: TenantSettingProfile;
}

// ─────────────────────────────────────────────
//  Input types
// ─────────────────────────────────────────────

/** email and storeCode are intentionally excluded — email requires verification, storeCode change breaks staff logins */
export interface UpdateTenantInput {
  name?: string;
  address?: string;
  phone?: string;
}

export interface UpdateTenantSettingInput {
  showDiscount?: boolean;
  showTax?: boolean;
}
