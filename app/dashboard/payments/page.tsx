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
import {
  DollarSign, TrendingUp, Users, Clock, CreditCard, CheckCircle2,
  AlertCircle, Plus, Download
} from 'lucide-react';

interface PaymentEntry {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface Summary {
  userId: string;
  name: string;
  email: string;
  total: number;
  entries: number;
}

const PAYMENT_TYPES = [
  { value: 'Registration Fee', label: 'Registration Fee' },
  { value: 'Tournament Entry Fee', label: 'Tournament Entry Fee' },
  { value: 'Uniform Fee', label: 'Uniform Fee' },
  { value: 'Equipment Fee', label: 'Equipment Fee' },
  { value: 'Travel Stipend', label: 'Travel Stipend' },
  { value: 'Fundraiser Contribution', label: 'Fundraiser Contribution' },
  { value: 'Admin Adjustment', label: 'Admin Adjustment' },
];

export default function PaymentsPage() {
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'summary' | 'ledger'>('summary');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', amount: '', reason: 'Registration Fee', note: '' });
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/payments');
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
      setSummary(data.summary);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (addOpen) loadUsers(); }, [addOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: form.userId, amount: form.amount, reason: form.reason }),
    });
    setSaving(false);
    setAddOpen(false);
    setForm({ userId: '', amount: '', reason: 'Registration Fee', note: '' });
    load();
  };

  const totalCollected = entries.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  const totalOwed = Math.abs(entries.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0));
  const uniqueFamilies = new Set(entries.map(e => e.userId)).size;
  const pending = summary.filter(s => s.total < 0).length;

  const filteredSummary = summary.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Fees"
        subtitle="Track club fees, tournament entries, and financial records"
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Record Payment
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `$${totalCollected.toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-green-400' },
          { label: 'Pending/Owed', value: `$${totalOwed.toLocaleString()}`, icon: <Clock className="h-5 w-5" />, color: 'text-yellow-400' },
          { label: 'Families', value: uniqueFamilies, icon: <Users className="h-5 w-5" />, color: 'text-sky-400' },
          { label: 'Overdue Accounts', value: pending, icon: <AlertCircle className="h-5 w-5" />, color: 'text-red-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-3 flex items-start gap-3">
              <div className={`mt-0.5 ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {(['summary', 'ledger'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                view === v ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {v === 'summary' ? 'By Family' : 'All Entries'}
            </button>
          ))}
        </div>
        {view === 'summary' && (
          <Input
            placeholder="Search families…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        )}
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading payment records…</div>
      ) : view === 'summary' ? (
        /* Summary view */
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr>
                {['Family', 'Email', 'Total Paid', 'Entries', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">No payment records yet.</td>
                </tr>
              ) : filteredSummary.map(s => (
                <tr key={s.userId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{s.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${s.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {s.total >= 0 ? '+' : ''}{s.total.toFixed(2)} credits
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{s.entries}</td>
                  <td className="px-4 py-3">
                    {s.total > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded border bg-green-500/20 text-green-300 border-green-700 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />Current
                      </span>
                    ) : s.total < 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-700 flex items-center gap-1 w-fit">
                        <AlertCircle className="h-3 w-3" />Overdue
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">No records</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Ledger view */
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80">
              <tr>
                {['Date', 'Family', 'Description', 'Amount'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">No payment entries yet.</td>
                </tr>
              ) : entries.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-white">{e.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{e.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-semibold ${e.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {e.amount > 0 ? '+' : ''}{e.amount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record payment dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment / Fee</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Family *</Label>
              <Select value={form.userId} onValueChange={v => setForm(p => ({ ...p, userId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select family" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.reason} onValueChange={v => setForm(p => ({ ...p, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount (positive = paid, negative = owed)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 150 or -150"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !form.userId || !form.amount}>
                {saving ? 'Saving…' : 'Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
