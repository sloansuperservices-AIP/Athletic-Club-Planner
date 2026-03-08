import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { ReadinessTable } from '@/components/tables/ReadinessTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, daysUntil } from '@/lib/utils'
import { computeReadinessForTournament } from '@/lib/readiness'
import { validateRoster } from '@/lib/rosterValidation'
import {
  MapPin, Calendar, Trophy, Clock, Users, AlertTriangle, CheckCircle2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TournamentDetailPage({
  params,
}: {
  params: { tournamentId: string }
}) {
  const session = await auth()
  if (!session) return null

  const tournament = await db.tournament.findUnique({
    where: { id: params.tournamentId, orgId: session.user.orgId },
    include: {
      teams: {
        include: {
          team: {
            include: { athletes: true },
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
          slots: {
            include: {
              claim: { include: { user: { select: { name: true } } } },
            },
          },
        },
        where: { isActive: true },
      },
    },
  })

  if (!tournament) notFound()

  const days = daysUntil(tournament.startDate)
  const teamReadiness = await computeReadinessForTournament(tournament.id)

  const avgReadiness =
    teamReadiness.length > 0
      ? Math.round(teamReadiness.reduce((s, r) => s + r.total, 0) / teamReadiness.length)
      : 0

  // Roster validation for all teams
  const rosterValidations = await Promise.all(
    tournament.teams.map(async (tt) => ({
      teamId: tt.teamId,
      teamName: tt.team.name,
      validation: await validateRoster(tt.teamId),
    }))
  )

  const totalErrors = rosterValidations.reduce(
    (sum, rv) => sum + rv.validation.summary.errors,
    0
  )

  // Open job slots
  const totalSlots = tournament.jobs.reduce((s, j) => s + j.slots.length, 0)
  const filledSlots = tournament.jobs.reduce(
    (s, j) => s + j.slots.filter((sl) => !!sl.claim).length,
    0
  )

  const urgencyVariant =
    days <= 0
      ? 'secondary'
      : days <= 7 && avgReadiness < 90
      ? 'destructive'
      : days <= 14 && avgReadiness < 75
      ? 'orange'
      : avgReadiness >= 90
      ? 'success'
      : 'warning'

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={tournament.name}>
        <Badge variant={urgencyVariant as 'secondary'}>
          {days <= 0 ? 'Completed' : `${days} day${days !== 1 ? 's' : ''} away`}
        </Badge>
      </PageHeader>

      {/* Meta strip */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-500" />
          {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-slate-500" />
          {tournament.location}
        </span>
        {tournament.sanctioningBody && (
          <span className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-slate-500" />
            {tournament.sanctioningBody}
          </span>
        )}
        {tournament.registrationDeadline && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-500" />
            Reg. due {formatDate(tournament.registrationDeadline)}
          </span>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-100">{avgReadiness}%</div>
            <div className="text-xs text-slate-400 mt-0.5">Avg. Readiness</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-100">
              {tournament.teams.length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Teams Attending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div
              className={`text-2xl font-bold ${
                totalErrors > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {totalErrors}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Roster Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-100">
              {filledSlots}/{totalSlots}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Job Slots Filled</div>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-sky-400" />
            Team Readiness Grid
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ReadinessTable
            teamReadiness={teamReadiness}
            tournamentId={tournament.id}
            canEdit={['ADMIN', 'COACH', 'TEAM_MANAGER'].includes(session.user.role)}
          />
        </CardContent>
      </Card>

      {/* Roster Issues */}
      {totalErrors > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Roster Issues — Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rosterValidations
                .filter((rv) => rv.validation.summary.errors > 0)
                .map((rv) => (
                  <div key={rv.teamId}>
                    <div className="text-sm font-medium text-slate-200 mb-1">
                      {rv.teamName}
                    </div>
                    <div className="space-y-1">
                      {rv.validation.issues
                        .filter((i) => i.severity === 'error')
                        .map((issue) => (
                          <div
                            key={issue.athleteId}
                            className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 rounded-lg px-3 py-2"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium">{issue.athleteName}:</span>
                            <span>{issue.issues.join(', ')}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WorkPlay Job Summary */}
      {tournament.jobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">WorkPlay Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tournament.jobs.map((job) => {
                const filled = job.slots.filter((s) => s.claim).length
                const total = job.slots.length
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-200">{job.title}</div>
                      <div className="text-xs text-slate-500">{job.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {filled === total ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <span className="text-xs text-orange-400">{total - filled} open</span>
                      )}
                      <span className="text-sm text-slate-300">
                        {filled}/{total}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
