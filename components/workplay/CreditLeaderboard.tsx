import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  name: string
  image: string | null
  totalCredits: number
}

export function CreditLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const maxCredits = entries[0]?.totalCredits ?? 0

  const rankColor = (i: number) => {
    if (i === 0) return 'text-yellow-400'
    if (i === 1) return 'text-slate-300'
    if (i === 2) return 'text-orange-400'
    return 'text-slate-500'
  }

  const rankBg = (i: number) => {
    if (i === 0) return 'bg-yellow-400/10 border-yellow-400/20'
    if (i === 1) return 'bg-slate-300/5 border-slate-300/20'
    if (i === 2) return 'bg-orange-400/10 border-orange-400/20'
    return 'bg-slate-800/50 border-transparent'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Family Credit Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No credits earned yet — claim your first job!
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-3 rounded-lg border ${rankBg(i)}`}
              >
                <div className={`w-8 text-center font-bold text-sm ${rankColor(i)}`}>
                  {i < 3 ? (
                    <Medal className="h-5 w-5 mx-auto" />
                  ) : (
                    `#${i + 1}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-200 truncate">{entry.name}</div>
                  {/* Mini bar */}
                  <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: maxCredits > 0 ? `${(entry.totalCredits / maxCredits) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-emerald-400">
                    {entry.totalCredits}
                  </div>
                  <div className="text-xs text-slate-500">
                    credit{entry.totalCredits !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-slate-500 text-center">
          Credits earned by completing volunteer job slots. 1 credit = 1 completed slot.
        </p>
      </CardContent>
    </Card>
  )
}
