import { NextRequest } from 'next/server';
import { requireAdmin, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { orders, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const results = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      symbol: orders.symbol,
      side: orders.side,
      type: orders.type,
      quantity: orders.quantity,
      price: orders.price,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      username: users.username,
      email: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));

  return apiSuccess(results);
}
