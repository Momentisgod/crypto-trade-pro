import { NextRequest } from 'next/server';
import { requireAdmin, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { users, orders, deposits, withdrawals } from '@/db/schema';
import { eq, count, sum, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const [userCount] = await db.select({ count: count() }).from(users);
  const [orderCount] = await db.select({ count: count() }).from(orders);
  const [totalVolume] = await db.select({ total: sum(orders.total) }).from(orders);
  const [pendingDeposits] = await db.select({ count: count() }).from(deposits)
    .where(eq(deposits.status, 'pending'));
  const [pendingWithdrawals] = await db.select({ count: count() }).from(withdrawals)
    .where(eq(withdrawals.status, 'pending'));
  const [approvedDepositsTotal] = await db.select({ total: sum(deposits.amountApproved) }).from(deposits)
    .where(eq(deposits.status, 'approved'));

  const recentUsers = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    usdtBalance: users.usdtBalance,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(5);

  return apiSuccess({
    totalUsers: userCount.count,
    totalOrders: orderCount.count,
    totalVolume: totalVolume.total ?? 0,
    pendingDeposits: pendingDeposits.count,
    pendingWithdrawals: pendingWithdrawals.count,
    approvedDepositsTotal: approvedDepositsTotal.total ?? 0,
    recentUsers,
  });
}
