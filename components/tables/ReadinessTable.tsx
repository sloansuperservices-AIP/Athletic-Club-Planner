'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Circle, Clock, History } from 'lucide-react'
import type { ReadinessScore } from '@/lib/readiness'

const COLUMNS = [
  { key: 'registration', label: 'Reg.', fullLabel: 'Registration', weight: 25 },
  { key: 'roster',       label: 'Roster', fullLabel: 'Roster', weight: 20 },
  { key: 'hotel',        label: 'Hotel', fullLabel: 'Hotel/Lodging', weight: 15 },
  { key: 'calendar',    label: 'Sched.', fullLabel: 'Schedule Published', weight: 15 },
  { key: 'workplay',    label: 'Jobs', fullLabel: 'WorkPlay Jobs', weight: 10 },
  { key: 'rideshare',   label: 'Travel', fullLabel: 'Rideshare/Travel', weight: 10 },
  { key: 'sponsor',     label: 'Sponsor', fullLabel: 'Sponsor', weight: 5 },
]

interface ChecklistItem {
  id: string
  column: string
  status: string
  notes: string | null
  completedAt: Date | null
  auditTrail?: Array<{
    user: { name: string | null }
    action: string
    createdAt: Date
    oldValue: unknown
    newValue: unknown
  }>
}

interface TeamReadiness extends ReadinessScore {
  teamId: string
  teamName: string
  ageGroup: string
  teamTournamentId: string
  checklist: ChecklistItem[]
}

interface ReadinessTableProps {
  teamReadiness: TeamReadiness[]
  tournamentId: string
  canEdit: boolean
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'complete') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
  if (status === 'in_progress') return <Clock className="h-5 w-5 text-yellow-400" />
  return <Circle className="h-5 w-5 text-slate-600" />
}

function StatusCell({
  item,
  canEdit,
  onUpdate,
}: {
  item: ChecklistItem | undefined
  canEdit: boolean
  onUpdate: (item: ChecklistItem) => void
}) {
  if (!item) {
    return (
      <td className="px-3 py-3 text-center">
        <Circle className="h-5 w-5 text-slate-700 mx-auto" />
      </td>
    )
  }

  return (
    <td className="px-3 py-3 text-center">
      <button
        onClick={() => canEdit && onUpdate(item)}
        disabled={!canEdit}
        className={cn(
          'flex items-center justify-center mx-auto rounded-lg p-1 transition-colors',
          canEdit && 'hover:bg-slate-700/50 cursor-pointer',
          !canEdit && 'cursor-default'
        )}
        title={item.notes ?? item.status}
      >
        <StatusIcon status={item.status} />
      </button>
    </td>
  )
}

export function ReadinessTable({ teamReadiness, tournamentId, canEdit }: ReadinessTableProps) {
  const [editing, setEditing] = useState<ChecklistItem | null>(null)
  const [editStatus, setEditStatus] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [localData, setLocalData] = useState(teamReadiness)

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch('/api/checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, status: editStatus, notes: editNotes }),
      })
      if (res.ok) {
        setLocalData((prev) =>
          prev.map((team) => ({
            ...team,
            checklist: team.checklist.map((c) =>
              c.id === editing.id
                ? { ...c, status: editStatus, notes: editNotes }
                : c
            ),
          }))
        )
        setEditing(null)
      }
    } finally {
      setSaving(false)
    }
  }

  const urgencyBadge = (level: TeamReadiness['urgencyLevel']) => {
    const map = {
      green:  { variant: 'success'    as const, label: 'Ready' },
      yellow: { variant: 'warning'    as const, label: 'Caution' },
      orange: { variant: 'orange'     as const, label: 'At Risk' },
      red:    { variant: 'destructive' as const, label: 'Urgent' },
    }
    const { variant, label } = map[level]
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-48">
                Team
              </th>
              <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">
                Readiness
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center"
                  title={`${col.fullLabel} (${col.weight}% weight)`}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {localData.map((team) => (
              <tr
                key={team.teamId}
                className="hover:bg-slate-800/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-200">{team.teamName}</div>
                  <div className="text-xs text-slate-500">{team.ageGroup}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Progress value={team.total} className="h-1.5" />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">
                      {team.total}%
                    </span>
                  </div>
                </td>
                {COLUMNS.map((col) => {
                  const item = team.checklist.find((c) => c.column === col.key)
                  return (
                    <StatusCell
                      key={col.key}
                      item={item}
                      canEdit={canEdit}
                      onUpdate={(it) => {
                        setEditing(it)
                        setEditStatus(it.status)
                        setEditNotes(it.notes ?? '')
                      }}
                    />
                  )
                })}
                <td className="px-3 py-3 text-center">
                  {urgencyBadge(team.urgencyLevel)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Complete
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-yellow-400" /> In Progress
        </span>
        <span className="flex items-center gap-1.5">
          <Circle className="h-3.5 w-3.5 text-slate-600" /> Pending
        </span>
        {canEdit && <span className="ml-auto italic">Click any cell to update</span>}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update {COLUMNS.find((c) => c.key === editing?.column)?.fullLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete ✓</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">
                Notes (optional)
              </label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add context or links…"
                rows={3}
              />
            </div>
            {editing?.auditTrail && editing.auditTrail.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
                  <History className="h-3.5 w-3.5" />
                  Recent changes
                </div>
                <div className="space-y-1">
                  {editing.auditTrail.map((log, i) => (
                    <div key={i} className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="text-slate-400">{log.user.name}</span>
                      <span>updated to</span>
                      <span className="text-slate-300">
                        {(log.newValue as { status?: string })?.status ?? '?'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
