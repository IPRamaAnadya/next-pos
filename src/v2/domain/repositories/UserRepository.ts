import { User } from '../entities/User';
import { Tenant } from '../entities/Tenant';
import { AuthSession } from '../entities/AuthSession';

export interface UserData {
  email: string;
  password: string;
  displayName?: string | null;
  photoURL?: string | null;
  provider?: string | null;
  providerId?: string | null;
  emailVerified?: boolean;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByProviderId(providerId: string, provider: string): Promise<User | null>;
  create(userData: UserData): Promise<User>;
  update(id: string, updates: Partial<UserData>): Promise<User>;
  delete(id: string): Promise<void>;
  findUserWithTenants(email: string): Promise<UserWithTenants | null>;
}

export interface UserWithTenants {
  user: User;
  tenants: Tenant[];
}