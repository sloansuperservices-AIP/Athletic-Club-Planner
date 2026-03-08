import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/shared/PageHeader'
import { KnowledgeList } from '@/components/knowledge/KnowledgeList'
import { CAN } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function KnowledgePage() {
  const session = await auth()
  if (!session) return null

  const articles = await db.knowledgeArticle.findMany({
    where: {
      orgId: session.user.orgId,
      isPublished: CAN.editArticle(session.user.role) ? undefined : true,
    },
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const categories = [...new Set(articles.map((a) => a.category))]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Knowledge Base"
        description="Club policies, logistics, training guides, and FAQs"
      />
      <KnowledgeList
        articles={articles.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          category: a.category,
          tags: a.tags,
          isPublished: a.isPublished,
          viewCount: a.viewCount,
          updatedAt: a.updatedAt.toISOString(),
          author: { name: a.author.name },
        }))}
        categories={categories}
        canEdit={CAN.editArticle(session.user.role)}
      />
    </div>
  )
}
