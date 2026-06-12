import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api';
import { apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { portfolio, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const [user] = await db.select({
    usdtBalance: users.usdtBalance,
  }).from(users).where(eq(users.id, auth.user.userId)).limit(1);

  const holdings = await db.select().from(portfolio)
    .where(eq(portfolio.userId, auth.user.userId));

  return apiSuccess({
    usdtBalance: user?.usdtBalance ?? 0,
    holdings: holdings.filter(h => h.quantity > 0.000001),
  });
}
