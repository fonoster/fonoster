import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // const isAuthenticated = request.cookies.has('auth-token')
  const isAuthenticated = true

  // Actualizar las rutas públicas para manejar correctamente la ruta dinámica
  const isPublicRoute = 
    pathname === '/signin' || 
    pathname === '/signup' || 
    pathname === '/forgot-password' || 
    pathname === '/signup/verify' || 
    pathname.startsWith('/forgot-password/') // Esto permitirá cualquier token

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/workspace/1/overview', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 