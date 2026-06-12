import { NextRequest } from 'next/server';
import { requireAdmin, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { deposits, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = db.select({
    id: deposits.id,
    userId: deposits.userId,
    amountClaimed: deposits.amountClaimed,
    amountApproved: deposits.amountApproved,
    network: deposits.network,
    screenshotPath: deposits.screenshotPath,
    txNote: deposits.txNote,
    status: deposits.status,
    adminNote: deposits.adminNote,
    reviewedAt: deposits.reviewedAt,
    createdAt: deposits.createdAt,
    username: users.username,
    email: users.email,
  }).from(deposits)
    .leftJoin(users, eq(deposits.userId, users.id))
    .orderBy(desc(deposits.createdAt));

  const results = await query;
  const filtered = status && status !== 'all'
    ? results.filter(d => d.status === status)
    : results;

  return apiSuccess(filtered);
}
