import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';

// GET attendance (RSVP) for a schedule item
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scheduleItemId = searchParams.get('scheduleItemId');
  if (!scheduleItemId) return NextResponse.json({ error: 'scheduleItemId required' }, { status: 400 });

  const rsvps = await db.rsvp.findMany({
    where: { scheduleItemId },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true, jerseyNumber: true, position: true },
      },
    },
    orderBy: { athlete: { lastName: 'asc' } },
  });

  // Count stats
  const stats = {
    yes: rsvps.filter(r => r.status === 'YES').length,
    no: rsvps.filter(r => r.status === 'NO').length,
    maybe: rsvps.filter(r => r.status === 'MAYBE').length,
    pending: rsvps.filter(r => r.status === 'PENDING').length,
    total: rsvps.length,
  };

  return NextResponse.json({ rsvps, stats });
}

// POST — mark attendance (coach marks athletes present/absent)
// or family RSVP
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { scheduleItemId, athleteId, status, note } = body;

  if (!scheduleItemId || !athleteId || !status) {
    return NextResponse.json({ error: 'scheduleItemId, athleteId, status required' }, { status: 400 });
  }

  // Coaches can mark anyone; parents can only mark their own athletes
  if (!hasRole(session.user.role as Role, Role.COACH)) {
    const guardian = await db.guardian.findFirst({
      where: { userId: session.user.id, athleteId },
    });
    if (!guardian) {
      return NextResponse.json({ error: 'Cannot update RSVP for this athlete' }, { status: 403 });
    }
  }

  const rsvp = await db.rsvp.upsert({
    where: { scheduleItemId_athleteId: { scheduleItemId, athleteId } },
    update: { status, note, respondedAt: new Date() },
    create: { scheduleItemId, athleteId, status, note, respondedAt: new Date() },
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
    },
  });

  return NextResponse.json(rsvp);
}
