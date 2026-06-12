import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/api';
import { apiError, apiSuccess } from '@/lib/api';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    role: users.role,
    usdtBalance: users.usdtBalance,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, auth.user.userId)).limit(1);

  if (!user) return apiError('User not found', 404);

  return apiSuccess(user);
}
