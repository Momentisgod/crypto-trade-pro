import { NextRequest } from 'next/server';
import { requireAdmin, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    role: users.role,
    usdtBalance: users.usdtBalance,
    isActive: users.isActive,
    createdAt: users.createdAt,
    lastLoginAt: users.lastLoginAt,
  }).from(users).orderBy(desc(users.createdAt));

  return apiSuccess(allUsers);
}

const updateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
  usdtBalance: z.number().min(0).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const url = new URL(req.url);
  const userId = url.searchParams.get('id');
  if (!userId) return apiError('User ID required');

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input');

  await db.update(users).set(parsed.data).where(eq(users.id, userId));

  return apiSuccess({ message: 'User updated successfully' });
}
