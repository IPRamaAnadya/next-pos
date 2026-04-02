// ─────────────────────────────────────────────
//  Input types
// ─────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

/** Staff employee logging into the cashier app */
export interface StaffLoginInput {
  username: string;
  password: string;
  storeCode: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  tenantName: string;
  tenantAddress?: string;
  tenantPhone?: string;
  storeCode?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ─────────────────────────────────────────────
//  JWT Payload types
// ─────────────────────────────────────────────

export interface OwnerTokenPayload {
  /** User.id (UUID) */
  userId: string;
  /** Tenant.id (UUID) */
  tenantId: string;
  /** User role from DB */
  role: string;
  /** Owner session — always redirects to dashboard */
  type: 'owner';
}

export interface StaffTokenPayload {
  /** Staff.id (UUID) */
  staffId: string;
  /** Tenant.id (UUID) */
  tenantId: string;
  /** Staff role string */
  role: string;
  isOwner: boolean;
  type: 'staff';
}

// ─────────────────────────────────────────────
//  Response / profile types
// ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  tenantId: string;
  tenantName: string;
  storeCode: string | null;
  role: string;
  type: 'owner';
}

export interface StaffProfile {
  id: string;
  username: string;
  tenantId: string;
  tenantName: string;
  storeCode: string | null;
  role: string;
  isOwner: boolean;
  type: 'staff';
}

export interface AuthResult {
  token: string;
  user: UserProfile | StaffProfile;
}
