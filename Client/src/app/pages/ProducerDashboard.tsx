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
  Search,
  Pencil,
  Ban,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
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
  return <AdminGate />;
}

function AdminGate() {
  const { t } = useI18n();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .adminSession()
      .then((r) => {
        if (mounted) setAuthenticated(Boolean(r.authenticated));
      })
      .catch(() => {
        if (mounted) setAuthenticated(false);
      })
      .finally(() => {
        if (mounted) setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    try {
      await api.adminLogin(password);
      setAuthenticated(true);
      setPassword('');
    } catch (err: any) {
      setMessage(err?.body?.error === 'ADMIN_PASSWORD_NOT_CONFIGURED' ? t('dashboard.passwordMissing') : t('dashboard.wrongPassword'));
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    await api.adminLogout().catch(() => null);
    setAuthenticated(false);
    setPassword('');
    setMessage('');
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <Card className="w-full max-w-md rounded-2xl border-slate-200 bg-white/90 p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-blue-600 dark:text-blue-400" />
          <p className="text-slate-700 dark:text-slate-300">{t('common.loading')}</p>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 via-white to-teal-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Card className="w-full max-w-md rounded-2xl border-slate-200 bg-white/95 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mb-6 text-center">
            <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.loginTitle')}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('dashboard.loginDesc')}</p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="admin-password">{t('dashboard.password')}</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {message && <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>}
            <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400" type="submit" disabled={!password || submitting}>
              {submitting ? t('common.loading') : t('dashboard.unlock')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              {t('common.exit')}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <DashboardShell onLogout={logout} />;
}

function DashboardShell({ onLogout }: { onLogout: () => void }) {
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
                variant="outline"
                size="sm"
                className="border-slate-300 bg-background/70 dark:border-slate-700 dark:bg-slate-900/50"
                onClick={onLogout}
              >
                {t('dashboard.logout')}
              </Button>
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
  const { t, dir } = useI18n();
  const location = useLocation();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterOrigin, setFilterOrigin] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<{
    id: string;
    product_name: string;
    product_type: string;
    origin_region: string;
    quantity: string;
    production_date: string;
    expiry_date: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError('');
    api
      .listBatches()
      .then((r) => {
        if (!mounted) return;
        setBatches(r.batches);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setLoadError(e?.body?.error || e?.message || 'Failed to load batches');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const typeOptions = useMemo(() => {
    return Array.from(new Set(batches.map((b) => String(b.product_type || '').trim()).filter(Boolean)))
      .filter((type) => type.toUpperCase() !== 'TEST')
      .sort((a, b) => a.localeCompare(b));
  }, [batches]);

  useEffect(() => {
    if (filterType !== 'ALL' && !typeOptions.includes(filterType)) {
      setFilterType('ALL');
    }
  }, [filterType, typeOptions]);

  const originOptions = OMAN_WILAYAT;

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const query = searchTerm.toLowerCase();
      const type = String(b.product_type || '').trim();
      const origin = String(b.origin_region || '').trim();
      const revoked = Boolean(b.revoked);
      const hasVerifyAction = Boolean(b.sample_label_code);
      const searchable = [b.id, b.product_name, b.product_type, b.origin_region]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(' ');

      if (filterType !== 'ALL' && type !== filterType) return false;
      if (filterOrigin !== 'ALL' && origin !== filterOrigin) return false;
      if (filterStatus === 'ACTIVE' && revoked) return false;
      if (filterStatus === 'REVOKED' && !revoked) return false;
      if (filterAction === 'VERIFY_LABEL' && !hasVerifyAction) return false;
      if (filterAction === 'NO_LABELS' && hasVerifyAction) return false;
      if (query && !searchable.includes(query)) return false;

      return true;
    });
  }, [batches, filterAction, filterOrigin, filterStatus, filterType, searchTerm]);

  const num = useMemo(() => new Intl.NumberFormat(dir === 'rtl' ? 'ar' : 'en-US'), [dir]);

  function openEdit(batch: any) {
    setActionMessage('');
    setActionError(false);
    setEditForm({
      id: batch.id,
      product_name: batch.product_name || '',
      product_type: batch.product_type || '',
      origin_region: batch.origin_region || '',
      quantity: batch.quantity === null || batch.quantity === undefined ? '' : String(batch.quantity),
      production_date: batch.production_date || '',
      expiry_date: batch.expiry_date || '',
      description: batch.description || '',
    });
    setEditOpen(true);
  }

  async function saveBatchEdit() {
    if (!editForm) return;
    setEditSaving(true);
    setActionMessage('');
    setActionError(false);

    try {
      const payload = {
        product_name: editForm.product_name,
        product_type: editForm.product_type,
        origin_region: editForm.origin_region,
        quantity: editForm.quantity === '' ? null : Number(editForm.quantity),
        production_date: editForm.production_date || null,
        expiry_date: editForm.expiry_date || null,
        description: editForm.description || null,
      };

      const r = await api.updateBatch(editForm.id, payload);
      setBatches((prev) => prev.map((b) => (b.id === r.batch.id ? { ...b, ...r.batch } : b)));
      setEditOpen(false);
      setEditForm(null);
      setActionMessage(t('dashboard.batchUpdated'));
    } catch (e: any) {
      setActionError(true);
      setActionMessage(`${t('common.error')}: ${e?.body?.error || e.message}`);
    } finally {
      setEditSaving(false);
    }
  }

  async function revokeBatchFromTable(batch: any) {
    if (batch.revoked) return;
    const reason = window.prompt(t('dashboard.revokePrompt'));
    if (reason === null) return;

    setActionMessage('');
    setActionError(false);

    try {
      const r = await api.revokeBatch(batch.id, reason);
      setBatches((prev) => prev.map((b) => (b.id === r.batch.id ? { ...b, ...r.batch } : b)));
      setActionMessage(t('revoke.ok'));
    } catch (e: any) {
      setActionError(true);
      setActionMessage(`${t('common.error')}: ${e?.body?.error || e.message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('nav.batches')}</h1>
      </div>

      {actionMessage && (
        <p className={cn('text-sm', actionError ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300')}>
          {actionMessage}
        </p>
      )}

      <Card className="rounded-2xl border-slate-200 bg-white/85 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.filters.title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.filters.desc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              {`${t('dashboard.filters.shown')} ${num.format(filteredBatches.length)} / ${num.format(batches.length)}`}
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('dashboard.table.type')}</p>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder={t('dashboard.table.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common.all')}</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {translateProductType(type, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('dashboard.table.origin')}</p>
            <Select value={filterOrigin} onValueChange={setFilterOrigin}>
              <SelectTrigger>
                <SelectValue placeholder={t('dashboard.table.origin')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common.all')}</SelectItem>
                {originOptions.map((origin) => (
                  <SelectItem key={origin} value={origin}>
                    {origin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('common.status')}</p>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common.all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('dashboard.active')}</SelectItem>
                <SelectItem value="REVOKED">{t('dashboard.revokedBadge')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('common.actions')}</p>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.actions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('common.all')}</SelectItem>
                <SelectItem value="VERIFY_LABEL">{t('dashboard.verifyLabel')}</SelectItem>
                <SelectItem value="NO_LABELS">{t('dashboard.noLabels')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-lg">
            <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">{t('common.search')}</p>
            <div className="relative">
              <Search
                className={cn(
                  'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400',
                  dir === 'rtl' ? 'right-3' : 'left-3',
                )}
              />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(dir === 'rtl' ? 'pr-9 text-right' : 'pl-9')}
                placeholder={t('dashboard.searchPh')}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto rounded-2xl border-slate-200 bg-white/85 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100/80 dark:bg-slate-900">
              <TableHead className={cn('w-[24%]', dir === 'rtl' ? 'text-right' : 'text-left')}>
                {t('dashboard.table.id')}
              </TableHead>
              <TableHead className={cn('w-[20%]', dir === 'rtl' ? 'text-right' : 'text-left')}>
                {t('dashboard.table.product')}
              </TableHead>
              <TableHead className="text-center">{t('dashboard.table.type')}</TableHead>
              <TableHead className="text-center">{t('dashboard.table.origin')}</TableHead>
              <TableHead className="text-center">{t('dashboard.table.labels')}</TableHead>
              <TableHead className="text-center">{t('common.status')}</TableHead>
              <TableHead className="text-center">{t('common.actions')}</TableHead>
              <TableHead className="text-center">{t('dashboard.editing')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading &&
              !loadError &&
              filteredBatches.map((b, i) => (
              <TableRow key={b.id} className={cn(i % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-slate-50/70 dark:bg-slate-950/40', 'hover:bg-blue-50/70 dark:hover:bg-slate-800')}>
                <TableCell className={cn('font-mono text-xs ltr', dir === 'rtl' ? 'text-right' : 'text-left')}>
                  {b.id}
                </TableCell>
                <TableCell className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>{b.product_name}</TableCell>
                <TableCell className="text-center">{translateProductType(b.product_type, t)}</TableCell>
                <TableCell className="text-center">{b.origin_region || '-'}</TableCell>
                <TableCell className="text-center tabular-nums">{b.label_count ?? 0}</TableCell>
                <TableCell className="text-center">
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
                <TableCell className="text-center">
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
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openEdit(b)}
                      aria-label={t('dashboard.editBatch')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => revokeBatchFromTable(b)}
                      disabled={b.revoked}
                      aria-label={t('revoke.submit')}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            )}
            {!loading && loadError && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-rose-600 dark:text-rose-300">
                  {loadError}
                </TableCell>
              </TableRow>
            )}
            {!loading && !loadError && filteredBatches.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  <p>{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!editSaving) {
            setEditOpen(open);
            if (!open) setEditForm(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('dashboard.editBatch')}</DialogTitle>
            <DialogDescription>{t('dashboard.editBatchDesc')}</DialogDescription>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t('create.productName')}</Label>
                  <Input
                    value={editForm.product_name}
                    onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t('create.productType')}</Label>
                  <Input
                    value={editForm.product_type}
                    onChange={(e) => setEditForm({ ...editForm, product_type: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t('create.origin')}</Label>
                  <Input
                    value={editForm.origin_region}
                    onChange={(e) => setEditForm({ ...editForm, origin_region: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t('create.quantity')}</Label>
                  <Input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t('create.productionDate')}</Label>
                  <Input
                    type="date"
                    value={editForm.production_date}
                    onChange={(e) => setEditForm({ ...editForm, production_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>{t('create.expiryDate')}</Label>
                  <Input
                    type="date"
                    value={editForm.expiry_date}
                    onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>{t('create.description')}</Label>
                <Textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveBatchEdit} disabled={!editForm || editSaving}>
              {t('dashboard.updateBatch')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      await api.revokeBatch(batchId, reason);
      setMsg(t('revoke.ok'));
    } catch (e: any) {
      setMsg(`${t('common.error')}: ${e?.body?.error || e.message}`);
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

