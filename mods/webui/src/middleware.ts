import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { tokenUtils } from '@/common/utils/tokenUtils'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get('refreshToken')?.value || null;
  const isAuthenticated = refreshToken && !tokenUtils.isTokenExpired(refreshToken);
  // const isAuthenticated = true;


  const publicRoutes = [
    '/signin',
    '/signup',
    '/forgot-password',
    '/signup/verify'
  ];

  const isPublicRoute = publicRoutes.includes(pathname) || 
    pathname.startsWith('/forgot-password/');

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/workspace/list', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}   