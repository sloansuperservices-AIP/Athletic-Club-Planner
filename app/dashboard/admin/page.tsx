'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Shield, Activity, Coins, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-300 border-red-700',
  COACH: 'bg-sky-500/20 text-sky-300 border-sky-700',
  TEAM_MANAGER: 'bg-purple-500/20 text-purple-300 border-purple-700',
  PARENT: 'bg-green-500/20 text-green-300 border-green-700',
  ATHLETE: 'bg-slate-500/20 text-slate-300 border-slate-600',
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  memberships: { team: { id: string; name: string } }[];
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [creditUser, setCreditUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleRoleChange = async () => {
    if (!editUser || !newRole) return;
    setSaving(true);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editUser.id, role: newRole }),
    });
    setSaving(false);
    setEditUser(null);
    load();
  };

  const handleCreditAdjust = async () => {
    if (!creditUser || !creditAmount) return;
    setSaving(true);
    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: creditUser.id, amount: creditAmount, reason: creditReason }),
    });
    setSaving(false);
    if (res.ok) {
      setFeedback(`Credit adjusted for ${creditUser.name}`);
      setCreditUser(null);
      setCreditAmount('');
      setCreditReason('');
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-700 rounded-lg px-4 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          {feedback}
          <button onClick={() => setFeedback('')} className="ml-auto text-green-600 hover:text-green-400">×</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search users…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={load} className="gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} users</span>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading users…</div>
      ) : (
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr>
                {['Name', 'Email', 'Role', 'Teams', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{user.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${ROLE_COLORS[user.role] ?? ''}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {user.memberships.length === 0
                      ? <span className="text-slate-600">None</span>
                      : user.memberships.map(m => m.team.name).join(', ')
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditUser(user); setNewRole(user.role); }}
                      >
                        <Shield className="h-3 w-3 mr-1" />Role
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreditUser(user)}
                      >
                        <Coins className="h-3 w-3 mr-1" />Credits
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role edit dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Change Role — {editUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['ATHLETE', 'PARENT', 'TEAM_MANAGER', 'COACH', 'ADMIN'].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={handleRoleChange} disabled={saving}>
                {saving ? 'Saving…' : 'Save Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit adjustment dialog */}
      <Dialog open={!!creditUser} onOpenChange={open => !open && setCreditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adjust Credits — {creditUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Amount (positive = add, negative = deduct)</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                placeholder="e.g. 2 or -1"
              />
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Input value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Admin adjustment" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreditUser(null)}>Cancel</Button>
              <Button onClick={handleCreditAdjust} disabled={saving || !creditAmount}>
                {saving ? 'Saving…' : 'Apply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditTab() {
  const [data, setData] = useState<{ logs: AuditLog[]; total: number; pages: number; page: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit?page=${p}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(page); }, [page]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading audit log…</div>
      ) : !data ? null : (
        <>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{data.total} entries</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>Page {data.page} of {data.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/80">
                <tr>
                  {['Time', 'User', 'Action', 'Entity', 'Change'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {log.user?.name ?? log.user?.email ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {log.entityType}
                      {log.entityId && <span className="text-slate-600 ml-1 font-mono">{log.entityId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      {log.oldValue && log.newValue ? (
                        <span className="text-slate-400">
                          <span className="text-red-400 line-through">{log.oldValue}</span>
                          {' → '}
                          <span className="text-green-400">{log.newValue}</span>
                        </span>
                      ) : log.newValue ? (
                        <span className="text-green-400">{log.newValue}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Panel"
        subtitle="User management, credit adjustments, and audit trail"
        actions={
          <Badge className="bg-red-500/20 text-red-300 border-red-700 border text-xs px-2 py-1">
            <Shield className="h-3 w-3 mr-1" />ADMIN ONLY
          </Badge>
        }
      />

      <Tabs defaultValue="users">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />Users
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Activity className="h-4 w-4" />Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
