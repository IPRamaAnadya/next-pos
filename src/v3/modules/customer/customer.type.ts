// ─────────────────────────────────────────────
//  Customer types
// ─────────────────────────────────────────────

export interface CustomerProfile {
  id: string;
  tenantId: string | null;
  membershipCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthday: Date | null;
  lastPurchaseAt: Date | null;
  membershipExpiredAt: Date | null;
  points: number;
  isMember: boolean;
  isActiveMember: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCustomerInput {
  name: string;
  membershipCode?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthday?: Date | null;
  membershipExpiredAt?: Date | null;
  points?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  membershipCode?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthday?: Date | null;
  lastPurchaseAt?: Date | null;
  membershipExpiredAt?: Date | null;
  points?: number;
}

export interface CustomerQueryInput {
  page?: number;
  pageSize?: number;
  search?: string;
  email?: string;
  phone?: string;
  membershipCode?: string;
  hasActiveMembership?: boolean;
}

export interface UpdatePointsInput {
  operation: 'set' | 'add' | 'deduct';
  points: number;
}

export interface ExtendMembershipInput {
  membershipExpiredAt: Date;
}
