import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const upcoming = searchParams.get('upcoming') === 'true';

  const items = await db.scheduleItem.findMany({
    where: {
      team: { orgId: session.user.orgId },
      ...(teamId ? { teamId } : {}),
      ...(upcoming ? { startAt: { gte: new Date() } } : {}),
    },
    include: {
      rsvps: {
        include: { athlete: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } } },
      },
      team: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'asc' },
    take: upcoming ? 10 : 50,
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !hasRole(session.user.role as Role, Role.COACH)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { teamId, title, type, startAt, endAt, location, notes, opponent } = body;
  if (!teamId || !title || !startAt || !endAt) {
    return NextResponse.json({ error: 'teamId, title, startAt, endAt required' }, { status: 400 });
  }

  const item = await db.scheduleItem.create({
    data: { teamId, title, type: type ?? 'PRACTICE', startAt: new Date(startAt), endAt: new Date(endAt), location, notes, opponent },
  });

  return NextResponse.json(item, { status: 201 });
}
