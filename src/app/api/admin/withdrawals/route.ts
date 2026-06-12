import { NextRequest } from 'next/server';
import { requireAdmin, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { withdrawals, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  const results = await db.select({
    id: withdrawals.id,
    userId: withdrawals.userId,
    amount: withdrawals.amount,
    network: withdrawals.network,
    walletAddress: withdrawals.walletAddress,
    status: withdrawals.status,
    txHash: withdrawals.txHash,
    adminNote: withdrawals.adminNote,
    reviewedAt: withdrawals.reviewedAt,
    createdAt: withdrawals.createdAt,
    username: users.username,
    email: users.email,
  }).from(withdrawals)
    .leftJoin(users, eq(withdrawals.userId, users.id))
    .orderBy(desc(withdrawals.createdAt));

  const filtered = status && status !== 'all'
    ? results.filter(w => w.status === status)
    : results;

  return apiSuccess(filtered);
}
