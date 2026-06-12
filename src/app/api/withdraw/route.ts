import { NextRequest } from 'next/server';
import { requireAuth, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { withdrawals, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is 10 USDT'),
  network: z.enum(['TRC20', 'ERC20', 'BEP20']),
  walletAddress: z.string().min(10),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const history = await db.select().from(withdrawals)
    .where(eq(withdrawals.userId, auth.user.userId))
    .orderBy(desc(withdrawals.createdAt));

  return apiSuccess(history);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { amount, network, walletAddress } = parsed.data;

    // Check user balance
    const [user] = await db.select().from(users).where(eq(users.id, auth.user.userId)).limit(1);
    if (!user) return apiError('User not found', 404);

    if (user.usdtBalance < amount) {
      return apiError(`Insufficient balance. Available: ${user.usdtBalance.toFixed(2)} USDT`);
    }

    // Deduct balance immediately (hold it)
    await db.update(users)
      .set({ usdtBalance: user.usdtBalance - amount })
      .where(eq(users.id, user.id));

    const withdrawalId = uuidv4();
    await db.insert(withdrawals).values({
      id: withdrawalId,
      userId: user.id,
      amount,
      network,
      walletAddress,
      status: 'pending',
      createdAt: new Date(),
    });

    return apiSuccess({ withdrawalId, message: 'Withdrawal request submitted. Admin will process within 24 hours.' }, 201);
  } catch (err) {
    console.error('Withdrawal error:', err);
    return apiError('Internal server error', 500);
  }
}
