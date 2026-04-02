import jwt from 'jsonwebtoken';
import type { OwnerTokenPayload, StaffTokenPayload } from '@/v3/modules/auth/auth.type';

const JWT_SECRET = process.env.JWT_SECRET!;

export type AuthTokenPayload = OwnerTokenPayload | StaffTokenPayload;

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function extractFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
