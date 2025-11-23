import { Customer } from '../../domain/entities/Customer';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerQueryOptions } from './interfaces/CustomerQueryOptions';

export class CustomerUseCases {
  private static instance: CustomerUseCases;

  private constructor(private customerRepository: CustomerRepository) {}

  public static getInstance(customerRepository: CustomerRepository): CustomerUseCases {
    if (!CustomerUseCases.instance) {
      CustomerUseCases.instance = new CustomerUseCases(customerRepository);
    }
    return CustomerUseCases.instance;
  }

  async getCustomers(tenantId: string, options: CustomerQueryOptions) {
    return await this.customerRepository.findAll(tenantId, options);
  }

  async getCustomerById(id: string, tenantId: string) {
    const customer = await this.customerRepository.findById(id, tenantId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async createCustomer(data: {
    tenantId: string;
    membershipCode?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    birthday?: Date;
    membershipExpiredAt?: Date;
    points?: number;
  }) {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Customer name is required');
    }

    // Check for duplicate email if provided
    if (data.email) {
      const existingByEmail = await this.customerRepository.findByEmail(data.email, data.tenantId);
      if (existingByEmail) {
        throw new Error('Customer with this email already exists');
      }
    }

    // Check for duplicate phone if provided
    if (data.phone) {
      const existingByPhone = await this.customerRepository.findByPhone(data.phone, data.tenantId);
      if (existingByPhone) {
        throw new Error('Customer with this phone number already exists');
      }
    }

    // Check for duplicate membership code if provided
    if (data.membershipCode) {
      const existingByCode = await this.customerRepository.findByMembershipCode(data.membershipCode, data.tenantId);
      if (existingByCode) {
        throw new Error('Customer with this membership code already exists');
      }
    }

    const customerData = {
      tenantId: data.tenantId,
      membershipCode: data.membershipCode || null,
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      birthday: data.birthday || null,
      lastPurchaseAt: null,
      membershipExpiredAt: data.membershipExpiredAt || null,
      points: data.points ?? 0,
    };

    return await this.customerRepository.create(customerData);
  }

  async updateCustomer(id: string, tenantId: string, updates: Partial<Customer>) {
    const existingCustomer = await this.getCustomerById(id, tenantId);

    // Validate name if being updated
    if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
      throw new Error('Customer name cannot be empty');
    }

    // Check for duplicate email if email is being updated
    if (updates.email && updates.email !== existingCustomer.email) {
      const existingByEmail = await this.customerRepository.findByEmail(updates.email, tenantId, id);
      if (existingByEmail) {
        throw new Error('Customer with this email already exists');
      }
    }

    // Check for duplicate phone if phone is being updated
    if (updates.phone && updates.phone !== existingCustomer.phone) {
      const existingByPhone = await this.customerRepository.findByPhone(updates.phone, tenantId, id);
      if (existingByPhone) {
        throw new Error('Customer with this phone number already exists');
      }
    }

    // Check for duplicate membership code if being updated
    if (updates.membershipCode && updates.membershipCode !== existingCustomer.membershipCode) {
      const existingByCode = await this.customerRepository.findByMembershipCode(updates.membershipCode, tenantId, id);
      if (existingByCode) {
        throw new Error('Customer with this membership code already exists');
      }
    }

    // Trim name if provided
    if (updates.name) {
      updates = { ...updates, name: updates.name.trim() };
    }

    return await this.customerRepository.update(id, tenantId, updates);
  }

  async deleteCustomer(id: string, tenantId: string) {
    await this.getCustomerById(id, tenantId); // Ensure exists
    await this.customerRepository.delete(id, tenantId);
  }

  async getActiveMembersCount(tenantId: string): Promise<number> {
    return await this.customerRepository.countActiveMembers(tenantId);
  }

  async updateLastPurchase(id: string, tenantId: string): Promise<Customer> {
    return await this.customerRepository.update(id, tenantId, { 
      lastPurchaseAt: new Date() 
    });
  }

  async extendMembership(id: string, tenantId: string, expirationDate: Date): Promise<Customer> {
    const customer = await this.getCustomerById(id, tenantId);
    
    if (expirationDate <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    return await this.customerRepository.update(id, tenantId, { 
      membershipExpiredAt: expirationDate 
    });
  }

  async updateCustomerPoints(id: string, tenantId: string, points: number) {
    const customer = await this.getCustomerById(id, tenantId);
    
    if (points < 0) {
      throw new Error('Points cannot be negative');
    }

    return await this.customerRepository.update(id, tenantId, { points });
  }

  async addCustomerPoints(id: string, tenantId: string, pointsToAdd: number) {
    const customer = await this.getCustomerById(id, tenantId);
    
    if (pointsToAdd <= 0) {
      throw new Error('Points to add must be positive');
    }

    const newPoints = customer.points + pointsToAdd;
    return await this.customerRepository.update(id, tenantId, { points: newPoints });
  }

  async deductCustomerPoints(id: string, tenantId: string, pointsToDeduct: number) {
    const customer = await this.getCustomerById(id, tenantId);
    
    if (pointsToDeduct <= 0) {
      throw new Error('Points to deduct must be positive');
    }

    if (customer.points < pointsToDeduct) {
      throw new Error('Insufficient points');
    }

    const newPoints = customer.points - pointsToDeduct;
    return await this.customerRepository.update(id, tenantId, { points: newPoints });
  }
}