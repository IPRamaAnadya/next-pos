import jwt from 'jsonwebtoken';
import { AuthSession } from '../../domain/entities/AuthSession';
import { AuthTokenService } from '../../domain/repositories/AuthRepository';
import { getLimitsForTenant } from '@/lib/subscriptionLimit';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-strong-secret-key';

export class JwtAuthTokenService implements AuthTokenService {
  private static instance: JwtAuthTokenService;

  private constructor() {}

  public static getInstance(): JwtAuthTokenService {
    if (!JwtAuthTokenService.instance) {
      JwtAuthTokenService.instance = new JwtAuthTokenService();
    }
    return JwtAuthTokenService.instance;
  }

  async generateToken(payload: any): Promise<string> {
    try {
      // Enrich payload with subscription data if tenantId is present
      if (payload.tenantId) {
        return await this.generateEnrichedToken(payload);
      }
      return jwt.sign(payload, JWT_SECRET);
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  private async generateEnrichedToken(payload: any): Promise<string> {
    try {
      // Get subscription limits
      const limits = await getLimitsForTenant(payload.tenantId);
      
      // Get tenant subscription end date
      const tenant = await prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        include: { subscription: true }
      });
      
      const subscriptionEndDate = tenant?.subscription?.endDate 
        ? new Date(tenant.subscription.endDate).toISOString() 
        : null;

      const enrichedPayload = {
        ...payload,
        limits,
        subscriptionEndDate,
      };

      return jwt.sign(enrichedPayload, JWT_SECRET);
    } catch (error) {
      console.error('Error generating enriched token:', error);
      // Fallback to basic token without enrichment
      return jwt.sign(payload, JWT_SECRET);
    }
  }

  verifyToken(token: string): AuthSession | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (!decoded || !decoded.userId) {
        return null;
      }

      // Calculate expiration (1 day from now, or use token's exp if present)
      const expiresAt = decoded.exp 
        ? new Date(decoded.exp * 1000) 
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const subscriptionEndDate = decoded.subscriptionEndDate 
        ? new Date(decoded.subscriptionEndDate) 
        : null;

      return new AuthSession(
        decoded.userId,
        decoded.tenantId || null,
        decoded.role || 'user',
        decoded.staffId || null,
        token,
        expiresAt,
        subscriptionEndDate
      );
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}