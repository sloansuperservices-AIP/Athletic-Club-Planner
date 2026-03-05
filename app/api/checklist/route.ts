import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CAN } from '@/lib/rbac'
import { logAudit } from '@/lib/auditLog'

const UpdateSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in_progress', 'complete']),
  notes: z.string().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!CAN.editChecklist(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await db.checklistItem.findUnique({ where: { id: parsed.data.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.checklistItem.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes,
      completedById: parsed.data.status === 'complete' ? session.user.id : null,
      completedAt: parsed.data.status === 'complete' ? new Date() : null,
    },
  })

  // Audit trail
  await logAudit({
    userId: session.user.id,
    action: 'checklist.updated',
    entityType: 'ChecklistItem',
    entityId: updated.id,
    oldValue: { status: existing.status, notes: existing.notes },
    newValue: { status: updated.status, notes: updated.notes },
    checklistItemId: updated.id,
  })

  return NextResponse.json(updated)
}
