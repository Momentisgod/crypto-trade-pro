import { NextRequest } from 'next/server';
import { requireAdmin, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { withdrawals, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const { id, action } = await params;

  const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
  if (!withdrawal) return apiError('Withdrawal not found', 404);
  if (withdrawal.status !== 'pending') return apiError('Withdrawal already processed');

  const body = await req.json();

  if (action === 'process') {
    const txHash = body.txHash;
    const adminNote = body.adminNote ?? null;
    if (!txHash) return apiError('Transaction hash is required');

    await db.update(withdrawals).set({
      status: 'processed',
      txHash,
      adminNote,
      reviewedBy: auth.user.userId,
      reviewedAt: new Date(),
    }).where(eq(withdrawals.id, id));

    return apiSuccess({ message: 'Withdrawal marked as processed.' });

  } else if (action === 'cancel') {
    const adminNote = body.adminNote;
    if (!adminNote) return apiError('Cancellation reason is required');

    // Refund the balance
    const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
    if (user) {
      await db.update(users)
        .set({ usdtBalance: user.usdtBalance + withdrawal.amount })
        .where(eq(users.id, user.id));
    }

    await db.update(withdrawals).set({
      status: 'cancelled',
      adminNote,
      reviewedBy: auth.user.userId,
      reviewedAt: new Date(),
    }).where(eq(withdrawals.id, id));

    return apiSuccess({ message: 'Withdrawal cancelled. Balance refunded to user.' });

  } else {
    return apiError('Invalid action. Use process or cancel.', 400);
  }
}
