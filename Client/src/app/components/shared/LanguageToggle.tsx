import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useI18n } from '@/app/lib/i18n';

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      className="gap-2 border-slate-300 bg-background/70 dark:border-slate-700 dark:bg-slate-900/50"
    >
      <Globe className="h-4 w-4" />
      {t('lang.switch')}
    </Button>
  );
}
