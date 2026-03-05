import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CAN } from '@/lib/rbac'

const CreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().default('general'),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q')
  const category = searchParams.get('category')

  const articles = await db.knowledgeArticle.findMany({
    where: {
      orgId: session.user.orgId,
      isPublished: CAN.editArticle(session.user.role) ? undefined : true,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
              { tags: { has: search.toLowerCase() } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
    },
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(articles)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!CAN.publishArticle(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const article = await db.knowledgeArticle.create({
    data: {
      ...parsed.data,
      orgId: session.user.orgId,
      authorId: session.user.id,
    },
  })

  return NextResponse.json(article, { status: 201 })
}
