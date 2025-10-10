import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// lightweight JWT payload decoder for edge runtime (no signature verification)
function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const str = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    // decode percent-encoded UTF-8
    const json = decodeURIComponent(Array.prototype.map.call(str, (c: any) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowedOrigin = "https://pos.mapunia.com";

  // Buat response kosong
  const res = NextResponse.next();

  // Tambahkan CORS headers
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (origin === allowedOrigin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: res.headers,
    });
  }

  // Protect frontend /dashboard routes: only allow ADMIN or SUPERADMIN
  const pathname = req.nextUrl.pathname;
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    // Try to get token from Authorization header or cookie named 'token'
    const authHeader = req.headers.get('authorization') || '';
    const cookieToken = req.cookies.get ? req.cookies.get('token')?.value : undefined;
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : (cookieToken || null);

    if (!token) {
      // redirect to admin login
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    const decoded = decodeJwtPayload(token) as any | null;
    if (!decoded) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = decoded?.role as string | undefined;
    if (!role || (role !== 'SUPERADMIN' && role !== 'ADMIN')) {
      // forbidden
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return res;
}

// Apply middleware to API routes and dashboard
export const config = {
  matcher: ["/api/:path*", "/dashboard", "/dashboard/:path*"],
};
