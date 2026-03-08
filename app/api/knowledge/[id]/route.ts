import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { CAN } from '@/lib/rbac'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const article = await db.knowledgeArticle.findUnique({
    where: { id: params.id, orgId: session.user.orgId },
    include: { author: { select: { name: true } } },
  })

  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment view count
  await db.knowledgeArticle.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  })

  return NextResponse.json(article)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!CAN.editArticle(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const article = await db.knowledgeArticle.update({
    where: { id: params.id, orgId: session.user.orgId },
    data: { ...body, updatedAt: new Date() },
  })

  return NextResponse.json(article)
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

  await db.knowledgeArticle.delete({
    where: { id: params.id, orgId: session.user.orgId },
  })

  return NextResponse.json({ ok: true })
}
