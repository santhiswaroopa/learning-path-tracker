// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  // Allow unauthenticated access to login and register pages
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register')
  ) {
    return NextResponse.next();
  }
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/topics/:path*',
    '/notes/:path*',
    '/api/dashboard/:path*',
    '/api/topics/:path*',
    '/api/notes/:path*',
    '/api/subtopics/:path*'
  ]
};
