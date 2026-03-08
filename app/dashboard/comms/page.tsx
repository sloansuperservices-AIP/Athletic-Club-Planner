import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/shared/PageHeader'
import { CommsPanel } from '@/components/comms/CommsPanel'
import { CAN } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function CommsPage() {
  const session = await auth()
  if (!session) return null

  const announcements = await db.announcement.findMany({
    where: { orgId: session.user.orgId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const teams = await db.team.findMany({
    where: { orgId: session.user.orgId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Communications"
        description="Announcements and team-wide messaging"
      />
      <CommsPanel
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          isPinned: a.isPinned,
          createdAt: a.createdAt.toISOString(),
          author: { name: a.author.name },
          targetTeamId: a.targetTeamId,
        }))}
        teams={teams}
        canPost={CAN.sendBulkReminder(session.user.role)}
      />
    </div>
  )
}
