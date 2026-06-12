import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'crypto-trade-pro-super-secret-key-change-in-production'
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET || 'crypto-trade-pro-refresh-secret-key-change-in-production'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const payload = await verifyAccessToken(token);
    if (!payload) return null;

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!user || !user.isActive) return null;

    return user;
  } catch {
    return null;
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = `HttpOnly; Path=/; SameSite=Strict${isProduction ? '; Secure' : ''}`;
  res.headers.append('Set-Cookie', `access_token=${accessToken}; Max-Age=900; ${cookieOptions}`);
  res.headers.append('Set-Cookie', `refresh_token=${refreshToken}; Max-Age=604800; ${cookieOptions}`);
}

export function clearAuthCookies(res: Response) {
  res.headers.append('Set-Cookie', 'access_token=; Max-Age=0; HttpOnly; Path=/; SameSite=Strict');
  res.headers.append('Set-Cookie', 'refresh_token=; Max-Age=0; HttpOnly; Path=/; SameSite=Strict');
}
