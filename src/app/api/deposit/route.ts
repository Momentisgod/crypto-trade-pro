import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, apiError, apiSuccess } from '@/lib/api';
import { db } from '@/db';
import { deposits, walletConfig, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  // Get active wallet configs
  const configs = await db.select().from(walletConfig).where(eq(walletConfig.isActive, true));

  return apiSuccess(configs);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const formData = await req.formData();
    const amountClaimed = parseFloat(formData.get('amountClaimed') as string);
    const network = formData.get('network') as string;
    const txNote = formData.get('txNote') as string || null;
    const file = formData.get('screenshot') as File;

    if (!amountClaimed || amountClaimed < 10) {
      return apiError('Minimum deposit amount is 10 USDT');
    }

    if (!['TRC20', 'ERC20', 'BEP20'].includes(network)) {
      return apiError('Invalid network');
    }

    if (!file) {
      return apiError('Screenshot is required');
    }

    if (file.size > 10 * 1024 * 1024) {
      return apiError('Screenshot must be under 10MB');
    }

    // Save screenshot
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'deposits');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(bytes));

    const depositId = uuidv4();
    await db.insert(deposits).values({
      id: depositId,
      userId: auth.user.userId,
      amountClaimed,
      network: network as 'TRC20' | 'ERC20' | 'BEP20',
      screenshotPath: `/uploads/deposits/${filename}`,
      txNote,
      status: 'pending',
      createdAt: new Date(),
    });

    return apiSuccess({ depositId, message: 'Deposit request submitted. Pending admin review.' }, 201);
  } catch (err) {
    console.error('Deposit submit error:', err);
    return apiError('Internal server error', 500);
  }
}
