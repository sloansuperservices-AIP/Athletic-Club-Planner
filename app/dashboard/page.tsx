import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { StatCard } from '@/components/cards/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { computeReadiness, urgencySortScore } from '@/lib/readiness'
import { daysUntil, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  Users,
  Trophy,
  ClipboardList,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CommandCenterPage() {
  const session = await auth()
  if (!session) return null

  const orgId = session.user.orgId

  // Parallel data fetching
  const [
    athleteCount,
    upcomingTournaments,
    pendingChecklistCount,
    openJobSlots,
    recentAnnouncements,
  ] = await Promise.all([
    db.athlete.count({ where: { team: { orgId } } }),
    db.tournament.findMany({
      where: { orgId, startDate: { gte: new Date() } },
      include: {
        teams: {
          include: {
            team: { select: { name: true } },
            checklist: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
    db.checklistItem.count({
      where: {
        status: { in: ['pending', 'in_progress'] },
        teamTournament: { tournament: { orgId } },
      },
    }),
    db.jobSlot.count({
      where: {
        claim: null,
        job: { orgId, isActive: true },
      },
    }),
    db.announcement.findMany({
      where: { orgId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  // Compute readiness for upcoming tournaments
  const tournamentReadiness = await Promise.all(
    upcomingTournaments.map(async (t) => {
      const teamScores = await Promise.all(
        t.teams.map((tt) => computeReadiness(tt.id))
      )
      const avgScore =
        teamScores.length > 0
          ? Math.round(teamScores.reduce((s, r) => s + r.total, 0) / teamScores.length)
          : 0
      const days = daysUntil(t.startDate)
      return { tournament: t, avgScore, days, urgency: urgencySortScore(avgScore, days) }
    })
  )
  tournamentReadiness.sort((a, b) => b.urgency - a.urgency)

  const urgencyBadge = (days: number, score: number) => {
    if (days <= 0) return <Badge variant="secondary">Past</Badge>
    if (days <= 7 && score < 90) return <Badge variant="destructive">Urgent</Badge>
    if (days <= 14 && score < 75) return <Badge variant="orange">At Risk</Badge>
    if (score >= 90) return <Badge variant="success">On Track</Badge>
    return <Badge variant="warning">Monitor</Badge>
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good ${getTimeGreeting()}, ${session.user.name?.split(' ')[0] ?? 'Coach'} 👋`}
        description="Here's what needs your attention today."
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Athletes"
          value={athleteCount}
          subtitle="across all teams"
          icon={Users}
          accentColor="text-sky-400"
        />
        <StatCard
          title="Upcoming Tournaments"
          value={upcomingTournaments.length}
          subtitle="next 90 days"
          icon={Trophy}
          accentColor="text-violet-400"
        />
        <StatCard
          title="Open Checklist Items"
          value={pendingChecklistCount}
          subtitle="need attention"
          icon={ClipboardList}
          accentColor={pendingChecklistCount > 20 ? 'text-red-400' : 'text-yellow-400'}
        />
        <StatCard
          title="Open Job Slots"
          value={openJobSlots}
          subtitle="waiting for volunteers"
          icon={Briefcase}
          accentColor="text-emerald-400"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tournament Urgency Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-violet-400" />
              Tournament HQ — Urgency View
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournamentReadiness.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No upcoming tournaments scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {tournamentReadiness.map(({ tournament, avgScore, days }) => (
                  <Link
                    key={tournament.id}
                    href={`/dashboard/tournaments/${tournament.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-200 truncate">
                          {tournament.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatDate(tournament.startDate)} ·{' '}
                          {days > 0 ? `${days} days away` : 'Past'}
                          {' · '}
                          {tournament.teams.length} team
                          {tournament.teams.length !== 1 ? 's' : ''}
                        </div>
                        {/* Readiness bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${avgScore}%`,
                                backgroundColor:
                                  avgScore >= 90
                                    ? '#10b981'
                                    : avgScore >= 70
                                    ? '#eab308'
                                    : avgScore >= 50
                                    ? '#f97316'
                                    : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">
                            {avgScore}%
                          </span>
                        </div>
                      </div>
                      <div>{urgencyBadge(days, avgScore)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href="/dashboard/tournaments"
              className="block text-center mt-4 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              View all tournaments →
            </Link>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No announcements yet
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-lg bg-slate-800/60 border border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{ann.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          by {ann.author.name} · {formatDate(ann.createdAt)}
                        </div>
                      </div>
                      {ann.isPinned && (
                        <span className="text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/20 shrink-0">
                          Pinned
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/dashboard/comms"
              className="block text-center mt-4 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              View all communications →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/workplay', label: 'Browse Job Board', icon: Briefcase, color: 'text-emerald-400' },
          { href: '/dashboard/teams', label: 'View All Teams', icon: Users, color: 'text-sky-400' },
          { href: '/dashboard/knowledge', label: 'Knowledge Base', icon: ClipboardList, color: 'text-violet-400' },
          { href: '/dashboard/comms', label: 'Send Announcement', icon: Clock, color: 'text-orange-400' },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/60 transition-all cursor-pointer">
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-sm font-medium text-slate-300">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function getTimeGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
