import { db } from '@/lib/db'
import { startOfWeek, endOfWeek, subHours, differenceInHours } from 'date-fns'

export const DIBS_CONFIG = {
  maxClaimsPerWeek: 2,
  cooldownHours: 24,
}

export interface DibsEligibility {
  eligible: boolean
  reason?: string
  weeklyUsed?: number
  weeklyMax?: number
  cooldownRemaining?: number
}

export async function checkDibsEligibility(
  userId: string,
  jobId: string,
  force = false
): Promise<DibsEligibility> {
  if (force) return { eligible: true }

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 })

  // 1. Check weekly claim limit
  const weeklyCount = await db.jobClaim.count({
    where: {
      userId,
      claimedAt: { gte: weekStart, lte: weekEnd },
      status: { not: 'released' },
    },
  })

  if (weeklyCount >= DIBS_CONFIG.maxClaimsPerWeek) {
    return {
      eligible: false,
      reason: `You've used ${weeklyCount}/${DIBS_CONFIG.maxClaimsPerWeek} claims this week. Your window resets ${weekEnd.toLocaleDateString()}.`,
      weeklyUsed: weeklyCount,
      weeklyMax: DIBS_CONFIG.maxClaimsPerWeek,
    }
  }

  // 2. Check cooldown since last claim
  const cooldownCutoff = subHours(now, DIBS_CONFIG.cooldownHours)
  const recentClaim = await db.jobClaim.findFirst({
    where: {
      userId,
      claimedAt: { gte: cooldownCutoff },
      status: { not: 'released' },
    },
    orderBy: { claimedAt: 'desc' },
  })

  if (recentClaim) {
    const hoursSince = differenceInHours(now, recentClaim.claimedAt)
    const remaining = DIBS_CONFIG.cooldownHours - hoursSince

    return {
      eligible: false,
      reason: `Cooldown active — eligible in ${remaining}h. This ensures fair access for all families.`,
      cooldownRemaining: remaining,
      weeklyUsed: weeklyCount,
      weeklyMax: DIBS_CONFIG.maxClaimsPerWeek,
    }
  }

  // 3. Check the job has open slots
  const job = await db.workPlayJob.findUnique({
    where: { id: jobId },
    include: { slots: { include: { claim: true } } },
  })

  if (!job) return { eligible: false, reason: 'Job not found.' }
  if (!job.isActive) return { eligible: false, reason: 'This job is no longer active.' }

  const openSlot = job.slots.find((s) => !s.claim)
  if (!openSlot) {
    return { eligible: false, reason: 'All slots for this job have been claimed.' }
  }

  return {
    eligible: true,
    weeklyUsed: weeklyCount,
    weeklyMax: DIBS_CONFIG.maxClaimsPerWeek,
  }
}

export async function claimJobSlot(
  userId: string,
  jobId: string,
  adminOverride = false
): Promise<{ success: boolean; message: string; claimId?: string }> {
  // Eligibility check (unless admin override)
  if (!adminOverride) {
    const eligibility = await checkDibsEligibility(userId, jobId)
    if (!eligibility.eligible) {
      return { success: false, message: eligibility.reason! }
    }
  }

  const job = await db.workPlayJob.findUnique({
    where: { id: jobId },
    include: { slots: { include: { claim: true } } },
  })

  if (!job) return { success: false, message: 'Job not found.' }

  const openSlot = job.slots.find((s) => !s.claim)
  if (!openSlot) return { success: false, message: 'No open slots available.' }

  // Atomic create with unique constraint on slotId preventing race conditions
  try {
    const claim = await db.jobClaim.create({
      data: {
        slotId: openSlot.id,
        userId,
        adminOverride,
        status: 'claimed',
      },
    })
    return { success: true, message: 'Job claimed! See you there!', claimId: claim.id }
  } catch {
    return { success: false, message: 'Slot already taken — please refresh and try another.' }
  }
}

export async function releaseJobSlot(
  claimId: string,
  userId: string,
  reason: string,
  adminUserId?: string
): Promise<{ success: boolean; message: string }> {
  const claim = await db.jobClaim.findUnique({ where: { id: claimId } })
  if (!claim) return { success: false, message: 'Claim not found.' }

  // Only the claimant or admin can release
  if (claim.userId !== userId && !adminUserId) {
    return { success: false, message: 'Unauthorized.' }
  }

  await db.jobClaim.update({
    where: { id: claimId },
    data: { status: 'released', releasedAt: new Date(), releasedReason: reason },
  })

  return { success: true, message: 'Slot released.' }
}

export async function completeJob(
  claimId: string,
  verifiedById: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const claim = await db.jobClaim.findUnique({
    where: { id: claimId },
    include: { slot: { include: { job: true } } },
  })

  if (!claim) return { success: false, message: 'Claim not found.' }
  if (claim.status !== 'claimed') {
    return { success: false, message: `Claim is already ${claim.status}.` }
  }

  // Mark complete + write credit ledger entry in a transaction
  await db.$transaction([
    db.jobClaim.update({
      where: { id: claimId },
      data: { status: 'completed' },
    }),
    db.jobCompletion.create({
      data: { claimId, verifiedById, notes },
    }),
    db.creditLedgerEntry.create({
      data: {
        userId: claim.userId,
        claimId: claim.id,
        amount: claim.slot.job.creditValue, // flat 1.0 per completion
        reason: 'job_completed',
        createdById: verifiedById,
      },
    }),
  ])

  return { success: true, message: 'Job marked complete. Credit awarded!' }
}

// Get total credits for a user
export async function getUserCredits(userId: string): Promise<number> {
  const entries = await db.creditLedgerEntry.findMany({
    where: { userId },
    select: { amount: true },
  })
  return entries.reduce((sum, e) => sum + e.amount, 0)
}

// Credit leaderboard for a team
export async function getCreditLeaderboard(orgId: string, teamId?: string) {
  const users = await db.user.findMany({
    where: {
      orgId,
      ...(teamId ? { memberships: { some: { teamId } } } : {}),
      role: { in: ['PARENT', 'ATHLETE'] },
    },
    select: {
      id: true,
      name: true,
      image: true,
      creditEntries: { select: { amount: true } },
    },
  })

  return users
    .map((u) => ({
      userId: u.id,
      name: u.name ?? 'Unknown',
      image: u.image,
      totalCredits: u.creditEntries.reduce((sum, e) => sum + e.amount, 0),
    }))
    .sort((a, b) => b.totalCredits - a.totalCredits)
}
