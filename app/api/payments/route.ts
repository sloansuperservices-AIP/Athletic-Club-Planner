import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

// Payment tracking — stored as ledger-style audit entries
// We track: who paid, what for, how much, date
// (No actual payment processing — integrates with Stripe/Square externally)

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.COACH)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Return credit ledger entries used as a payment proxy
  // plus aggregate stats per user
  const entries = await db.creditLedgerEntry.findMany({
    where: { user: { orgId: session.user.orgId } },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Summarize per user
  const byUser: Record<string, { name: string; email: string; total: number; entries: number }> = {};
  for (const e of entries) {
    if (!e.user) continue;
    if (!byUser[e.userId]) {
      byUser[e.userId] = { name: e.user.name ?? '', email: e.user.email ?? '', total: 0, entries: 0 };
    }
    byUser[e.userId].total += e.amount;
    byUser[e.userId].entries += 1;
  }

  return NextResponse.json({
    entries,
    summary: Object.entries(byUser)
      .map(([userId, d]) => ({ userId, ...d }))
      .sort((a, b) => b.total - a.total),
  });
}
