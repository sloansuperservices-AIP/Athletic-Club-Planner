import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { completeJob } from '@/lib/dibsRules'
import { logAudit } from '@/lib/auditLog'
import { CAN } from '@/lib/rbac'
import { z } from 'zod'

const CompleteSchema = z.object({
  claimId: z.string(),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!CAN.completeJob(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden — only coaches and admins can verify completions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CompleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await completeJob(parsed.data.claimId, session.user.id, parsed.data.notes)

  if (result.success) {
    await logAudit({
      userId: session.user.id,
      action: 'job.completed',
      entityType: 'JobClaim',
      entityId: parsed.data.claimId,
      newValue: { verifiedById: session.user.id, notes: parsed.data.notes },
    })
  }

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
