import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CAN } from '@/lib/rbac'

const CreateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  targetTeamId: z.string().optional(),
  isPinned: z.boolean().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')

  const announcements = await db.announcement.findMany({
    where: {
      orgId: session.user.orgId,
      ...(teamId ? { OR: [{ targetTeamId: teamId }, { targetTeamId: null }] } : {}),
    },
    include: { author: { select: { name: true } } },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  return NextResponse.json(announcements)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!CAN.sendBulkReminder(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const announcement = await db.announcement.create({
    data: {
      ...parsed.data,
      orgId: session.user.orgId,
      authorId: session.user.id,
      publishedAt: new Date(),
    },
  })

  return NextResponse.json(announcement, { status: 201 })
}
