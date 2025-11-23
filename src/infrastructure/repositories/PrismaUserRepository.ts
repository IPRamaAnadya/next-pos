import { User } from '../../domain/entities/User';
import { Tenant } from '../../domain/entities/Tenant';
import { UserRepository, UserData, UserWithTenants } from '../../domain/repositories/UserRepository';
import prisma from '@/lib/prisma';

export class PrismaUserRepository implements UserRepository {
  private static instance: PrismaUserRepository;

  private constructor() {}

  public static getInstance(): PrismaUserRepository {
    if (!PrismaUserRepository.instance) {
      PrismaUserRepository.instance = new PrismaUserRepository();
    }
    return PrismaUserRepository.instance;
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;
      return this.mapToEntity(user);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error(`Failed to find user with ID: ${id}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;
      return this.mapToEntity(user);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error(`Failed to find user with email: ${email}`);
    }
  }

  async findByProviderId(providerId: string, provider: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: { 
          providerId: providerId,
          provider: provider 
        },
      });

      if (!user) return null;
      return this.mapToEntity(user);
    } catch (error) {
      console.error('Error finding user by provider ID:', error);
      throw new Error(`Failed to find user with provider ID: ${providerId}`);
    }
  }

  async create(userData: UserData): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          provider: userData.provider || 'email',
          providerId: userData.providerId,
          emailVerified: userData.emailVerified || false,
        },
      });
      return this.mapToEntity(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async update(id: string, updates: Partial<UserData>): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updates,
      });
      return this.mapToEntity(user);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user with ID: ${id}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user with ID: ${id}`);
    }
  }

  async findUserWithTenants(email: string): Promise<UserWithTenants | null> {
    try {
      const userData = await prisma.user.findUnique({
        where: { email },
        include: { 
          tenants: true 
        },
      });

      if (!userData) return null;

      const user = this.mapToEntity(userData);
      const tenants = userData.tenants.map(tenant => new Tenant(
        tenant.id,
        tenant.userId,
        tenant.name,
        tenant.email || '',
        tenant.address,
        tenant.phone,
        tenant.subscribedUntil,
        tenant.isSubscribed,
        tenant.createdAt,
        tenant.updatedAt
      ));

      return { user, tenants };
    } catch (error) {
      console.error('Error finding user with tenants:', error);
      throw new Error(`Failed to find user with tenants for email: ${email}`);
    }
  }

  private mapToEntity(data: any): User {
    return new User(
      data.id,
      data.email,
      data.password,
      data.createdAt,
      data.updatedAt,
      data.displayName,
      data.photoURL,
      data.provider,
      data.providerId,
      data.emailVerified
    );
  }
}