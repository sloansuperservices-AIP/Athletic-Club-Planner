import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { checkDibsEligibility } from '@/lib/dibsRules'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tournamentId = searchParams.get('tournamentId') ?? undefined
  const teamId = searchParams.get('teamId') ?? undefined
  const onlyOpen = searchParams.get('onlyOpen') === 'true'

  const jobs = await db.workPlayJob.findMany({
    where: {
      orgId: session.user.orgId,
      isActive: true,
      ...(tournamentId ? { tournamentId } : {}),
      ...(teamId ? { teamId } : {}),
    },
    include: {
      slots: {
        include: {
          claim: {
            include: {
              user: { select: { name: true, id: true } },
            },
          },
        },
      },
      tournament: { select: { name: true, startDate: true } },
      team: { select: { name: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  // Annotate each job with eligibility for current user
  const enriched = await Promise.all(
    jobs.map(async (job) => {
      const openSlots = job.slots.filter((s) => !s.claim).length
      let eligibility = null
      if (openSlots > 0) {
        eligibility = await checkDibsEligibility(session.user.id, job.id)
      }
      return { ...job, openSlots, eligibility }
    })
  )

  const result = onlyOpen ? enriched.filter((j) => j.openSlots > 0) : enriched
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'COACH', 'TEAM_MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { slotCount = 1, ...data } = body

  const job = await db.workPlayJob.create({
    data: {
      ...data,
      orgId: session.user.orgId,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
      slots: {
        create: Array.from({ length: slotCount }, (_, i) => ({ slotIndex: i + 1 })),
      },
    },
    include: { slots: true },
  })

  return NextResponse.json(job, { status: 201 })
}
