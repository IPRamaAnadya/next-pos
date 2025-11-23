import { NextRequest } from 'next/server';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return apiResponse.unauthorized('Authorization token is required');
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return apiResponse.unauthorized('Invalid or expired token');
    }

    return apiResponse.success({
      data: {
        decoded,
        message: 'Token is valid',
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...'
      },
      message: 'Authentication test successful'
    });
  } catch (error: any) {
    console.error('Auth test error:', error);
    return apiResponse.internalError();
  }
}