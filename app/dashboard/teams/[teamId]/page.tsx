import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { validateRoster } from '@/lib/rosterValidation'
import { getUserCredits } from '@/lib/dibsRules'
import { formatDate, daysUntil } from '@/lib/utils'
import {
  Users, Calendar, Briefcase, Trophy, AlertTriangle,
  CheckCircle2, Shield, GraduationCap, Coins,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeamDetailPage({
  params,
}: {
  params: { teamId: string }
}) {
  const session = await auth()
  if (!session) return null

  const team = await db.team.findUnique({
    where: { id: params.teamId, orgId: session.user.orgId },
    include: {
      athletes: {
        include: {
          user: { select: { name: true, email: true, image: true } },
          guardians: {
            include: { user: { select: { name: true, id: true } } },
          },
          stats: { orderBy: { recordedAt: 'desc' }, take: 6 },
        },
      },
      members: {
        include: { user: { select: { name: true, role: true, image: true } } },
        where: { role: 'COACH' },
      },
      tournaments: {
        include: { tournament: { select: { id: true, name: true, startDate: true, endDate: true } } },
        orderBy: { tournament: { startDate: 'asc' } },
      },
      scheduleItems: {
        where: { startAt: { gte: new Date() } },
        orderBy: { startAt: 'asc' },
        take: 10,
      },
    },
  })

  if (!team) notFound()

  const validation = await validateRoster(params.teamId)

  // Get credit totals for all guardians
  const guardianUserIds = [
    ...new Set(
      team.athletes.flatMap((a) => a.guardians.map((g) => g.user.id))
    ),
  ]
  const creditTotals = await Promise.all(
    guardianUserIds.map(async (uid) => ({
      userId: uid,
      credits: await getUserCredits(uid),
    }))
  )
  const creditMap = new Map(creditTotals.map((c) => [c.userId, c.credits]))

  const coach = team.members[0]?.user

  const statusColor = (status: string) => {
    if (status === 'complete') return 'text-emerald-400'
    if (status === 'in_progress') return 'text-yellow-400'
    return 'text-slate-600'
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={team.name} description={`${team.ageGroup}${team.division ? ` · ${team.division}` : ''} · ${team.season}`}>
        {coach && (
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Coach: {coach.name}
          </Badge>
        )}
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-100">{team.athletes.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Athletes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${validation.summary.errors > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {validation.summary.errors === 0 ? '✓' : validation.summary.errors}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Roster Issues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-100">{team.tournaments.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Tournaments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-slate-100">{team.scheduleItems.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Upcoming Events</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Roster
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="credits">
            <Coins className="h-3.5 w-3.5 mr-1.5" /> WorkPlay Credits
          </TabsTrigger>
          <TabsTrigger value="tournaments">
            <Trophy className="h-3.5 w-3.5 mr-1.5" /> Tournaments
          </TabsTrigger>
        </TabsList>

        {/* ROSTER TAB */}
        <TabsContent value="roster">
          <div className="space-y-3">
            {team.athletes.map((athlete) => {
              const issues = validation.issues.find((i) => i.athleteId === athlete.id)
              const hasErrors = issues?.severity === 'error'
              const hasWarnings = issues?.severity === 'warning'
              return (
                <Card
                  key={athlete.id}
                  className={hasErrors ? 'border-red-500/30' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {athlete.user.name}
                          </span>
                          <span className="text-xs text-slate-500">{athlete.position}</span>
                          {athlete.jerseyNumber && (
                            <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                              #{athlete.jerseyNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-slate-500">
                          {athlete.gpa && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {athlete.gpa} GPA
                            </span>
                          )}
                          <span>Class of {athlete.gradYear}</span>
                        </div>
                        {issues && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {issues.issues.map((issue, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                  hasErrors
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-yellow-500/10 text-yellow-400'
                                }`}
                              >
                                {hasErrors ? (
                                  <AlertTriangle className="h-3 w-3" />
                                ) : null}
                                {issue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-1.5">
                          <span
                            className={`text-xs ${athlete.waiverSigned ? 'text-emerald-400' : 'text-red-400'}`}
                            title="Waiver"
                          >
                            {athlete.waiverSigned ? '✓' : '✗'} Waiver
                          </span>
                          <span
                            className={`text-xs ${athlete.medicalFormOnFile ? 'text-emerald-400' : 'text-red-400'}`}
                            title="Medical"
                          >
                            {athlete.medicalFormOnFile ? '✓' : '✗'} Medical
                          </span>
                        </div>
                        {athlete.guardians[0] && (
                          <span className="text-xs text-slate-500">
                            Parent: {athlete.guardians[0].user.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* SCHEDULE TAB */}
        <TabsContent value="schedule">
          {team.scheduleItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No upcoming events</div>
          ) : (
            <div className="space-y-2">
              {team.scheduleItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-center w-12">
                      <div className="text-lg font-bold text-slate-100">
                        {new Date(item.startAt).getDate()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(item.startAt).toLocaleString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-200">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(item.startAt)} ·{' '}
                        {item.location ?? 'Location TBD'}
                      </div>
                    </div>
                    <Badge variant="secondary">{item.type}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CREDITS TAB */}
        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WorkPlay Credit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {guardianUserIds.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No guardians linked yet
                </div>
              ) : (
                <div className="space-y-3">
                  {team.athletes
                    .flatMap((a) =>
                      a.guardians.map((g) => ({
                        guardianName: g.user.name ?? 'Unknown',
                        athleteName: a.user.name ?? 'Unknown',
                        credits: creditMap.get(g.user.id) ?? 0,
                      }))
                    )
                    .sort((a, b) => b.credits - a.credits)
                    .map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50"
                      >
                        <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-400">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-200">
                            {entry.guardianName}
                          </div>
                          <div className="text-xs text-slate-500">
                            Parent of {entry.athleteName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-400">
                            {entry.credits}
                          </div>
                          <div className="text-xs text-slate-500">credits</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOURNAMENTS TAB */}
        <TabsContent value="tournaments">
          {team.tournaments.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Not registered for any tournaments
            </div>
          ) : (
            <div className="space-y-2">
              {team.tournaments.map((tt) => (
                <Card key={tt.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Trophy className="h-5 w-5 text-violet-400 shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-slate-200">
                        {tt.tournament.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(tt.tournament.startDate)}
                      </div>
                    </div>
                    {daysUntil(tt.tournament.startDate) > 0 ? (
                      <Badge variant="default">
                        {daysUntil(tt.tournament.startDate)}d away
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Past</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
