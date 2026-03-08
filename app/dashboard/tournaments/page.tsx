import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Trophy, MapPin, Calendar, Users, ChevronRight, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getTournaments(orgId: string) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/tournaments`,
    { cache: 'no-store', headers: { Cookie: '' } }
  )
  if (!res.ok) return []
  return res.json()
}

// Server component — fetch directly from DB for reliability
import { db } from '@/lib/db'
import { computeReadiness } from '@/lib/readiness'
import { daysUntil } from '@/lib/utils'

export default async function TournamentsPage() {
  const session = await auth()
  if (!session) return null

  const tournaments = await db.tournament.findMany({
    where: { orgId: session.user.orgId },
    include: {
      teams: { include: { checklist: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  const enriched = await Promise.all(
    tournaments.map(async (t) => {
      const teamScores = await Promise.all(t.teams.map((tt) => computeReadiness(tt.id)))
      const avg =
        teamScores.length > 0
          ? Math.round(teamScores.reduce((s, r) => s + r.total, 0) / teamScores.length)
          : 0
      return { ...t, avgReadiness: avg, days: daysUntil(t.startDate) }
    })
  )

  const upcoming = enriched.filter((t) => t.days > 0)
  const past = enriched.filter((t) => t.days <= 0)

  const urgencyBadge = (days: number, score: number) => {
    if (days <= 0) return <Badge variant="secondary">Past</Badge>
    if (days <= 7 && score < 90) return <Badge variant="destructive">Urgent</Badge>
    if (days <= 14 && score < 75) return <Badge variant="orange">At Risk</Badge>
    if (score >= 90) return <Badge variant="success">Ready</Badge>
    return <Badge variant="warning">In Progress</Badge>
  }

  const TournamentCard = ({
    t,
  }: {
    t: (typeof enriched)[0]
  }) => (
    <Link href={`/dashboard/tournaments/${t.id}`}>
      <Card className="hover:border-slate-700 transition-all cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors flex items-center gap-2">
                {t.name}
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {t.sanctioningBody && (
                <span className="text-xs text-slate-500">{t.sanctioningBody}</span>
              )}
            </div>
            {urgencyBadge(t.days, t.avgReadiness)}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(t.startDate)} – {formatDate(t.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {t.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {t.teams.length} team{t.teams.length !== 1 ? 's' : ''}
            </span>
            {t.days > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t.days} day{t.days !== 1 ? 's' : ''} away
              </span>
            )}
          </div>

          {/* Readiness bar */}
          {t.teams.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Avg. Readiness</span>
                <span className="text-slate-300 font-medium">{t.avgReadiness}%</span>
              </div>
              <Progress value={t.avgReadiness} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tournament HQ"
        description="Track readiness and logistics for all tournaments"
      />

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-violet-400" />
            Upcoming ({upcoming.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Past Tournaments ({past.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {past.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <div className="text-lg font-medium">No tournaments yet</div>
          <div className="text-sm mt-1">
            Contact your admin to add tournaments
          </div>
        </div>
      )}
    </div>
  )
}
