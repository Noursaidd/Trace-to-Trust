import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, AlertCircle, Package, ScanSearch, ShieldAlert } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import { VerificationBadge } from '@/app/components/shared/VerificationBadge';
import { Timeline, TimelineEvent } from '@/app/components/shared/Timeline';
import { LanguageToggle } from '@/app/components/shared/LanguageToggle';
import { ThemeToggle } from '@/app/components/shared/ThemeToggle';
import { api } from '@/app/lib/api';
import { translateEventType, translateProductType, useI18n } from '@/app/lib/i18n';

export function VerifyPage() {
  const { code = '' } = useParams();
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setErr('');
    setLoading(false);
    if (!code) return;
    setLoading(true);
    api
      .verify(code)
      .then((r) => setData(r))
      .catch((e: any) => setErr(e?.body?.error || e.message))
      .finally(() => setLoading(false));
  }, [code]);

  const status = data?.status as 'valid' | 'tampered' | 'unsigned' | 'revoked' | undefined;
  const badgeStatus = status === 'valid' ? 'valid' : status === 'tampered' ? 'tampered' : 'partial';

  const events: TimelineEvent[] = useMemo(() => {
    const evs = (data?.events || []) as any[];
    return evs.map((e) => ({
      title: translateEventType(e.event_type, t),
      location: e.location || undefined,
      date: e.timestamp ? new Date(e.timestamp).toLocaleDateString() : '—',
      time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : undefined,
    }));
  }, [data, t]);

  return (
    <div className="min-h-screen animate-fade-in bg-gradient-to-b from-blue-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('verify.title')}</h1>
                  <p className="text-slate-600 dark:text-slate-300">
                    {t('verify.qr')}: <span className="font-mono text-xs">{code}</span>
                  </p>
                </div>
                <Badge variant="secondary" className="dark:bg-slate-800 dark:text-slate-100">
                  <Package className="mr-2 h-4 w-4" />
                  {t('common.batch')}
                </Badge>
              </div>

              {err && (
                <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="mr-2 inline h-4 w-4" />
                  {err}
                </div>
              )}

              {loading && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  ))}
                </div>
              )}

              {data && !loading && (
                <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="mb-1 text-slate-500 dark:text-slate-400">{t('verify.product')}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{data.batch.product_name}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="mb-1 text-slate-500 dark:text-slate-400">{t('verify.type')}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{translateProductType(data.batch.product_type, t)}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="mb-1 text-slate-500 dark:text-slate-400">{t('verify.origin')}</div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <MapPin className="h-4 w-4" />
                      {data.batch.origin_region || '—'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="mb-1 text-slate-500 dark:text-slate-400">{t('verify.expiry')}</div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <Calendar className="h-4 w-4" />
                      {data.batch.expiry_date || '—'}
                    </div>
                  </div>
                </div>
              )}

              {data?.suspicious && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                  <ShieldAlert className="mr-2 inline h-4 w-4" />
                  {t('verify.cloneWarn')}
                </div>
              )}
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">{t('verify.journey')}</h2>
              {events.length > 0 ? <Timeline events={events} /> : <p className="text-slate-600 dark:text-slate-300">{t('verify.noEvents')}</p>}
            </Card>
          </div>

          <div className="space-y-6">
            <VerificationBadge status={badgeStatus} size="lg" />

            {status === 'revoked' && (
              <Card className="rounded-2xl border-rose-300 bg-rose-50 p-6 dark:border-rose-800 dark:bg-rose-950/30">
                <h3 className="mb-2 font-bold text-rose-800 dark:text-rose-300">{t('verify.revoked')}</h3>
                <p className="text-sm text-rose-700 dark:text-rose-300">{t('verify.revokedDesc')}</p>
              </Card>
            )}

            <Card className="rounded-2xl border-slate-200 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <ScanSearch className="h-4 w-4" />
                {t('verify.scanCount')}
              </h3>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{data?.scan_count ?? '—'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('verify.scanHelp')}</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
