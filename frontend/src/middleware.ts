import { NextRequest, NextResponse } from "next/server";

const AUTH_PATHS = ["/login", "/register"];
const OPEN_PATHS = ["/landing"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const dpToken = request.cookies.get("dp_token")?.value;
  const isAuthenticated = Boolean(dpToken);

  const isAuthPath = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isOpenPath = OPEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Open paths are accessible to everyone — no redirect
  if (isOpenPath) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages (login/register)
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!isAuthenticated && !isAuthPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
