import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.COACH)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, contactName, contactEmail, contactPhone, tierName, amount, logoUrl, notes, status } = body;

  const sponsor = await db.sponsor.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(contactName !== undefined && { contactName }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(tierName !== undefined && { tierName }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status }),
    },
    include: { deliverables: true },
  });

  return NextResponse.json(sponsor);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.ADMIN)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.sponsor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
