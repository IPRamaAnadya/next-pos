import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/api/utils/jwt';

const protectedRoutes = ['/api/data', '/api/staff']; 

export async function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  const isProtected = protectedRoutes.some(path => req.nextUrl.pathname.startsWith(path));

  if (isProtected) {
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token as string);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}