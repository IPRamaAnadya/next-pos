import type { CustomerProfile } from './customer.type';

export class CustomerEntity {
  readonly id: string;
  readonly tenantId: string | null;
  readonly membershipCode: string | null;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly birthday: Date | null;
  readonly lastPurchaseAt: Date | null;
  readonly membershipExpiredAt: Date | null;
  readonly points: number;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  constructor(data: {
    id: string;
    tenantId?: string | null;
    membershipCode?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    birthday?: Date | null;
    lastPurchaseAt?: Date | null;
    membershipExpiredAt?: Date | null;
    points?: number | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId ?? null;
    this.membershipCode = data.membershipCode ?? null;
    this.name = data.name;
    this.email = data.email ?? null;
    this.phone = data.phone ?? null;
    this.address = data.address ?? null;
    this.birthday = data.birthday ?? null;
    this.lastPurchaseAt = data.lastPurchaseAt ?? null;
    this.membershipExpiredAt = data.membershipExpiredAt ?? null;
    this.points = data.points ?? 0;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  isMember(): boolean {
    return this.membershipCode !== null;
  }

  isActiveMember(): boolean {
    if (!this.isMember()) return false;
    if (!this.membershipExpiredAt) return true; // no expiry = always active
    return new Date() <= this.membershipExpiredAt;
  }

  toProfile(): CustomerProfile {
    return {
      id: this.id,
      tenantId: this.tenantId,
      membershipCode: this.membershipCode,
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      birthday: this.birthday,
      lastPurchaseAt: this.lastPurchaseAt,
      membershipExpiredAt: this.membershipExpiredAt,
      points: this.points,
      isMember: this.isMember(),
      isActiveMember: this.isActiveMember(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
