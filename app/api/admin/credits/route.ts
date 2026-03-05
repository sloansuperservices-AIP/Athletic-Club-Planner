import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

// Admin manual credit adjustment
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { userId, amount, reason } = body;
  if (!userId || amount === undefined) {
    return NextResponse.json({ error: 'userId and amount required' }, { status: 400 });
  }

  const entry = await db.creditLedgerEntry.create({
    data: {
      userId,
      amount: parseFloat(amount),
      reason: reason ?? 'Admin adjustment',
      adminGrantedById: session.user.id,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
