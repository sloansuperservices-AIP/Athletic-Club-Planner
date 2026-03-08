'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { Calendar, Clock, Users, CheckCircle2, Lock, AlertTriangle } from 'lucide-react'
import type { Role } from '@prisma/client'

interface JobSlot {
  id: string
  slotIndex: number
  claim: { user: { name: string | null; id: string } } | null
}

interface Job {
  id: string
  title: string
  description: string
  category: string
  creditValue: number
  startAt: Date | null
  endAt: Date | null
  tournament: { name: string; startDate: Date } | null
  team: { name: string } | null
  slots: JobSlot[]
  openSlots: number
  eligibility: { eligible: boolean; reason?: string; weeklyUsed?: number; weeklyMax?: number; cooldownRemaining?: number }
}

interface JobBoardProps {
  jobs: Job[]
  currentUserId: string
  userRole: Role
}

export function JobBoard({ jobs, currentUserId, userRole }: JobBoardProps) {
  const [claiming, setClaiming] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [completingClaimId, setCompletingClaimId] = useState<string | null>(null)
  const [localJobs, setLocalJobs] = useState(jobs)

  async function handleClaim(adminOverride = false) {
    if (!claiming) return
    setLoading(true)
    try {
      const res = await fetch('/api/workplay/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: claiming.id, adminOverride }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setClaiming(null)
        // Reload jobs by refreshing
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(claimId: string) {
    setCompletingClaimId(claimId)
    try {
      const res = await fetch('/api/workplay/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } finally {
      setCompletingClaimId(null)
    }
  }

  const isCoachOrAdmin = ['ADMIN', 'COACH', 'TEAM_MANAGER'].includes(userRole)
  const canClaimJobs = ['ADMIN', 'PARENT', 'ATHLETE'].includes(userRole)

  const myClaims = localJobs.flatMap((j) =>
    j.slots
      .filter((s) => s.claim?.user.id === currentUserId)
      .map((s) => ({ ...s, job: j }))
  )

  if (localJobs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <div className="text-lg font-medium">No active job listings</div>
        <div className="text-sm mt-1">Check back closer to tournament time</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Global status message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-3 underline text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* My claimed slots */}
      {myClaims.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            My Claimed Slots ({myClaims.length})
          </h3>
          <div className="space-y-2">
            {myClaims.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-sky-500/5 border border-sky-500/20"
              >
                <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">{slot.job.title}</div>
                  {slot.job.startAt && (
                    <div className="text-xs text-slate-500">{formatDate(slot.job.startAt)}</div>
                  )}
                </div>
                <Badge variant="default">Claimed</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {localJobs.map((job) => {
          const mySlot = job.slots.find((s) => s.claim?.user.id === currentUserId)
          return (
            <Card
              key={job.id}
              className={`flex flex-col ${job.openSlots === 0 ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-5 flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-100 leading-tight">{job.title}</h3>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {job.category}
                    </Badge>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-emerald-400">
                      {job.openSlots}
                    </div>
                    <div className="text-xs text-slate-500">open</div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 flex-1">{job.description}</p>

                {/* Meta */}
                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  {job.tournament && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {job.tournament.name}
                    </div>
                  )}
                  {job.startAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(job.startAt)}
                      {job.endAt && ` – ${new Date(job.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {job.slots.length - job.openSlots}/{job.slots.length} slots filled
                  </div>
                </div>

                {/* Claimed slots */}
                <div className="space-y-1 mb-4">
                  {job.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-500">Slot {slot.slotIndex}</span>
                      {slot.claim ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">{slot.claim.user.name}</span>
                          {isCoachOrAdmin && slot.claim.user.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-2 text-xs text-emerald-400 hover:text-emerald-300"
                              onClick={() => handleComplete(slot.id)}
                              disabled={completingClaimId === slot.id}
                            >
                              {completingClaimId === slot.id ? '…' : '✓ Done'}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Open</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action */}
                {mySlot ? (
                  <Badge variant="success" className="justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    You have Slot {mySlot.slotIndex}
                  </Badge>
                ) : canClaimJobs && job.openSlots > 0 ? (
                  <div>
                    {!job.eligibility.eligible && (
                      <div className="text-xs text-orange-400 bg-orange-500/5 border border-orange-500/20 rounded px-3 py-2 mb-2 flex items-start gap-1.5">
                        <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {job.eligibility.reason}
                      </div>
                    )}
                    <Button
                      className="w-full"
                      disabled={!job.eligibility.eligible}
                      onClick={() => setClaiming(job)}
                    >
                      {job.eligibility.eligible ? 'Call DIBs!' : 'Locked'}
                    </Button>
                  </div>
                ) : job.openSlots === 0 ? (
                  <Badge variant="secondary" className="justify-center">
                    All slots claimed
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Claim confirmation dialog */}
      <Dialog open={!!claiming} onOpenChange={(open) => !open && setClaiming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm DIBs — {claiming?.title}</DialogTitle>
            <DialogDescription>
              You&apos;re claiming a volunteer slot for this job. The fairness rules will be
              applied automatically (max 2 claims/week, 24-hour cooldown).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {claiming?.tournament && (
              <div className="text-sm text-slate-300">
                <span className="text-slate-500">Tournament:</span> {claiming.tournament.name}
              </div>
            )}
            {claiming?.startAt && (
              <div className="text-sm text-slate-300">
                <span className="text-slate-500">Date/Time:</span> {formatDate(claiming.startAt)}
              </div>
            )}
            <div className="text-sm text-slate-300">
              <span className="text-slate-500">Credit earned on completion:</span>{' '}
              <span className="text-emerald-400 font-semibold">1 credit</span>
            </div>
            <div className="rounded-lg bg-slate-800 px-4 py-3 text-xs text-slate-400">
              <strong className="text-slate-300">Commitment:</strong> Showing up is critical.
              No-shows result in a −1 credit deduction and may affect future eligibility.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClaiming(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleClaim(false)} disabled={loading}>
              {loading ? 'Claiming…' : 'Confirm DIBs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
