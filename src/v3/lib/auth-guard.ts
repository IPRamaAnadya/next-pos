import { NextRequest, NextResponse } from 'next/server';
import { extractFromHeader, verifyToken, type AuthTokenPayload } from './jwt';
import { apiResponse, ErrorType } from './response';

export function verifyAuth(request: NextRequest): AuthTokenPayload {
  const token = extractFromHeader(request.headers.get('authorization'));
  if (!token) {
    throw new AuthError('Missing authorization token', 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new AuthError('Invalid or expired token', 401);
  }

  return payload;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    if (error.statusCode === 403) return apiResponse.forbidden(error.message);
    if (error.statusCode === 404) return apiResponse.notFound(error.message);
    return apiResponse.unauthorized(error.message);
  }
  if (error instanceof Error) {
    return apiResponse({ error: ErrorType.VALIDATION_ERROR, message: error.message });
  }
  return apiResponse.internalError();
}
