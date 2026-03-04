import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useTheme } from '@/app/lib/theme';
import { cn } from '@/app/components/ui/utils';
import { useI18n } from '@/app/lib/i18n';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={t('theme.toggle')}
      className="relative overflow-hidden bg-background/70"
    >
      <Sun className={cn('h-4 w-4 transition-all', theme === 'light' ? 'scale-100 opacity-100' : 'scale-0 opacity-0')} />
      <Moon className={cn('absolute h-4 w-4 transition-all', theme === 'dark' ? 'scale-100 opacity-100' : 'scale-0 opacity-0')} />
    </Button>
  );
}
