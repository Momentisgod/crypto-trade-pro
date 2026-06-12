import { NextRequest } from 'next/server';
import { requireAdmin, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { walletConfig } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const configs = await db.select().from(walletConfig);
  return apiSuccess(configs);
}

const updateSchema = z.object({
  network: z.enum(['TRC20', 'ERC20', 'BEP20']),
  address: z.string().min(10),
  isActive: z.boolean(),
});

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('status' in auth) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid input');

  const { network, address, isActive } = parsed.data;

  const existing = await db.select().from(walletConfig).where(eq(walletConfig.network, network)).limit(1);

  if (existing.length > 0) {
    await db.update(walletConfig)
      .set({ address, isActive, updatedAt: new Date(), updatedBy: auth.user.userId })
      .where(eq(walletConfig.network, network));
  } else {
    await db.insert(walletConfig).values({
      id: uuidv4(),
      network,
      address,
      isActive,
      updatedAt: new Date(),
      updatedBy: auth.user.userId,
    });
  }

  return apiSuccess({ message: 'Wallet config updated' });
}
