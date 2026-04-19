import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Package, QrCode, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { QrScanner } from '@/app/components/shared/QrScanner';
import { Card } from '@/app/components/ui/card';
import { OmaniPattern } from '@/app/components/shared/OmaniPattern';
import { LanguageToggle } from '@/app/components/shared/LanguageToggle';
import { ThemeToggle } from '@/app/components/shared/ThemeToggle';
import { translateProductType, useI18n } from '@/app/lib/i18n';

const categories = [
  {
    name: 'Honey',
    image: 'https://images.unsplash.com/photo-1691480208637-6ed63aac6694?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbWFuaSUyMGhvbmV5JTIwamFyfGVufDF8fHx8MTc2OTA3ODc2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Frankincense',
    image: 'https://images.unsplash.com/photo-1624608959711-4b66e68aa50e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFua2luY2Vuc2UlMjBvbWFufGVufDF8fHx8MTc2OTA3ODc2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Dates',
    image: 'https://images.unsplash.com/photo-1691657917109-c6e027eac44a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRlcyUyMGZydWl0fGVufDF8fHx8MTc2OTA3ODc2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Fish',
    image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGZpc2h8ZW58MXx8fHwxNzY5MDMxMjExfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export function LandingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);

  const steps = [
    {
      icon: Package,
      title: t('landing.step1.title'),
      description: t('landing.step1.desc'),
    },
    {
      icon: FileCheck,
      title: t('landing.step2.title'),
      description: t('landing.step2.desc'),
    },
    {
      icon: QrCode,
      title: t('landing.step3.title'),
      description: t('landing.step3.desc'),
    },
  ];

  return (
    <div className="min-h-screen animate-fade-in bg-gradient-to-b from-blue-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-2xl font-bold text-transparent">
                {t('app.name')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <OmaniPattern />
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-slate-900 dark:text-slate-100 md:text-6xl">{t('landing.hero.title')}</h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-600 dark:text-slate-300">{t('landing.hero.desc')}</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setShowScanner(true)}
                aria-label={t('landing.hero.scan')}
                className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-blue-700 p-0 text-white shadow-xl shadow-blue-500/40 transition-transform hover:scale-105 hover:from-blue-700 hover:to-blue-800 active:scale-95 dark:from-blue-500 dark:to-blue-600 sm:mx-0 sm:h-14 sm:w-auto sm:px-6"
              >
                <span className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-white/10" />
                <QrCode className="h-10 w-10 sm:mr-2 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{t('landing.hero.scan')}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-950/40">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">240+</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{t('landing.stats.producers')}</div>
            </div>
            <div className="rounded-xl bg-teal-50 p-4 text-center dark:bg-teal-950/40">
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">1.2M+</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{t('landing.stats.labels')}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/40">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">11</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{t('landing.stats.wilayat')}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-slate-950/60">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">{t('landing.how.title')}</h2>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-4 inline-block">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg">
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                    {index + 1}
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">{t('landing.categories.title')}</h2>
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-2xl font-bold text-white">{translateProductType(category.name, t)}</h3>
                    <p className="text-sm text-white/80">{t('landing.categories.traceable')}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-xl font-bold">{t('app.name')}</span>
              </div>
              <p className="text-slate-400">{t('landing.footer.desc')}</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">{t('landing.footer.contact')}</h4>
              <p className="text-slate-400">
                <MapPin className="mr-2 inline h-4 w-4" />
                {t('landing.footer.location')}
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>{t('landing.footer.rights')}</p>
          </div>
        </div>
      </footer>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QrScanner
          onScan={(code) => {
            setShowScanner(false);
            navigate(`/verify/${code}`);
          }}
          onClose={() => {
            setShowScanner(false);
            navigate('/', { replace: true });
          }}
        />
      )}
    </div>
  );
}
