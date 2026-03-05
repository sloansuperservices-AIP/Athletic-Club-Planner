import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/shared/PageHeader'
import { JobBoard } from '@/components/workplay/JobBoard'
import { CreditLeaderboard } from '@/components/workplay/CreditLeaderboard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getCreditLeaderboard } from '@/lib/dibsRules'
import { checkDibsEligibility } from '@/lib/dibsRules'
import { Briefcase, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkPlayPage() {
  const session = await auth()
  if (!session) return null

  const jobs = await db.workPlayJob.findMany({
    where: { orgId: session.user.orgId, isActive: true },
    include: {
      slots: {
        include: {
          claim: {
            include: { user: { select: { name: true, id: true } } },
          },
        },
      },
      tournament: { select: { name: true, startDate: true } },
      team: { select: { name: true } },
    },
    orderBy: { startAt: 'asc' },
  })

  // Annotate each job with eligibility for current user
  const enrichedJobs = await Promise.all(
    jobs.map(async (job) => {
      const openSlots = job.slots.filter((s) => !s.claim).length
      const eligibility = openSlots > 0
        ? await checkDibsEligibility(session.user.id, job.id)
        : { eligible: false, reason: 'No open slots' }
      return { ...job, openSlots, eligibility }
    })
  )

  const leaderboard = await getCreditLeaderboard(session.user.orgId)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="WorkPlay & DIBs"
        description="Volunteer job board — claim slots, earn credits, support the club"
      />

      <Tabs defaultValue="jobs">
        <TabsList className="mb-6">
          <TabsTrigger value="jobs">
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            Job Board
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="h-3.5 w-3.5 mr-1.5" />
            Credit Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <JobBoard
            jobs={enrichedJobs}
            currentUserId={session.user.id}
            userRole={session.user.role}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <CreditLeaderboard entries={leaderboard} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
