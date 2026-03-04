import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

export interface TimelineEvent {
  title: string;
  location?: string;
  date: string;
  time?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-gradient-to-b from-blue-500 via-teal-500 to-emerald-500 dark:from-blue-400 dark:via-teal-300 dark:to-emerald-300" />

      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={index} className="relative flex gap-4">
            <div className="relative z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-blue-500 shadow-md dark:border-slate-900 dark:bg-blue-400">
                <div className="h-2 w-2 rounded-full bg-white dark:bg-slate-900" />
              </div>
            </div>

            <div className="flex-1 pb-8">
              <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{event.title}</h4>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {event.date}
                    {event.time && <span className="text-slate-400 dark:text-slate-500">• {event.time}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
