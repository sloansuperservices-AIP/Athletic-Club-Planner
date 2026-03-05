import { db } from '@/lib/db'

export interface ValidationIssue {
  athleteId: string
  athleteName: string
  severity: 'error' | 'warning'
  issues: string[]
}

export interface RosterValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  summary: {
    errors: number
    warnings: number
    valid: number
    total: number
  }
}

export async function validateRoster(teamId: string): Promise<RosterValidationResult> {
  const athletes = await db.athlete.findMany({
    where: { teamId },
    include: {
      user: { select: { name: true, email: true } },
      guardians: { select: { id: true } },
    },
  })

  const issues: ValidationIssue[] = []

  for (const athlete of athletes) {
    const errors: string[] = []
    const warnings: string[] = []

    // Errors — blocking issues
    if (!athlete.waiverSigned) errors.push('Liability waiver not signed')
    if (!athlete.medicalFormOnFile) errors.push('Medical/emergency form missing')
    if (athlete.guardians.length === 0) errors.push('No guardian linked')

    // Warnings — non-blocking but important
    if (!athlete.jerseyNumber) warnings.push('Jersey number not assigned')
    if (!athlete.gpa) warnings.push('GPA not recorded')
    if (!athlete.profileImageUrl) warnings.push('No profile photo')

    const allIssues = [...errors, ...warnings.map((w) => `⚠ ${w}`)]
    if (allIssues.length > 0) {
      issues.push({
        athleteId: athlete.id,
        athleteName: athlete.user.name ?? 'Unknown',
        severity: errors.length > 0 ? 'error' : 'warning',
        issues: allIssues,
      })
    }
  }

  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.filter((i) => i.severity === 'warning').length
  const valid = athletes.length - errors - warnings

  return {
    isValid: errors === 0,
    issues,
    summary: { errors, warnings, valid, total: athletes.length },
  }
}
