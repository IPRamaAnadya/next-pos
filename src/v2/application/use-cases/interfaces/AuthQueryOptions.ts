export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  tenantName: string;
  tenantAddress?: string;
  tenantPhone?: string;
}

export interface CashierLoginRequest {
  username: string;
  password: string;
  tenantId: string;
}

export interface TenantLoginRequest {
  username: string;
  password: string;
  tenantId: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  tenantName?: string; // For new user registration
  tenantAddress?: string;
  tenantPhone?: string;
}

export interface AuthQueryOptions {
  includeExpired?: boolean;
  roleName?: string;
}