import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  FileSignature,
  QrCode,
  AlertTriangle,
  Menu,
  X,
  ShieldCheck,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  ScanLine,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { StatsCard } from '@/app/components/shared/StatsCard';
import { LanguageToggle } from '@/app/components/shared/LanguageToggle';
import { ThemeToggle } from '@/app/components/shared/ThemeToggle';
import { api } from '@/app/lib/api';
import { translateEventType, translateProductType, useI18n } from '@/app/lib/i18n';
import { cn } from '@/app/components/ui/utils';

const OMAN_WILAYAT = ['Muscat', 'Muttrah', 'Seeb', 'Bawshar', 'Nizwa', 'Sohar', 'Sur', 'Salalah', 'Ibri', 'Rustaq'];

const PRODUCT_TYPES = [
  { value: 'HONEY', key: 'product.HONEY' },
  { value: 'FRANKINCENSE', key: 'product.FRANKINCENSE' },
  { value: 'DATES', key: 'product.DATES' },
  { value: 'FISH', key: 'product.FISH' },
];

const EVENT_TYPES = [
  'ORIGIN_DECLARED',
  'HARVEST_OR_CATCH',
  'PROCESSING',
  'PACKAGING',
  'TRANSPORT',
  'STORAGE',
  'RETAIL_DELIVERY',
  'QUALITY_TEST',
];

const TAB_IDS = ['overview', 'batches', 'create', 'events', 'sign', 'labels', 'revoke'] as const;

type BatchRow = any;

type AdminStats = {
  totalBatches: number;
  totalLabels: number;
  totalEvents: number;
  signedEvents: number;
  revoked: number;
  totalScans: number;
};

export function ProducerDashboard() {
  return <DashboardShell />;
}

function DashboardShell() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab && TAB_IDS.includes(initialTab as (typeof TAB_IDS)[number]) ? initialTab : 'overview'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'batches', label: t('nav.batches'), icon: Package },
    { id: 'create', label: t('nav.create'), icon: Plus },
    { id: 'events', label: t('nav.events'), icon: MapPin },
    { id: 'sign', label: t('nav.sign'), icon: FileSignature },
    { id: 'labels', label: t('nav.labels'), icon: QrCode },
    { id: 'revoke', label: t('nav.revoke'), icon: AlertTriangle },
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TAB_IDS.includes(tab as (typeof TAB_IDS)[number]) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab, searchParams]);

  function selectTab(tabId: string) {
    setActiveTab(tabId);
    setSidebarOpen(false);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="min-h-screen animate-fade-in bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Link to="/" className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.title')}</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-300 bg-background/70 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <Link to="/">{t('common.exit')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-gradient-to-b from-blue-50 via-white to-teal-50 transition-transform duration-300 ease-in-out dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <nav className="mt-16 space-y-2 p-4 lg:mt-0">
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500" />
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('app.name')}</div>
              </div>
              <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('dashboard.panel')}</div>
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => selectTab(item.id)}
                className={cn(
                  'w-full rounded-xl px-4 py-3 text-left transition-all',
                  'flex items-center gap-3',
                  activeTab === item.id
                    ? 'border border-blue-100 bg-white font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300 dark:ring-blue-900'
                    : 'text-slate-700 hover:border hover:border-slate-200 hover:bg-white/70 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900/70',
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-gradient-to-b from-slate-50 via-white to-teal-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 lg:p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'batches' && <AllBatchesTab />}
          {activeTab === 'create' && <CreateBatchTab />}
          {activeTab === 'events' && <AddEventsTab />}
          {activeTab === 'sign' && <SignEventsTab />}
          {activeTab === 'labels' && <GenerateLabelsTab />}
          {activeTab === 'revoke' && <RevokeBatchTab />}
        </main>
      </div>
    </div>
  );
}


function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  return <OverviewInner stats={stats} setStats={setStats} />;
}

function OverviewInner({ stats, setStats }: { stats: AdminStats | null; setStats: (s: AdminStats) => void }) {
  const { t } = useI18n();

  useEffect(() => {
    api.adminStats().then((r) => setStats(r.stats));
  }, [setStats]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.overview')}</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title={t('dashboard.totalScans')} value={String(stats?.totalScans ?? '—')} icon={ScanLine} tone="blue" />
        <StatsCard title={t('dashboard.batches')} value={String(stats?.totalBatches ?? '—')} icon={Package} tone="teal" />
        <StatsCard title={t('dashboard.signedEvents')} value={String(stats?.signedEvents ?? '—')} icon={CheckCircle} tone="emerald" />
        <StatsCard title={t('dashboard.revoked')} value={String(stats?.revoked ?? '—')} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <StatsCard title={t('dashboard.labels')} value={String(stats?.totalLabels ?? '—')} icon={TrendingUp} tone="violet" />
        <StatsCard title={t('dashboard.events')} value={String(stats?.totalEvents ?? '—')} icon={MapPin} tone="amber" />
      </div>
    </div>
  );
}

function AllBatchesTab() {
  const { t } = useI18n();
  const location = useLocation();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    api.listBatches(filterType === 'ALL' ? undefined : filterType).then((r) => setBatches(r.batches));
  }, [filterType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('nav.batches')}</h1>
        <div className="w-64">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder={t('dashboard.filterType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('common.all')}</SelectItem>
              {PRODUCT_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {t(pt.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-x-auto rounded-2xl border-slate-200 bg-white/85 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100/80 dark:bg-slate-900">
              <TableHead>{t('dashboard.table.id')}</TableHead>
              <TableHead>{t('dashboard.table.product')}</TableHead>
              <TableHead>{t('dashboard.table.type')}</TableHead>
              <TableHead>{t('dashboard.table.origin')}</TableHead>
              <TableHead>{t('dashboard.table.labels')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((b, i) => (
              <TableRow key={b.id} className={cn(i % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/70 dark:bg-slate-950/40', 'hover:bg-blue-50/70 dark:hover:bg-slate-800')}>
                <TableCell className="font-mono text-xs">{b.id}</TableCell>
                <TableCell>{b.product_name}</TableCell>
                <TableCell>{translateProductType(b.product_type, t)}</TableCell>
                <TableCell>{b.origin_region || '—'}</TableCell>
                <TableCell>{b.label_count ?? 0}</TableCell>
                <TableCell>
                  {b.revoked ? (
                    <Badge className="border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                      <XCircle className="mr-1 h-3 w-3" />
                      {t('dashboard.revokedBadge')}
                    </Badge>
                  ) : (
                    <Badge className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {t('dashboard.active')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {b.sample_label_code ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to={`/verify/${b.sample_label_code}`}
                        state={{ backTo: `${location.pathname}?tab=batches` }}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        {t('dashboard.verifyLabel')}
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.noLabels')}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function CreateBatchTab() {
  const { t } = useI18n();
  const [form, setForm] = useState<any>({
    product_name: '',
    product_type: '',
    origin_region: '',
    quantity: 0,
    production_date: '',
    expiry_date: '',
    description: '',
  });
  const [result, setResult] = useState<string>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult('');
    try {
      const r = await api.createBatch(form);
      setResult(`${t('create.ok')}: ${r.batch.id}`);
    } catch (err: any) {
      setResult(`${t('common.error')}: ${err?.body?.error || err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('create.title')}</h1>
      <Card className="rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('create.productName')}</Label>
              <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder={t('create.productNamePh')} />
            </div>

            <div className="space-y-2">
              <Label>{t('create.productType')}</Label>
              <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('create.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {t(pt.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('create.origin')}</Label>
              <Select value={form.origin_region} onValueChange={(v) => setForm({ ...form, origin_region: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('create.selectWilaya')} />
                </SelectTrigger>
                <SelectContent>
                  {OMAN_WILAYAT.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('create.quantity')}</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>

            <div className="space-y-2">
              <Label>{t('create.productionDate')}</Label>
              <Input type="date" value={form.production_date} onChange={(e) => setForm({ ...form, production_date: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>{t('create.expiryDate')}</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <div className="space-y-2">
              <Label>{t('create.description')}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400" type="submit">
              <Package className="mr-2 h-4 w-4" />
              {t('create.submit')}
            </Button>
            {result && <span className="text-sm text-slate-700 dark:text-slate-300">{result}</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}

function AddEventsTab() {
  const { t } = useI18n();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [eventType, setEventType] = useState<string>('ORIGIN_DECLARED');
  const [location, setLocation] = useState<string>('');
  const [payloadText, setPayloadText] = useState<string>('{}');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    api.listBatches().then((r) => setBatches(r.batches));
  }, []);

  async function submit() {
    setMsg('');
    try {
      const payload = JSON.parse(payloadText || '{}');
      const r = await api.addEvent(batchId, { event_type: eventType, location, payload, trust_tier: 'B' });
      setMsg(`${t('events.ok')}: ${r.event.id}`);
    } catch (e: any) {
      setMsg(`${t('common.error')}: ${e?.body?.error || e.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('events.title')}</h1>
      <Card className="space-y-4 rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('events.batch')}</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger>
                <SelectValue placeholder={t('events.selectBatch')} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.product_name} - {b.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('events.type')}</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((et) => (
                  <SelectItem key={et} value={et}>
                    {translateEventType(et, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('events.location')}</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('events.locationPh')} />
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <div className="space-y-2">
            <Label>{t('events.payload')}</Label>
            <Textarea value={payloadText} onChange={(e) => setPayloadText(e.target.value)} rows={6} className="font-mono" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={submit} disabled={!batchId}>
            {t('events.submit')}
          </Button>
          {msg && <span className="text-sm text-slate-700 dark:text-slate-300">{msg}</span>}
        </div>
      </Card>
    </div>
  );
}

function SignEventsTab() {
  const { t } = useI18n();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function loadBatch(id: string) {
    setBatchId(id);
    if (!id) return;
    const r = await api.getBatch(id);
    setEvents(r.events);
  }

  useEffect(() => {
    api.listBatches().then((r) => setBatches(r.batches));
  }, []);

  async function sign(eventId: string) {
    setMsg('');
    try {
      await api.signEvent(eventId);
      const r = await api.getBatch(batchId);
      setEvents(r.events);
      setMsg(t('sign.signed'));
    } catch (e: any) {
      setMsg(`${t('common.error')}: ${e?.body?.error || e.message}`);
    }
  }

  const unsigned = useMemo(() => events.filter((e) => !e.signature), [events]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('sign.title')}</h1>
      <Card className="space-y-4 rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="space-y-2">
          <Label>{t('events.batch')}</Label>
          <Select value={batchId} onValueChange={loadBatch}>
            <SelectTrigger>
              <SelectValue placeholder={t('events.selectBatch')} />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.product_name} - {b.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {batchId && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('sign.unsigned')}: {unsigned.length}
            </p>
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{translateEventType(e.event_type, t)}</div>
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{e.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.signature ? (
                      <Badge className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {t('sign.signed')}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => sign(e.id)}>
                        <FileSignature className="mr-2 h-4 w-4" />
                        {t('sign.submit')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {msg && <span className="text-sm text-slate-700 dark:text-slate-300">{msg}</span>}
      </Card>
    </div>
  );
}

function GenerateLabelsTab() {
  const { t } = useI18n();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [count, setCount] = useState<number>(10);
  const [labels, setLabels] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.listBatches().then((r) => setBatches(r.batches));
  }, []);

  async function generate() {
    setMsg('');
    try {
      const r = await api.createLabels(batchId, count);
      setLabels(r.labels);
      setMsg(`${t('labels.ok')}: ${r.labels.length}`);
    } catch (e: any) {
      setMsg(`${t('common.error')}: ${e?.body?.error || e.message}`);
    }
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('labels.title')}</h1>
      <Card className="space-y-4 rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('events.batch')}</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger>
                <SelectValue placeholder={t('events.selectBatch')} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.product_name} - {b.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('labels.count')}</Label>
            <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <Button onClick={generate} disabled={!batchId}>
              <QrCode className="mr-2 h-4 w-4" />
              {t('labels.submit')}
            </Button>
          </div>
        </div>

        {msg && <div className="text-sm text-slate-700 dark:text-slate-300">{msg}</div>}

        {labels.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('labels.latest')}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {labels.slice(0, 20).map((l) => (
                <div key={l.code} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="font-mono text-xs">{l.code}</div>
                  <a
                    className="text-sm text-blue-600 dark:text-blue-300"
                    href={`/api/labels/${encodeURIComponent(l.code)}/qr`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('labels.png')}
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('labels.first20')}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function RevokeBatchTab() {
  const { t } = useI18n();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.listBatches().then((r) => setBatches(r.batches));
  }, []);

  async function revoke() {
    setMsg('');
    try {
      const r = await fetch(`/api/batches/${encodeURIComponent(batchId)}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'HTTP_ERROR');
      setMsg(t('revoke.ok'));
    } catch (e: any) {
      setMsg(`${t('common.error')}: ${e.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('revoke.title')}</h1>
      <Card className="space-y-4 rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="space-y-2">
          <Label>{t('events.batch')}</Label>
          <Select value={batchId} onValueChange={setBatchId}>
            <SelectTrigger>
              <SelectValue placeholder={t('events.selectBatch')} />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.product_name} - {b.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('revoke.reason')}</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('revoke.reasonPh')} />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="destructive" onClick={revoke} disabled={!batchId}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('revoke.submit')}
          </Button>
          {msg && <span className="text-sm text-slate-700 dark:text-slate-300">{msg}</span>}
        </div>
      </Card>
    </div>
  );
}
