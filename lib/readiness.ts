import { db } from '@/lib/db'

// Checklist column weights — must sum to 1.0
const COLUMN_WEIGHTS: Record<string, number> = {
  registration: 0.25, // most critical — can't attend without it
  roster:       0.20, // players must be on official roster
  hotel:        0.15,
  calendar:     0.15, // schedule published to families
  workplay:     0.10, // volunteer jobs claimed
  rideshare:    0.10,
  sponsor:      0.05,
}

const STATUS_SCORE: Record<string, number> = {
  complete:    1.0,
  in_progress: 0.5,
  pending:     0.0,
}

export interface ReadinessScore {
  total: number
  breakdown: Record<string, number>
  waiverScore: number
  medicalScore: number
  urgencyLevel: 'green' | 'yellow' | 'orange' | 'red'
  missingItems: string[]
}

export async function computeReadiness(
  teamTournamentId: string
): Promise<ReadinessScore> {
  const tt = await db.teamTournament.findUnique({
    where: { id: teamTournamentId },
    include: {
      checklist: true,
      team: {
        include: {
          athletes: {
            select: { waiverSigned: true, medicalFormOnFile: true },
          },
        },
      },
      tournament: {
        select: { startDate: true },
      },
    },
  })

  if (!tt) throw new Error(`TeamTournament not found: ${teamTournamentId}`)

  // Checklist column score
  const breakdown: Record<string, number> = {}
  let checklistTotal = 0
  const missingItems: string[] = []

  for (const [column, weight] of Object.entries(COLUMN_WEIGHTS)) {
    const item = tt.checklist.find((c) => c.column === column)
    const statusScore = item ? (STATUS_SCORE[item.status] ?? 0) : 0
    breakdown[column] = Math.round(statusScore * weight * 100)
    checklistTotal += statusScore * weight
    if (statusScore < 1.0) {
      missingItems.push(column)
    }
  }

  // Athlete compliance scores
  const athletes = tt.team.athletes
  const total_athletes = athletes.length
  const waiverCount = athletes.filter((a) => a.waiverSigned).length
  const medicalCount = athletes.filter((a) => a.medicalFormOnFile).length
  const waiverScore =
    total_athletes > 0 ? Math.round((waiverCount / total_athletes) * 100) : 0
  const medicalScore =
    total_athletes > 0 ? Math.round((medicalCount / total_athletes) * 100) : 0

  // Blend: 70% checklist, 20% waiver compliance, 10% medical compliance
  const total = Math.round(
    checklistTotal * 70 + waiverScore * 0.2 + medicalScore * 0.1
  )

  // Urgency based on days until tournament + readiness score
  const daysUntil = Math.ceil(
    (tt.tournament.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  let urgencyLevel: ReadinessScore['urgencyLevel'] = 'green'
  if (total < 90 && daysUntil <= 7) urgencyLevel = 'red'
  else if (total < 75 && daysUntil <= 14) urgencyLevel = 'orange'
  else if (total < 85 && daysUntil <= 21) urgencyLevel = 'yellow'

  return { total, breakdown, waiverScore, medicalScore, urgencyLevel, missingItems }
}

// Batch compute readiness for all teams at a tournament
export async function computeReadinessForTournament(tournamentId: string) {
  const teamTournaments = await db.teamTournament.findMany({
    where: { tournamentId },
    include: {
      team: { select: { id: true, name: true, ageGroup: true } },
      checklist: true,
    },
  })

  return Promise.all(
    teamTournaments.map(async (tt) => ({
      teamId: tt.team.id,
      teamName: tt.team.name,
      ageGroup: tt.team.ageGroup,
      teamTournamentId: tt.id,
      checklist: tt.checklist,
      ...(await computeReadiness(tt.id)),
    }))
  )
}

// Compute urgency sort score (higher = more urgent)
export function urgencySortScore(readiness: number, daysUntil: number): number {
  return ((100 - readiness) * 100) / Math.max(daysUntil, 1)
}
