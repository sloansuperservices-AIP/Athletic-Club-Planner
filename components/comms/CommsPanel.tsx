'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Megaphone, Pin, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Announcement {
  id: string
  title: string
  body: string
  isPinned: boolean
  createdAt: string
  author: { name: string | null }
  targetTeamId: string | null
}

interface Team {
  id: string
  name: string
}

interface CommsPanelProps {
  announcements: Announcement[]
  teams: Team[]
  canPost: boolean
}

export function CommsPanel({ announcements, teams, canPost }: CommsPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetTeamId, setTargetTeamId] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    try {
      await fetch('/api/comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, targetTeamId: targetTeamId || undefined }),
      })
      setShowForm(false)
      setTitle('')
      setBody('')
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  const pinned = announcements.filter((a) => a.isPinned)
  const regular = announcements.filter((a) => !a.isPinned)

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Post Announcement
          </Button>
        </div>
      )}

      {pinned.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5" /> Pinned
          </div>
          {pinned.map((ann) => (
            <Card key={ann.id} className="mb-2 border-sky-500/20 bg-sky-500/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-100">{ann.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {ann.author.name} · {formatDate(ann.createdAt)}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{ann.body}</div>
                  </div>
                  <Pin className="h-4 w-4 text-sky-400 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {regular.length === 0 && pinned.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <div>No announcements yet</div>
          </div>
        )}
        {regular.map((ann) => (
          <Card key={ann.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-200">{ann.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {ann.author.name} · {formatDate(ann.createdAt)}
                    {ann.targetTeamId && (
                      <span className="ml-2 text-sky-400">
                        · {teams.find((t) => t.id === ann.targetTeamId)?.name ?? 'Team'}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{ann.body}</div>
                </div>
                {ann.targetTeamId ? (
                  <Badge variant="secondary">Team</Badge>
                ) : (
                  <Badge variant="outline">All</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Message</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Write your message…" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Target Team (optional)</label>
              <select
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100"
              >
                <option value="">All teams</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !title || !body}>
              {saving ? 'Posting…' : 'Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
