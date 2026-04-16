import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Auth check via cookie (set after login)
  const auth = request.cookies.get("edustream_auth");
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  if (pathname.startsWith("/auth")) return NextResponse.next();
  if (pathname.startsWith("/watch")) return NextResponse.next();

  if (!auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
