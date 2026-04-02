import type { OwnerTokenPayload, StaffTokenPayload } from './auth.type';

// ─────────────────────────────────────────────
//  UserEntity
// ─────────────────────────────────────────────

export class UserEntity {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly displayName: string | null;
  readonly photoURL: string | null;
  readonly provider: string | null;
  readonly emailVerified: boolean | null;
  readonly role: string;

  constructor(data: {
    id: string;
    email: string;
    password: string;
    displayName?: string | null;
    photoURL?: string | null;
    provider?: string | null;
    emailVerified?: boolean | null;
    role: string;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.displayName = data.displayName ?? null;
    this.photoURL = data.photoURL ?? null;
    this.provider = data.provider ?? null;
    this.emailVerified = data.emailVerified ?? null;
    this.role = data.role;
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  /** Only email-based accounts can use password login */
  canLogin(): boolean {
    return this.provider === 'email' || this.provider === null;
  }
}

// ─────────────────────────────────────────────
//  TenantEntity
// ─────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 8;

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
  }

  /** Generate a random 8-character uppercase alphanumeric store code */
  static generateCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
  }
}

// ─────────────────────────────────────────────
//  StaffEntity
// ─────────────────────────────────────────────

export class StaffEntity {
  readonly id: string;
  readonly tenantId: string | null;
  readonly isOwner: boolean;
  readonly role: string;
  readonly username: string;
  readonly password: string;

  constructor(data: {
    id: string;
    tenantId?: string | null;
    isOwner: boolean;
    role: string;
    username: string;
    password: string;
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId ?? null;
    this.isOwner = data.isOwner;
    this.role = data.role;
    this.username = data.username;
    this.password = data.password;
  }

  isValid(): boolean {
    return !!this.tenantId && !!this.username;
  }
}

// ─────────────────────────────────────────────
//  AuthSessionEntity (decoded JWT value object)
// ─────────────────────────────────────────────

export class AuthSessionEntity {
  private readonly payload: OwnerTokenPayload | StaffTokenPayload;

  constructor(payload: OwnerTokenPayload | StaffTokenPayload) {
    this.payload = payload;
  }

  get type(): 'owner' | 'staff' {
    return this.payload.type;
  }

  get tenantId(): string {
    return this.payload.tenantId;
  }

  get role(): string {
    return this.payload.role;
  }

  isOwnerSession(): boolean {
    return this.payload.type === 'owner';
  }

  isStaffSession(): boolean {
    return this.payload.type === 'staff';
  }

  isDashboardMode(): boolean {
    return this.payload.type === 'owner';
  }

  isCashierMode(): boolean {
    return this.payload.type === 'staff';
  }

  getUserId(): string | null {
    if (this.isOwnerSession()) return (this.payload as OwnerTokenPayload).userId;
    return null;
  }

  getStaffId(): string | null {
    const p = this.payload as StaffTokenPayload;
    if (p.staffId) return p.staffId;
    return null;
  }

  /** Raw payload for token generation */
  toPayload(): OwnerTokenPayload | StaffTokenPayload {
    return this.payload;
  }
}
