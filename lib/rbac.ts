import type { Role } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// Role hierarchy — higher index = more permissions
export const ROLE_HIERARCHY: Role[] = [
  'ATHLETE',
  'PARENT',
  'TEAM_MANAGER',
  'COACH',
  'ADMIN',
]

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole)
}

// Server-side: get session and assert minimum role
export async function requireRole(requiredRole: Role) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('UNAUTHENTICATED')
  }
  if (!hasRole(session.user.role, requiredRole)) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

// Check if user can see/edit a specific team's data
export async function canAccessTeam(
  userId: string,
  orgRole: Role,
  teamId: string
): Promise<boolean> {
  if (orgRole === 'ADMIN') return true
  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId, teamId } },
  })
  return !!membership
}

// Get team-scoped role override
export async function getTeamRole(
  userId: string,
  teamId: string
): Promise<Role | null> {
  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId, teamId } },
  })
  return membership?.role ?? null
}

// Permission matrix
export const CAN = {
  viewAllTeams:        (role: Role) => hasRole(role, 'COACH'),
  editChecklist:       (role: Role) => hasRole(role, 'TEAM_MANAGER'),
  claimJob:            (role: Role) => hasRole(role, 'PARENT'),
  completeJob:         (role: Role) => hasRole(role, 'COACH'),
  adminOverrideDibs:   (role: Role) => role === 'ADMIN',
  manageUsers:         (role: Role) => role === 'ADMIN',
  viewAuditLog:        (role: Role) => hasRole(role, 'COACH'),
  publishArticle:      (role: Role) => hasRole(role, 'COACH'),
  editArticle:         (role: Role) => hasRole(role, 'COACH'),
  sendBulkReminder:    (role: Role) => hasRole(role, 'TEAM_MANAGER'),
  viewCredits:         (role: Role) => hasRole(role, 'PARENT'),
  adjustCredits:       (role: Role) => role === 'ADMIN',
  manageTournaments:   (role: Role) => hasRole(role, 'TEAM_MANAGER'),
  viewSponsors:        (role: Role) => hasRole(role, 'TEAM_MANAGER'),
}
