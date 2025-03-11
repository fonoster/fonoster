import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tokenUtils } from "@/common/utils/tokenUtils";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("refreshToken")?.value || null;
  const accessToken = request.cookies.get("accessToken")?.value || null;
  const idToken = request.cookies.get("idToken")?.value || null;

  const isAuthenticated =
    refreshToken && !tokenUtils.isTokenExpired(refreshToken);

  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isAuthenticated) {
    if (idToken) {
      const decodedToken = tokenUtils.decodeToken(idToken);
      if (
        decodedToken &&
        !decodedToken.emailVerified &&
        pathname !== "/signup/verify"
      ) {
        return NextResponse.redirect(new URL("/signup/verify", request.url));
      }
      if (
        decodedToken &&
        !decodedToken.phoneNumberVerified &&
        pathname !== "/signup/verify"
      ) {
        return NextResponse.redirect(new URL("/signup/verify", request.url));
      }
    }
  }

  const publicRoutes = [
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/oauth/callback"
  ];

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
