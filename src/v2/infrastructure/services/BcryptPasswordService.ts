import bcrypt from 'bcryptjs';
import { PasswordService } from '../../domain/repositories/AuthRepository';

export class BcryptPasswordService implements PasswordService {
  private static instance: BcryptPasswordService;

  private constructor() {}

  public static getInstance(): BcryptPasswordService {
    if (!BcryptPasswordService.instance) {
      BcryptPasswordService.instance = new BcryptPasswordService();
    }
    return BcryptPasswordService.instance;
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw new Error('Failed to compare password');
    }
  }
}