import { NextRequest } from 'next/server';
import { requireAuth, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { deposits } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const history = await db.select().from(deposits)
    .where(eq(deposits.userId, auth.user.userId))
    .orderBy(desc(deposits.createdAt));

  return apiSuccess(history);
}
