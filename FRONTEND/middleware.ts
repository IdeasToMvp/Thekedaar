import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("returnTo", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/feed", "/feed/:path*"],
};
