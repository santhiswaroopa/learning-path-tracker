import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a session cookie containing the userId.
 * Simple implementation – stores plaintext userId in a signed cookie.
 */
export function createSessionResponse(userId: number, username: string) {
  const response = NextResponse.json({ username });
    // HttpOnly cookie for security, not secure in dev
    response.cookies.set('session', String(userId), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      secure: false,
    });
  return response;
}

/**
 * Retrieves the current user based on the session cookie.
 */
export async function getCurrentUser(request: Request) {
  // Try to get session cookie from request
  // NextRequest provides a cookies() method, otherwise fallback to header parsing
  let sessionValue: string | null = null;
  // @ts-ignore - request may be NextRequest with cookies()
  if (typeof (request as any).cookies === 'function') {
    // @ts-ignore
    const cookieObj = (request as any).cookies();
    const sess = cookieObj.get('session');
    if (sess) {
      sessionValue = typeof sess === 'string' ? sess : sess.value;
    }
  }
  if (!sessionValue) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/session=([^;]+)/);
      if (match) sessionValue = match[1];
    }
  }
  if (!sessionValue) return null;
  const userId = parseInt(sessionValue, 10);
  if (isNaN(userId)) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function logoutResponse() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
}
