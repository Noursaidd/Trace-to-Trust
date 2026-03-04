import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { useI18n } from '@/app/lib/i18n';

interface VerificationBadgeProps {
  status: 'valid' | 'tampered' | 'partial';
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ status, size = 'md' }: VerificationBadgeProps) {
  const { t } = useI18n();

  const config = {
    valid: {
      icon: CheckCircle2,
      text: t('verify.badge.valid'),
      bgClass: 'bg-emerald-50/90 dark:bg-emerald-950/30',
      borderClass: 'border-emerald-300 dark:border-emerald-700',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      iconClass: 'text-emerald-500 dark:text-emerald-300',
      animationClass: 'animate-pulse-slow',
    },
    tampered: {
      icon: XCircle,
      text: t('verify.badge.tampered'),
      bgClass: 'bg-rose-50/90 dark:bg-rose-950/30',
      borderClass: 'border-rose-300 dark:border-rose-700',
      textClass: 'text-rose-700 dark:text-rose-300',
      iconClass: 'text-rose-500 dark:text-rose-300',
      animationClass: 'animate-shake',
    },
    partial: {
      icon: AlertTriangle,
      text: t('verify.badge.partial'),
      bgClass: 'bg-amber-50/90 dark:bg-amber-950/30',
      borderClass: 'border-amber-300 dark:border-amber-700',
      textClass: 'text-amber-700 dark:text-amber-300',
      iconClass: 'text-amber-500 dark:text-amber-300',
      animationClass: '',
    },
  };

  const { icon: Icon, text, bgClass, borderClass, textClass, iconClass, animationClass } = config[status];

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-10',
  };

  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border-2 shadow-sm flex flex-col items-center justify-center gap-3 text-center',
        bgClass,
        borderClass,
        sizeClasses[size],
      )}
    >
      <Icon className={cn(iconClass, iconSizes[size], animationClass)} />
      <span className={cn('font-semibold', textClass, textSizes[size])}>{text}</span>
    </div>
  );
}
