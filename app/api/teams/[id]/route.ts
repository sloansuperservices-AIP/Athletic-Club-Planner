import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateRoster } from '@/lib/rosterValidation'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const team = await db.team.findUnique({
    where: { id: params.id, orgId: session.user.orgId },
    include: {
      athletes: {
        include: {
          user: { select: { name: true, email: true, image: true } },
          guardians: {
            include: { user: { select: { name: true, email: true } } },
          },
          stats: { orderBy: { recordedAt: 'desc' }, take: 6 },
        },
      },
      members: {
        include: { user: { select: { name: true, role: true, image: true } } },
      },
      tournaments: {
        include: {
          tournament: true,
          checklist: true,
        },
        orderBy: { tournament: { startDate: 'asc' } },
      },
      scheduleItems: {
        where: { startAt: { gte: new Date() } },
        orderBy: { startAt: 'asc' },
        take: 10,
      },
    },
  })

  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const validation = await validateRoster(params.id)

  return NextResponse.json({ ...team, rosterValidation: validation })
}
