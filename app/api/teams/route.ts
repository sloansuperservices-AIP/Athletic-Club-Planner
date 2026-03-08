import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teams = await db.team.findMany({
    where: { orgId: session.user.orgId },
    include: {
      athletes: {
        include: { user: { select: { name: true, image: true } } },
      },
      members: {
        include: { user: { select: { name: true, role: true } } },
        where: { role: 'COACH' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(teams)
}
