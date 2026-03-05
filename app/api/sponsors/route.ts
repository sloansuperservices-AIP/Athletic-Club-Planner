import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const sponsors = await db.sponsor.findMany({
    where: {
      orgId: session.user.orgId,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      deliverables: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(sponsors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.COACH)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, contactName, contactEmail, contactPhone, tierName, amount, logoUrl, notes } = body;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const sponsor = await db.sponsor.create({
    data: {
      orgId: session.user.orgId,
      name,
      contactName,
      contactEmail,
      contactPhone,
      tierName,
      amount: amount ? parseFloat(amount) : null,
      logoUrl,
      notes,
      status: 'PROSPECT',
    },
  });

  return NextResponse.json(sponsor, { status: 201 });
}
