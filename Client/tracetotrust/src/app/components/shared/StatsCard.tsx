import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'teal' | 'violet';
  trend?: {
    value: string;
    positive: boolean;
  };
}

const toneStyles = {
  blue: {
    line: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconText: 'text-blue-700 dark:text-blue-300',
  },
  emerald: {
    line: 'from-emerald-500 to-green-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconText: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    line: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    line: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    iconText: 'text-rose-700 dark:text-rose-300',
  },
  teal: {
    line: 'from-teal-500 to-cyan-500',
    iconBg: 'bg-teal-100 dark:bg-teal-950/60',
    iconText: 'text-teal-700 dark:text-teal-300',
  },
  violet: {
    line: 'from-violet-500 to-indigo-500',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    iconText: 'text-violet-700 dark:text-violet-300',
  },
};

export function StatsCard({ title, value, icon: Icon, trend, tone = 'blue' }: StatsCardProps) {
  const style = toneStyles[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80">
      <div className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', style.line)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {trend && (
            <p className={cn('mt-2 text-sm', trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', style.iconBg)}>
          <Icon className={cn('h-6 w-6', style.iconText)} />
        </div>
      </div>
    </div>
  );
}
