import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/api/utils/jwt';

interface ValidateTenantAuthResult {
  success: boolean;
  tenantId?: string;
  response: NextResponse;
}

export const validateTenantAuth = (
  request: NextRequest,
  tenantIdFromUrl: string,
  requireRole?: string[] // optional list of allowed roles
): ValidateTenantAuthResult => {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const decoded: any = verifyToken(token);
  if (!decoded || !decoded.tenantId) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    };
  }

  if (decoded.tenantId !== tenantIdFromUrl) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized: Tenant ID mismatch' }, { status: 403 }),
    };
  }

  if (requireRole && Array.isArray(requireRole) && !requireRole.includes(decoded.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Forbidden: Insufficient role permission' },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    tenantId: decoded.tenantId as string,
    response: NextResponse.json(
        { error: 'My Brain is Error' },
        { status: 500 }
      ),
  };
};
