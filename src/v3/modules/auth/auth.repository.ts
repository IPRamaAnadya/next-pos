import prisma from '@/v3/lib/prisma';
import { UserEntity, TenantEntity, StaffEntity } from './auth.entity';

// ─────────────────────────────────────────────
//  Interface
// ─────────────────────────────────────────────

export interface UserWithTenants {
  user: UserEntity;
  tenants: TenantEntity[];
}

export interface CreateUserWithTenantInput {
  email: string;
  hashedPassword: string;
  displayName?: string;
  tenantName: string;
  tenantAddress?: string;
  tenantPhone?: string;
  storeCode: string;
}

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<UserWithTenants | null>;
  findUserById(id: string): Promise<UserEntity | null>;
  createUserWithTenant(data: CreateUserWithTenantInput): Promise<{ user: UserEntity; tenant: TenantEntity }>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  findTenantByCode(storeCode: string): Promise<TenantEntity | null>;
  findStaffByStoreCode(username: string, storeCode: string): Promise<(StaffEntity & { tenantName: string }) | null>;
  updateStaffPassword(staffId: string, hashedPassword: string): Promise<void>;
}

// ─────────────────────────────────────────────
//  Prisma implementation
// ─────────────────────────────────────────────

export class PrismaAuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<UserWithTenants | null> {
    const row = await prisma.user.findUnique({
      where: { email },
      include: { tenants: true },
    });
    if (!row) return null;

    return {
      user: new UserEntity(row),
      tenants: row.tenants.map((t) => new TenantEntity(t)),
    };
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    if (!row) return null;
    return new UserEntity(row);
  }

  async createUserWithTenant(data: CreateUserWithTenantInput): Promise<{ user: UserEntity; tenant: TenantEntity }> {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.hashedPassword,
          displayName: data.displayName ?? null,
          provider: 'email',
          emailVerified: false,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          userId: user.id,
          name: data.tenantName,
          email: data.email,
          address: data.tenantAddress ?? null,
          phone: data.tenantPhone ?? null,
          storeCode: data.storeCode,
        },
      });

      return { user, tenant };
    });

    return {
      user: new UserEntity(result.user),
      tenant: new TenantEntity(result.tenant),
    };
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  }

  async findTenantByCode(storeCode: string): Promise<TenantEntity | null> {
    const row = await prisma.tenant.findUnique({ where: { storeCode } });
    if (!row) return null;
    return new TenantEntity(row);
  }

  async findStaffByStoreCode(
    username: string,
    storeCode: string,
  ): Promise<(StaffEntity & { tenantName: string }) | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { storeCode },
      select: { id: true, name: true },
    });
    if (!tenant) return null;

    const row = await prisma.staff.findUnique({
      where: { tenantId_username: { tenantId: tenant.id, username } },
    });
    if (!row) return null;

    const entity = new StaffEntity(row) as StaffEntity & { tenantName: string };
    entity.tenantName = tenant.name;
    return entity;
  }

  async updateStaffPassword(staffId: string, hashedPassword: string): Promise<void> {
    await prisma.staff.update({ where: { id: staffId }, data: { password: hashedPassword } });
  }
}

// ─────────────────────────────────────────────
//  Singleton
// ─────────────────────────────────────────────

export const authRepository = new PrismaAuthRepository();
