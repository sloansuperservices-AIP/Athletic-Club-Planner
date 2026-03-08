'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2, Mail, Phone, DollarSign, CheckCircle2, Clock, XCircle, Pencil } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PROSPECT: { label: 'Prospect', color: 'bg-slate-500/20 text-slate-300 border-slate-600', icon: <Clock className="h-3 w-3" /> },
  ACTIVE: { label: 'Active', color: 'bg-green-500/20 text-green-300 border-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  LAPSED: { label: 'Lapsed', color: 'bg-red-500/20 text-red-300 border-red-700', icon: <XCircle className="h-3 w-3" /> },
  DECLINED: { label: 'Declined', color: 'bg-orange-500/20 text-orange-300 border-orange-700', icon: <XCircle className="h-3 w-3" /> },
};

const TIER_CONFIG: Record<string, { color: string }> = {
  Platinum: { color: 'bg-sky-500/20 text-sky-300 border-sky-700' },
  Gold: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-700' },
  Silver: { color: 'bg-slate-400/20 text-slate-300 border-slate-600' },
  Bronze: { color: 'bg-orange-700/20 text-orange-400 border-orange-800' },
};

interface Deliverable {
  id: string;
  description: string;
  dueDate: string | null;
  completedAt: string | null;
}

interface Sponsor {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  tierName: string | null;
  amount: number | null;
  logoUrl: string | null;
  notes: string | null;
  status: string;
  deliverables: Deliverable[];
}

function SponsorCard({ sponsor, onEdit }: { sponsor: Sponsor; onEdit: (s: Sponsor) => void }) {
  const statusCfg = STATUS_CONFIG[sponsor.status] || STATUS_CONFIG.PROSPECT;
  const tierCfg = sponsor.tierName ? TIER_CONFIG[sponsor.tierName] : null;

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {sponsor.logoUrl ? (
              <img src={sponsor.logoUrl} alt={sponsor.name} className="h-10 w-10 rounded-lg object-contain bg-white p-1" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
            )}
            <div>
              <CardTitle className="text-white text-base">{sponsor.name}</CardTitle>
              {sponsor.tierName && (
                <span className={`text-xs px-2 py-0.5 rounded border ${tierCfg?.color ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                  {sponsor.tierName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${statusCfg.color}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
            <button
              onClick={() => onEdit(sponsor)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sponsor.amount && (
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>${sponsor.amount.toLocaleString()}</span>
          </div>
        )}
        {sponsor.contactName && (
          <div className="text-sm text-slate-300">{sponsor.contactName}</div>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {sponsor.contactEmail && (
            <a href={`mailto:${sponsor.contactEmail}`} className="flex items-center gap-1 hover:text-sky-400 transition-colors">
              <Mail className="h-3 w-3" />
              {sponsor.contactEmail}
            </a>
          )}
          {sponsor.contactPhone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {sponsor.contactPhone}
            </span>
          )}
        </div>
        {sponsor.deliverables.length > 0 && (
          <div className="border-t border-slate-700 pt-2 mt-2">
            <p className="text-xs text-slate-500 mb-1">Deliverables ({sponsor.deliverables.filter(d => d.completedAt).length}/{sponsor.deliverables.length} done)</p>
            <div className="space-y-1">
              {sponsor.deliverables.slice(0, 3).map(d => (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  {d.completedAt
                    ? <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />
                    : <Clock className="h-3 w-3 text-slate-500 flex-shrink-0" />
                  }
                  <span className={d.completedAt ? 'text-slate-500 line-through' : 'text-slate-300'}>
                    {d.description}
                  </span>
                </div>
              ))}
              {sponsor.deliverables.length > 3 && (
                <p className="text-xs text-slate-500">+{sponsor.deliverables.length - 3} more</p>
              )}
            </div>
          </div>
        )}
        {sponsor.notes && (
          <p className="text-xs text-slate-500 italic">{sponsor.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SponsorForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Sponsor>;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    contactName: initial?.contactName ?? '',
    contactEmail: initial?.contactEmail ?? '',
    contactPhone: initial?.contactPhone ?? '',
    tierName: initial?.tierName ?? '',
    amount: initial?.amount?.toString() ?? '',
    logoUrl: initial?.logoUrl ?? '',
    notes: initial?.notes ?? '',
    status: initial?.status ?? 'PROSPECT',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Company Name *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Acme Corp" />
        </div>
        <div className="space-y-1">
          <Label>Contact Name</Label>
          <Input value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Jane Smith" />
        </div>
        <div className="space-y-1">
          <Label>Contact Email</Label>
          <Input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Tier</Label>
          <Select value={form.tierName} onValueChange={v => set('tierName', v)}>
            <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
            <SelectContent>
              {['Platinum', 'Gold', 'Silver', 'Bronze'].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Amount ($)</Label>
          <Input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="5000" />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Logo URL</Label>
          <Input value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/sponsors');
    if (res.ok) setSponsors(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (data: any) => {
    await fetch('/api/sponsors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    load();
  };

  const handleEdit = async (data: any) => {
    if (!editSponsor) return;
    await fetch(`/api/sponsors/${editSponsor.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    load();
  };

  const filtered = filter === 'ALL' ? sponsors : sponsors.filter(s => s.status === filter);

  const totalActive = sponsors.filter(s => s.status === 'ACTIVE').length;
  const totalRevenue = sponsors.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const pending = sponsors.filter(s => s.status === 'PROSPECT').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sponsors"
        subtitle="Manage club partnerships and sponsorship deliverables"
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Sponsor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Sponsor</DialogTitle></DialogHeader>
              <SponsorForm onSave={handleAdd} onClose={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Sponsors', value: totalActive, color: 'text-green-400' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-sky-400' },
          { label: 'Prospects', value: pending, color: 'text-yellow-400' },
        ].map(stat => (
          <Card key={stat.label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['ALL', 'PROSPECT', 'ACTIVE', 'LAPSED', 'DECLINED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === s ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
            <span className="ml-1.5 text-xs opacity-70">
              {s === 'ALL' ? sponsors.length : sponsors.filter(x => x.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-12">Loading sponsors…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No sponsors yet. Add your first sponsor to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <SponsorCard key={s.id} sponsor={s} onEdit={setEditSponsor} />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editSponsor} onOpenChange={open => !open && setEditSponsor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Sponsor</DialogTitle></DialogHeader>
          {editSponsor && (
            <SponsorForm initial={editSponsor} onSave={handleEdit} onClose={() => setEditSponsor(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
