import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CAN } from '@/lib/rbac'
import { computeReadiness } from '@/lib/readiness'
import { daysUntil } from '@/lib/utils'

const CHECKLIST_COLUMNS = ['registration', 'hotel', 'rideshare', 'sponsor', 'roster', 'calendar', 'workplay']

const CreateSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  sanctioningBody: z.string().optional(),
  entryFee: z.number().optional(),
  notes: z.string().optional(),
  registrationDeadline: z.string().datetime().optional(),
  rosterDeadline: z.string().datetime().optional(),
  teamIds: z.array(z.string()).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tournaments = await db.tournament.findMany({
    where: { orgId: session.user.orgId },
    include: {
      teams: {
        include: {
          team: { select: { id: true, name: true, ageGroup: true } },
          checklist: true,
        },
      },
    },
    orderBy: { startDate: 'asc' },
  })

  // Compute readiness for each tournament
  const enriched = await Promise.all(
    tournaments.map(async (t) => {
      const teamReadiness = await Promise.all(
        t.teams.map(async (tt) => {
          const r = await computeReadiness(tt.id)
          return { ...tt, readiness: r }
        })
      )
      const avgReadiness =
        teamReadiness.length > 0
          ? Math.round(
              teamReadiness.reduce((s, tt) => s + tt.readiness.total, 0) /
                teamReadiness.length
            )
          : 0

      return {
        ...t,
        teams: teamReadiness,
        avgReadiness,
        daysUntil: daysUntil(t.startDate),
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!CAN.manageTournaments(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { teamIds, ...data } = parsed.data

  const tournament = await db.tournament.create({
    data: {
      ...data,
      orgId: session.user.orgId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      registrationDeadline: data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : undefined,
      rosterDeadline: data.rosterDeadline ? new Date(data.rosterDeadline) : undefined,
    },
  })

  // Attach teams + seed checklist items
  if (teamIds && teamIds.length > 0) {
    for (const teamId of teamIds) {
      const tt = await db.teamTournament.create({
        data: { teamId, tournamentId: tournament.id },
      })
      await db.checklistItem.createMany({
        data: CHECKLIST_COLUMNS.map((col) => ({
          teamTournamentId: tt.id,
          column: col,
          status: 'pending',
        })),
      })
    }
  }

  return NextResponse.json(tournament, { status: 201 })
}
