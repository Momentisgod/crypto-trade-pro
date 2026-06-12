import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api';
import { apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { orders, portfolio, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const orderSchema = z.object({
  symbol: z.string().min(3),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit']).default('market'),
  quantity: z.number().positive(),
  price: z.number().positive(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const userOrders = await db.select().from(orders)
    .where(eq(orders.userId, auth.user.userId))
    .orderBy(orders.createdAt);

  return apiSuccess(userOrders);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { symbol, side, type, quantity, price } = parsed.data;
    const total = quantity * price;

    // Get user balance
    const [user] = await db.select().from(users).where(eq(users.id, auth.user.userId)).limit(1);
    if (!user) return apiError('User not found', 404);

    const baseAsset = symbol.replace('USDT', '');

    if (side === 'buy') {
      if (user.usdtBalance < total) {
        return apiError(`Insufficient USDT balance. Required: ${total.toFixed(2)}, Available: ${user.usdtBalance.toFixed(2)}`);
      }

      // Deduct USDT
      await db.update(users)
        .set({ usdtBalance: user.usdtBalance - total })
        .where(eq(users.id, user.id));

      // Update portfolio
      const [existing] = await db.select().from(portfolio)
        .where(and(eq(portfolio.userId, user.id), eq(portfolio.symbol, baseAsset)))
        .limit(1);

      if (existing) {
        const newQty = existing.quantity + quantity;
        const newAvg = (existing.quantity * existing.avgBuy + quantity * price) / newQty;
        await db.update(portfolio)
          .set({ quantity: newQty, avgBuy: newAvg })
          .where(eq(portfolio.id, existing.id));
      } else {
        await db.insert(portfolio).values({
          id: uuidv4(),
          userId: user.id,
          symbol: baseAsset,
          quantity,
          avgBuy: price,
        });
      }
    } else {
      // Sell - check portfolio
      const [holding] = await db.select().from(portfolio)
        .where(and(eq(portfolio.userId, user.id), eq(portfolio.symbol, baseAsset)))
        .limit(1);

      if (!holding || holding.quantity < quantity) {
        return apiError(`Insufficient ${baseAsset} balance`);
      }

      const newQty = holding.quantity - quantity;
      await db.update(portfolio)
        .set({ quantity: newQty })
        .where(eq(portfolio.id, holding.id));

      // Add USDT
      await db.update(users)
        .set({ usdtBalance: user.usdtBalance + total })
        .where(eq(users.id, user.id));
    }

    // Record order
    const orderId = uuidv4();
    await db.insert(orders).values({
      id: orderId,
      userId: user.id,
      symbol,
      side,
      type,
      quantity,
      price,
      total,
      status: 'filled',
      createdAt: new Date(),
    });

    return apiSuccess({ orderId, message: 'Order executed successfully' }, 201);
  } catch (err) {
    console.error('Order error:', err);
    return apiError('Internal server error', 500);
  }
}
