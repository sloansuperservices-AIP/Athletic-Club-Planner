import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { validateRoster } from '@/lib/rosterValidation'
import Link from 'next/link'
import { Users, AlertTriangle, ChevronRight, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  const session = await auth()
  if (!session) return null

  const teams = await db.team.findMany({
    where: { orgId: session.user.orgId },
    include: {
      athletes: true,
      members: {
        include: { user: { select: { name: true } } },
        where: { role: 'COACH' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  const teamsWithValidation = await Promise.all(
    teams.map(async (t) => ({
      ...t,
      validation: await validateRoster(t.id),
    }))
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Teams"
        description={`${teams.length} team${teams.length !== 1 ? 's' : ''} in your organization`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamsWithValidation.map((team) => (
          <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
            <Card className="hover:border-slate-700 transition-all cursor-pointer group h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-semibold text-slate-100 group-hover:text-sky-400 transition-colors flex items-center gap-2">
                      {team.name}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {team.ageGroup}
                      {team.division ? ` · ${team.division}` : ''} · {team.season}
                    </div>
                  </div>
                  {team.validation.summary.errors > 0 ? (
                    <Badge variant="destructive">
                      {team.validation.summary.errors} issue
                      {team.validation.summary.errors !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="success">Clean</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {team.athletes.length} athlete
                    {team.athletes.length !== 1 ? 's' : ''}
                  </span>
                  {team.members[0] && (
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4" />
                      {team.members[0].user.name}
                    </span>
                  )}
                </div>

                {/* Roster health bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Roster Compliance</span>
                    <span>
                      {team.validation.summary.valid}/{team.validation.summary.total} complete
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${
                          team.validation.summary.total > 0
                            ? (team.validation.summary.valid / team.validation.summary.total) * 100
                            : 0
                        }%`,
                        backgroundColor:
                          team.validation.summary.errors === 0
                            ? '#10b981'
                            : team.validation.summary.errors > 3
                            ? '#ef4444'
                            : '#f97316',
                      }}
                    />
                  </div>
                </div>

                {team.validation.summary.errors > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {team.validation.summary.errors} athlete
                    {team.validation.summary.errors !== 1 ? 's' : ''} need attention
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
