import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { claimJobSlot } from '@/lib/dibsRules'
import { logAudit } from '@/lib/auditLog'
import { z } from 'zod'

const ClaimSchema = z.object({
  jobId: z.string(),
  adminOverride: z.boolean().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ClaimSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const canOverride = parsed.data.adminOverride && session.user.role === 'ADMIN'
  const result = await claimJobSlot(session.user.id, parsed.data.jobId, canOverride)

  if (result.success && result.claimId) {
    await logAudit({
      userId: session.user.id,
      action: 'job.claimed',
      entityType: 'JobClaim',
      entityId: result.claimId,
      newValue: { jobId: parsed.data.jobId, adminOverride: canOverride },
    })
  }

  return NextResponse.json(result, { status: result.success ? 200 : 409 })
}
