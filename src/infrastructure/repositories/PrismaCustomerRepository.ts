import { Customer, CustomerForOrder } from '../../domain/entities/Customer';
import { CustomerRepository, PaginatedCustomers } from '../../domain/repositories/CustomerRepository';
import { CustomerQueryOptions } from '../../application/use-cases/interfaces/CustomerQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaCustomerRepository implements CustomerRepository {
  private static instance: PrismaCustomerRepository;

  private constructor() {}

  public static getInstance(): PrismaCustomerRepository {
    if (!PrismaCustomerRepository.instance) {
      PrismaCustomerRepository.instance = new PrismaCustomerRepository();
    }
    return PrismaCustomerRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    'membership_code': 'membershipCode',
    'last_purchase_at': 'lastPurchaseAt',
    'membership_expired_at': 'membershipExpiredAt',
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'membershipCode', 'name', 'email', 'phone', 'address', 'birthday', 'lastPurchaseAt', 'membershipExpiredAt', 'points', 'createdAt', 'updatedAt'
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

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    try {
      console.log('🔍 PrismaCustomerRepository.findById called with:', { id, tenantId });
      
      const customer = await prisma.customer.findFirst({
        where: { 
          id, 
          tenantId 
        },
      });

      console.log('📊 Query result:', customer ? { 
        id: customer.id, 
        tenantId: customer.tenantId, 
        name: customer.name, 
        phone: customer.phone 
      } : 'null');

      if (!customer) return null;
      return this.mapToEntity(customer);
    } catch (error) {
      console.error('❌ Error finding customer by ID:', error);
      throw new Error(`Failed to find customer with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: CustomerQueryOptions): Promise<PaginatedCustomers> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.search) {
        // Search across name and phone
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
        ];
      }
      
      if (filters?.name) {
        whereClause.name = { contains: filters.name, mode: 'insensitive' };
      }
      
      if (filters?.email) {
        whereClause.email = { contains: filters.email, mode: 'insensitive' };
      }
      
      if (filters?.phone) {
        whereClause.phone = { contains: filters.phone };
      }
      
      if (filters?.membershipCode) {
        whereClause.membershipCode = { contains: filters.membershipCode, mode: 'insensitive' };
      }
      
      if (filters?.hasActiveMembership !== undefined) {
        if (filters.hasActiveMembership) {
          whereClause.membershipExpiredAt = { gt: new Date() };
        } else {
          whereClause.OR = [
            { membershipExpiredAt: null },
            { membershipExpiredAt: { lte: new Date() } }
          ];
        }
      }

      const totalCount = await prisma.customer.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const customers = await prisma.customer.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: customers.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding customers:', error);
      throw new Error('Failed to retrieve customers');
    }
  }

  async findByEmail(email: string, tenantId: string, excludeId?: string): Promise<Customer | null> {
    try {
      const whereClause: any = { email, tenantId };
      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const customer = await prisma.customer.findFirst({
        where: whereClause,
      });

      if (!customer) return null;
      return this.mapToEntity(customer);
    } catch (error) {
      console.error('Error finding customer by email:', error);
      throw new Error('Failed to find customer by email');
    }
  }

  async findByPhone(phone: string, tenantId: string, excludeId?: string): Promise<Customer | null> {
    try {
      const whereClause: any = { phone, tenantId };
      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const customer = await prisma.customer.findFirst({
        where: whereClause,
      });

      if (!customer) return null;
      return this.mapToEntity(customer);
    } catch (error) {
      console.error('Error finding customer by phone:', error);
      throw new Error('Failed to find customer by phone');
    }
  }

  async findByMembershipCode(code: string, tenantId: string, excludeId?: string): Promise<Customer | null> {
    try {
      const whereClause: any = { membershipCode: code, tenantId };
      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const customer = await prisma.customer.findFirst({
        where: whereClause,
      });

      if (!customer) return null;
      return this.mapToEntity(customer);
    } catch (error) {
      console.error('Error finding customer by membership code:', error);
      throw new Error('Failed to find customer by membership code');
    }
  }

  async create(data: {
    tenantId: string;
    membershipCode?: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    birthday: Date | null;
    lastPurchaseAt: Date | null;
    membershipExpiredAt: Date | null;
    points: number;
  }): Promise<Customer> {
    try {
      const customer = await prisma.customer.create({
        data: {
          tenantId: data.tenantId,
          membershipCode: data.membershipCode,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          birthday: data.birthday,
          lastPurchaseAt: data.lastPurchaseAt,
          membershipExpiredAt: data.membershipExpiredAt,
          points: data.points,
        },
      });
      return this.mapToEntity(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  async update(id: string, tenantId: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const customer = await prisma.customer.update({
        where: { id, tenantId },
        data: updates,
      });
      return this.mapToEntity(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    try {
      await prisma.customer.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  }

  async countActiveMembers(tenantId: string): Promise<number> {
    try {
      return await prisma.customer.count({
        where: { 
          tenantId, 
          membershipExpiredAt: { gt: new Date() }
        },
      });
    } catch (error) {
      console.error('Error counting active members:', error);
      throw new Error('Failed to count active members');
    }
  }

  // Legacy methods for Order compatibility
  async findByIdForOrder(id: string): Promise<CustomerForOrder | null> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) return null;
      
      return {
        id: customer.id,
        phone: customer.phone || undefined,
        name: customer.name,
        points: customer.points || 0,
      };
    } catch (error) {
      console.error('Error finding customer for order:', error);
      throw new Error('Failed to find customer for order');
    }
  }

  async updatePoints(id: string, points: number): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id },
        data: { points },
      });
    } catch (error) {
      console.error('Error updating customer points:', error);
      throw new Error('Failed to update customer points');
    }
  }

  async decrementPoints(id: string, points: number): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id },
        data: {
          points: {
            decrement: points,
          },
        },
      });
    } catch (error) {
      console.error('Error decrementing customer points:', error);
      throw new Error('Failed to decrement customer points');
    }
  }

  async incrementPoints(id: string, points: number): Promise<void> {
    try {
      await prisma.customer.update({
        where: { id },
        data: {
          points: {
            increment: points,
          },
        },
      });
    } catch (error) {
      console.error('Error incrementing customer points:', error);
      throw new Error('Failed to increment customer points');
    }
  }

  private mapToEntity(data: any): Customer {
    return new Customer(
      data.id,
      data.tenantId,
      data.membershipCode,
      data.name,
      data.email,
      data.phone,
      data.address,
      data.birthday,
      data.lastPurchaseAt,
      data.membershipExpiredAt,
      data.points || 0,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Clean up method for testing
  public static cleanup(): void {
    if (PrismaCustomerRepository.instance) {
      PrismaCustomerRepository.instance = null as any;
    }
  }
}