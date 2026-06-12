import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { migrate } from '@/db/migrate';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
});

let migrated = false;

export async function POST(req: NextRequest) {
  if (!migrated) {
    await migrate();
    migrated = true;
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { email, username, password } = parsed.data;

    // Check existing
    const existing = await db.select().from(users)
      .where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return apiError('Email already registered', 409);
    }

    const existingUsername = await db.select().from(users)
      .where(eq(users.username, username)).limit(1);
    if (existingUsername.length > 0) {
      return apiError('Username already taken', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const now = new Date();

    await db.insert(users).values({
      id: userId,
      email,
      username,
      passwordHash,
      role: 'user',
      usdtBalance: 0,
      isActive: true,
      createdAt: now,
      lastLoginAt: now,
    });

    const payload = { userId, email, role: 'user' as const };
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    const response = apiSuccess({ message: 'Account created successfully', username }, 201);
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error('Register error:', err);
    return apiError('Internal server error', 500);
  }
}
