import { db } from '@/lib/db'

interface LogParams {
  userId: string
  action: string
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  checklistItemId?: string
  ip?: string
}

export async function logAudit(params: LogParams): Promise<void> {
  await db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue
        ? (JSON.parse(JSON.stringify(params.oldValue)) as object)
        : undefined,
      newValue: params.newValue
        ? (JSON.parse(JSON.stringify(params.newValue)) as object)
        : undefined,
      ip: params.ip,
      checklistItemId: params.checklistItemId,
    },
  })
}
