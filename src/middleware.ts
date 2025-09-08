import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  return res;
}

// Apply hanya ke API routes
export const config = {
  matcher: ["/api/:path*"],
};
