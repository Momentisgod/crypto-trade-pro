import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { migrate } from '@/db/migrate';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

let migrated = false;

export async function POST(req: NextRequest) {
  if (!migrated) {
    await migrate();
    migrated = true;
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Invalid email or password');
    }

    const { email, password } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return apiError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      return apiError('Your account has been suspended. Please contact support.', 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return apiError('Invalid email or password', 401);
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const payload = { userId: user.id, email: user.email, role: user.role as 'user' | 'admin' };
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    const response = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        usdtBalance: user.usdtBalance,
      }
    });
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error('Login error:', err);
    return apiError('Internal server error', 500);
  }
}
