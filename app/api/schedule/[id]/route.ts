import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

// PATCH — update score or details
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.COACH)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { homeScore, awayScore, notes, location, title } = body;

  const updated = await db.scheduleItem.update({
    where: { id: params.id },
    data: {
      ...(homeScore !== undefined && { homeScore: parseInt(homeScore) }),
      ...(awayScore !== undefined && { awayScore: parseInt(awayScore) }),
      ...(notes !== undefined && { notes }),
      ...(location !== undefined && { location }),
      ...(title !== undefined && { title }),
    },
    include: {
      rsvps: { include: { athlete: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.COACH)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.scheduleItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
