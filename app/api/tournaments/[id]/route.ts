import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { computeReadiness } from '@/lib/readiness'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tournament = await db.tournament.findUnique({
    where: { id: params.id, orgId: session.user.orgId },
    include: {
      teams: {
        include: {
          team: {
            include: {
              athletes: {
                include: { user: { select: { name: true } } },
              },
            },
          },
          checklist: {
            include: {
              auditTrail: {
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 3,
              },
            },
          },
        },
      },
      jobs: {
        include: {
          slots: { include: { claim: { include: { user: { select: { name: true } } } } } },
        },
      },
    },
  })

  if (!tournament) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Compute readiness per team
  const enrichedTeams = await Promise.all(
    tournament.teams.map(async (tt) => ({
      ...tt,
      readiness: await computeReadiness(tt.id),
    }))
  )

  return NextResponse.json({ ...tournament, teams: enrichedTeams })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const tournament = await db.tournament.update({
    where: { id: params.id, orgId: session.user.orgId },
    data: {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    },
  })

  return NextResponse.json(tournament)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.tournament.delete({ where: { id: params.id, orgId: session.user.orgId } })
  return NextResponse.json({ ok: true })
}
