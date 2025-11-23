import { Tenant } from '../../domain/entities/Tenant';
import { TenantRepository, TenantData, PaginatedTenants } from '../../domain/repositories/TenantRepository';
import { TenantQueryOptions } from '../../application/use-cases/interfaces/TenantQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaTenantRepository implements TenantRepository {
  private static instance: PrismaTenantRepository;

  private constructor() {}

  public static getInstance(): PrismaTenantRepository {
    if (!PrismaTenantRepository.instance) {
      PrismaTenantRepository.instance = new PrismaTenantRepository();
    }
    return PrismaTenantRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'user_id': 'userId',
    'subscribed_until': 'subscribedUntil',
    'is_subscribed': 'isSubscribed',
  };

  private validSortFields = new Set([
    'id', 'userId', 'name', 'email', 'address', 'phone', 'subscribedUntil', 'isSubscribed', 'createdAt', 'updatedAt'
  ]);

  private mapSortField(apiFieldName: string): string {
    // First check if it's already a valid Prisma field name
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }
    
    // Then check if we have a mapping from API field name to Prisma field name
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }
    
    // Default to createdAt for invalid field names
    console.warn(`Invalid sort field: ${apiFieldName}, defaulting to createdAt`);
    return 'createdAt';
  }

  async findById(id: string): Promise<Tenant | null> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id },
      });

      if (!tenant) return null;
      return this.mapToEntity(tenant);
    } catch (error) {
      console.error('Error finding tenant by ID:', error);
      throw new Error(`Failed to find tenant with ID: ${id}`);
    }
  }

  async findByUserId(userId: string): Promise<Tenant[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { userId },
      });

      return tenants.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding tenants by user ID:', error);
      throw new Error(`Failed to find tenants for user ID: ${userId}`);
    }
  }

  async create(tenantData: TenantData): Promise<Tenant> {
    try {
      // Get user password for staff creation
      const user = await prisma.user.findUnique({
        where: { id: tenantData.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Start a transaction for tenant creation with related setup
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Tenant
        const tenant = await tx.tenant.create({
          data: {
            userId: tenantData.userId,
            name: tenantData.name,
            email: tenantData.email,
            address: tenantData.address,
            phone: tenantData.phone,
            subscribedUntil: tenantData.subscribedUntil,
            isSubscribed: tenantData.isSubscribed,
          },
        });

        // 2. Create Tenant Setting (default)
        await tx.tenantSetting.create({
          data: {
            tenantId: tenant.id,
            showDiscount: false,
            showTax: false,
          },
        });

        // 3. Create Payroll Setting (default)
        await tx.payrollSetting.create({
          data: {
            tenantId: tenant.id,
            ump: 0,
            normalWorkHoursPerDay: 7,
            normalWorkHoursPerMonth: 173,
            overtimeRate1: 1.5,
            overtimeRate2: 2,
            overtimeRateWeekend1: 2,
            overtimeRateWeekend2: 3,
            overtimeRateWeekend3: 4,
            overtimeCalculationType: 'HOURLY',
          },
        });

        // 4. Create Staff with role manager + isOwner
        await tx.staff.create({
          data: {
            tenantId: tenant.id,
            isOwner: true,
            role: 'manager',
            username: tenantData.email,
            password: user.password, // Use user's hashed password
          },
        });

        // 5. Check and assign Trial Subscription Plan (only if no subscription provided)
        if (!tenantData.subscribedUntil && !tenantData.isSubscribed) {
          const trialPlan = await tx.subscriptionPlan.findFirst({
            where: { isBetaTest: true },
          });
          if (trialPlan) {
            const trialEndDate = new Date();
            trialEndDate.setMonth(trialEndDate.getMonth() + 2); // 2 month trial

            await tx.tenantSubscription.create({
              data: {
                tenantId: tenant.id,
                planId: trialPlan.id,
                status: 'BETA',
                startDate: new Date(),
                endDate: trialEndDate,
              },
            });

            // Update tenant with trial subscription status
            return await tx.tenant.update({
              where: { id: tenant.id },
              data: {
                subscribedUntil: trialEndDate,
                isSubscribed: true,
              },
            });
          }
        }

        return tenant;
      });

      return this.mapToEntity(result);
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new Error('A tenant with this email already exists');
      }
      throw new Error('Failed to create tenant');
    }
  }

  async update(id: string, updates: Partial<Omit<TenantData, 'userId'>>): Promise<Tenant> {
    try {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: updates,
      });
      return this.mapToEntity(tenant);
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new Error('A tenant with this email already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Tenant not found');
      }
      throw new Error(`Failed to update tenant with ID: ${id}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.tenant.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant with ID: ${id}`);
    }
  }

  async findByEmail(email: string): Promise<Tenant | null> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { email },
      });

      if (!tenant) return null;
      return this.mapToEntity(tenant);
    } catch (error) {
      console.error('Error finding tenant by email:', error);
      throw new Error(`Failed to find tenant with email: ${email}`);
    }
  }

  async findAll(options: TenantQueryOptions): Promise<PaginatedTenants> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = {};
      
      // Apply filters
      if (filters?.name) {
        whereClause.name = { contains: filters.name, mode: 'insensitive' };
      }

      if (filters?.email) {
        whereClause.email = { contains: filters.email, mode: 'insensitive' };
      }

      if (filters?.userId) {
        whereClause.userId = filters.userId;
      }

      if (filters?.isSubscribed !== undefined) {
        whereClause.isSubscribed = filters.isSubscribed;
      }

      if (filters?.subscriptionStatus) {
        const now = new Date();
        switch (filters.subscriptionStatus) {
          case 'active':
            whereClause.isSubscribed = true;
            whereClause.OR = [
              { subscribedUntil: null },
              { subscribedUntil: { gt: now } }
            ];
            break;
          case 'expired':
            whereClause.isSubscribed = true;
            whereClause.subscribedUntil = { lt: now };
            break;
          case 'inactive':
            whereClause.isSubscribed = false;
            break;
        }
      }

      if (filters?.expiringSoon) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiringSoon);
        whereClause.isSubscribed = true;
        whereClause.subscribedUntil = {
          gte: new Date(),
          lte: futureDate,
        };
      }

      const totalCount = await prisma.tenant.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const tenants = await prisma.tenant.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: tenants.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding tenants:', error);
      throw new Error('Failed to retrieve tenants');
    }
  }

  async countByUserId(userId: string): Promise<number> {
    try {
      return await prisma.tenant.count({
        where: { userId },
      });
    } catch (error) {
      console.error('Error counting tenants by user ID:', error);
      throw new Error(`Failed to count tenants for user: ${userId}`);
    }
  }

  async findActiveByUserId(userId: string): Promise<Tenant[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          userId,
          isSubscribed: true,
          OR: [
            { subscribedUntil: null },
            { subscribedUntil: { gt: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });

      return tenants.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding active tenants by user ID:', error);
      throw new Error(`Failed to find active tenants for user: ${userId}`);
    }
  }

  async findExpiringSoon(days: number): Promise<Tenant[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const tenants = await prisma.tenant.findMany({
        where: {
          isSubscribed: true,
          subscribedUntil: {
            gte: new Date(),
            lte: futureDate,
          },
        },
        orderBy: { subscribedUntil: 'asc' },
      });

      return tenants.map(this.mapToEntity);
    } catch (error) {
      console.error('Error finding expiring tenants:', error);
      throw new Error('Failed to find expiring tenants');
    }
  }

  private mapToEntity(data: any): Tenant {
    return new Tenant(
      data.id,
      data.userId,
      data.name,
      data.email || '',
      data.address,
      data.phone,
      data.subscribedUntil,
      data.isSubscribed,
      data.createdAt,
      data.updatedAt
    );
  }
}