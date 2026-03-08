'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2, XCircle, HelpCircle, Clock, Trophy, Users,
  CalendarDays, MapPin, ChevronRight, Swords, Plus
} from 'lucide-react';

const STATUS_CONFIG = {
  YES:     { label: 'Present',  icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-400',  bg: 'bg-green-500/20 border-green-700' },
  NO:      { label: 'Absent',   icon: <XCircle className="h-4 w-4" />,      color: 'text-red-400',    bg: 'bg-red-500/20 border-red-700' },
  MAYBE:   { label: 'Tentative',icon: <HelpCircle className="h-4 w-4" />,   color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-700' },
  PENDING: { label: 'No Reply', icon: <Clock className="h-4 w-4" />,        color: 'text-slate-400',  bg: 'bg-slate-700 border-slate-600' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  GAME:       <Swords className="h-4 w-4 text-orange-400" />,
  PRACTICE:   <Trophy className="h-4 w-4 text-sky-400" />,
  TOURNAMENT: <Trophy className="h-4 w-4 text-yellow-400" />,
  MEETING:    <Users className="h-4 w-4 text-purple-400" />,
  OTHER:      <CalendarDays className="h-4 w-4 text-slate-400" />,
};

interface ScheduleItem {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  location: string | null;
  opponent: string | null;
  homeScore: number | null;
  awayScore: number | null;
  team: { id: string; name: string };
  rsvps: {
    status: string;
    note: string | null;
    athlete: { id: string; firstName: string; lastName: string; jerseyNumber: string | null };
  }[];
}

interface Team {
  id: string;
  name: string;
}

function AttendanceSheet({ item, onClose }: { item: ScheduleItem; onClose: () => void }) {
  const [rsvps, setRsvps] = useState(item.rsvps);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [scores, setScores] = useState({ home: item.homeScore?.toString() ?? '', away: item.awayScore?.toString() ?? '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/attendance?scheduleItemId=${item.id}`)
      .then(r => r.json())
      .then(d => setRsvps(d.rsvps));
    fetch(`/api/teams/${item.team.id}`)
      .then(r => r.json())
      .then(d => setAthletes(d.athletes ?? []));
  }, [item.id, item.team.id]);

  const markStatus = async (athleteId: string, status: string) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleItemId: item.id, athleteId, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRsvps(prev => {
        const idx = prev.findIndex(r => r.athlete.id === athleteId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [...prev, updated];
      });
    }
  };

  const saveScore = async () => {
    setSaving(true);
    await fetch(`/api/schedule/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeScore: scores.home, awayScore: scores.away }),
    });
    setSaving(false);
  };

  const getRsvp = (athleteId: string) =>
    rsvps.find(r => r.athlete.id === athleteId);

  const stats = {
    YES: rsvps.filter(r => r.status === 'YES').length,
    NO: rsvps.filter(r => r.status === 'NO').length,
    MAYBE: rsvps.filter(r => r.status === 'MAYBE').length,
    PENDING: athletes.length - rsvps.length,
  };

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} className={`rounded-lg border px-3 py-2 text-center ${v.bg}`}>
            <p className={`text-lg font-bold ${v.color}`}>{(stats as any)[k] ?? 0}</p>
            <p className="text-xs text-slate-400">{v.label}</p>
          </div>
        ))}
      </div>

      {/* Live score (games only) */}
      {(item.type === 'GAME' || item.type === 'TOURNAMENT') && (
        <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4">
          <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Swords className="h-4 w-4 text-orange-400" />Live Score
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-1">{item.team.name}</p>
              <Input
                type="number"
                value={scores.home}
                onChange={e => setScores(p => ({ ...p, home: e.target.value }))}
                className="text-center text-2xl font-bold h-14 text-white"
                min={0}
              />
            </div>
            <span className="text-slate-500 text-xl font-bold">—</span>
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 mb-1">{item.opponent ?? 'Opponent'}</p>
              <Input
                type="number"
                value={scores.away}
                onChange={e => setScores(p => ({ ...p, away: e.target.value }))}
                className="text-center text-2xl font-bold h-14 text-white"
                min={0}
              />
            </div>
            <Button onClick={saveScore} disabled={saving} className="self-end">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Athlete roster */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-2">Roster Attendance</p>
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {athletes.map((a: any) => {
            const rsvp = getRsvp(a.id);
            const status = rsvp?.status ?? 'PENDING';
            const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
            return (
              <div key={a.id} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-500 w-5 text-right font-mono">
                  {a.jerseyNumber ?? '—'}
                </span>
                <span className="text-sm text-white flex-1">
                  {a.firstName} {a.lastName}
                </span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'MAYBE'] as const).map(s => {
                    const c = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => markStatus(a.id, s)}
                        title={c.label}
                        className={`p-1.5 rounded-lg border transition-all ${
                          status === s ? c.bg : 'border-transparent opacity-30 hover:opacity-70'
                        } ${c.color}`}
                      >
                        {c.icon}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {athletes.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No athletes on this team yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', type: 'PRACTICE', startAt: '', endAt: '', location: '', opponent: '' });
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(d => {
      setTeams(d);
      if (d.length > 0) setSelectedTeam(d[0].id);
    });
  }, []);

  const loadItems = useCallback(async () => {
    if (!selectedTeam) return;
    setLoading(true);
    const res = await fetch(`/api/schedule?teamId=${selectedTeam}${filter === 'upcoming' ? '&upcoming=true' : ''}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, [selectedTeam, filter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, teamId: selectedTeam }),
    });
    setAddOpen(false);
    setNewItem({ title: '', type: 'PRACTICE', startAt: '', endAt: '', location: '', opponent: '' });
    loadItems();
  };

  const teamName = teams.find(t => t.id === selectedTeam)?.name ?? '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Schedule"
        subtitle="Track RSVP, attendance, and live game scores"
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add Event
          </Button>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Select team" /></SelectTrigger>
          <SelectContent>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {(['upcoming', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors capitalize ${
                filter === f ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'upcoming' ? 'Upcoming' : 'All Events'}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule list */}
      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading schedule…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No events scheduled. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const date = new Date(item.startAt);
            const yesCount = item.rsvps.filter(r => r.status === 'YES').length;
            const totalRsvp = item.rsvps.length;
            const hasScore = item.homeScore !== null;
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full text-left bg-slate-800/50 border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-3 transition-colors flex items-center gap-4"
              >
                {/* Date block */}
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-xs text-slate-500 uppercase">{date.toLocaleDateString('en', { month: 'short' })}</p>
                  <p className="text-xl font-bold text-white leading-none">{date.getDate()}</p>
                </div>

                {/* Type icon */}
                <div className="flex-shrink-0">{TYPE_ICONS[item.type] ?? TYPE_ICONS.OTHER}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}</span>
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{item.location}
                      </span>
                    )}
                    {item.opponent && <span>vs {item.opponent}</span>}
                  </div>
                </div>

                {/* Score or attendance */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {hasScore ? (
                    <span className="text-sm font-bold text-white bg-slate-700 px-2 py-1 rounded">
                      {item.homeScore} — {item.awayScore}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {yesCount}/{totalRsvp} RSVPd
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Attendance sheet dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {TYPE_ICONS[selected.type]}
                  {selected.title}
                  <span className="text-sm font-normal text-slate-400">
                    — {new Date(selected.startAt).toLocaleDateString()}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <AttendanceSheet item={selected} onClose={() => setSelected(null)} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add event dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Event — {teamName}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={newItem.type} onValueChange={v => setNewItem(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['PRACTICE', 'GAME', 'TOURNAMENT', 'MEETING', 'OTHER'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Opponent</Label>
                <Input
                  value={newItem.opponent}
                  onChange={e => setNewItem(p => ({ ...p, opponent: e.target.value }))}
                  placeholder="For games"
                />
              </div>
              <div className="space-y-1">
                <Label>Start *</Label>
                <Input
                  type="datetime-local"
                  value={newItem.startAt}
                  onChange={e => setNewItem(p => ({ ...p, startAt: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>End *</Label>
                <Input
                  type="datetime-local"
                  value={newItem.endAt}
                  onChange={e => setNewItem(p => ({ ...p, endAt: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                value={newItem.location}
                onChange={e => setNewItem(p => ({ ...p, location: e.target.value }))}
                placeholder="Gym A, Court 3…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add Event</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
