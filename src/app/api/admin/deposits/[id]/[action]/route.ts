import { NextRequest } from 'next/server';
import { requireAdmin, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { deposits, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const { id, action } = await params;

  const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id)).limit(1);
  if (!deposit) return apiError('Deposit not found', 404);
  if (deposit.status !== 'pending') return apiError('Deposit already processed');

  const body = await req.json();

  if (action === 'approve') {
    const amountApproved = body.amountApproved ?? deposit.amountClaimed;
    const adminNote = body.adminNote ?? null;

    // Credit user balance
    const [user] = await db.select().from(users).where(eq(users.id, deposit.userId)).limit(1);
    if (!user) return apiError('User not found', 404);

    await db.update(users)
      .set({ usdtBalance: user.usdtBalance + amountApproved })
      .where(eq(users.id, user.id));

    await db.update(deposits).set({
      status: 'approved',
      amountApproved,
      adminNote,
      reviewedBy: auth.user.userId,
      reviewedAt: new Date(),
    }).where(eq(deposits.id, id));

    return apiSuccess({ message: `Deposit approved. ${amountApproved} USDT credited to user.` });

  } else if (action === 'cancel') {
    const adminNote = body.adminNote;
    if (!adminNote) return apiError('Rejection reason is required');

    await db.update(deposits).set({
      status: 'cancelled',
      adminNote,
      reviewedBy: auth.user.userId,
      reviewedAt: new Date(),
    }).where(eq(deposits.id, id));

    return apiSuccess({ message: 'Deposit request cancelled.' });

  } else {
    return apiError('Invalid action. Use approve or cancel.', 400);
  }
}
