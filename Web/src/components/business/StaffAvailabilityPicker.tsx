'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  availabilityUiMode,
  formatAvailabilityDisplay,
  parseAvailability,
  serializeDates,
  serializeWeekly,
  weekdayLabel,
  type DatesSelection,
} from '@/lib/staffAvailability';

type Mode = 'weekly' | 'dates';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthMatrix(anchor: Date): { date: Date; inMonth: boolean }[][] {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < startPad; i++) {
    const d = new Date(y, m, 1 - (startPad - i));
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= lastDay; day++) {
    cells.push({ date: new Date(y, m, day), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }
  const rows: { date: Date; inMonth: boolean }[][] = [];
  for (let r = 0; r < cells.length / 7; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
  return rows;
}

export function StaffAvailabilityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const initial = useMemo(() => parseAvailability(value), [value]);
  const [mode, setMode] = useState<Mode>(() => availabilityUiMode(value));
  const [weekly, setWeekly] = useState<number[]>(initial.weekly);
  const [dates, setDates] = useState<string[]>(initial.dates);
  const [month, setMonth] = useState(() => {
    const d = initial.dates[0] ? new Date(initial.dates[0] + 'T12:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    const p = parseAvailability(value);
    setWeekly(p.weekly);
    setDates(p.dates);
    setMode(availabilityUiMode(value));
  }, [value]);

  const emitWeekly = useCallback(
    (days: number[]) => {
      setWeekly(days);
      onChange(serializeWeekly(days));
    },
    [onChange],
  );

  const emitDates = useCallback(
    (next: string[]) => {
      setDates(next);
      onChange(next.length ? serializeDates(next) : JSON.stringify({ v: 1, dates: [] } satisfies DatesSelection));
    },
    [onChange],
  );

  const toggleDay = (d: number) => {
    const has = weekly.includes(d);
    const next = has ? weekly.filter((x) => x !== d) : [...weekly, d].sort((a, b) => a - b);
    emitWeekly(next);
  };

  const toggleYmd = (ymd: string) => {
    const has = dates.includes(ymd);
    const next = has ? dates.filter((x) => x !== ymd) : [...dates, ymd].sort();
    emitDates(next);
  };

  const matrix = useMemo(() => monthMatrix(month), [month]);
  const monthTitle = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('weekly');
            onChange(serializeWeekly(weekly));
          }}
          className={clsx(
            'flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all',
            mode === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          Weekly
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('dates');
            onChange(dates.length ? serializeDates(dates) : serializeDates([toYmd(new Date())]));
          }}
          className={clsx(
            'flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all',
            mode === 'dates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          Calendar
        </button>
      </div>

      {mode === 'weekly' ? (
        <div className="grid grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={clsx(
                'rounded-xl border-2 py-3 text-center text-[10px] font-black uppercase tracking-tighter transition-all',
                weekly.includes(d)
                  ? 'border-primary bg-primary text-white shadow-md'
                  : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200',
              )}
            >
              {weekdayLabel(d).slice(0, 3)}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-white"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-black uppercase tracking-widest text-slate-800">{monthTitle}</span>
            <button
              type="button"
              className="rounded-xl p-2 text-slate-600 hover:bg-white"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => (
              <div key={`h-${i}`} className="py-1">
                {l}
              </div>
            ))}
          </div>
          <div className="mt-1 space-y-1">
            {matrix.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1">
                {row.map(({ date, inMonth }) => {
                  const ymd = toYmd(date);
                  const sel = dates.includes(ymd);
                  if (!inMonth) {
                    return <div key={`pad-${ymd}-${ri}`} className="aspect-square" aria-hidden />;
                  }
                  return (
                    <button
                      key={ymd + ri}
                      type="button"
                      onClick={() => toggleYmd(ymd)}
                      className={clsx(
                        'aspect-square rounded-lg text-xs font-bold transition-all',
                        !sel && 'bg-white text-slate-700 hover:bg-primary/10',
                        sel && 'bg-primary text-white shadow-md',
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Preview:{' '}
        <span className="text-slate-700">
          {formatAvailabilityDisplay(
            mode === 'weekly'
              ? serializeWeekly(weekly)
              : dates.length
                ? serializeDates(dates)
                : JSON.stringify({ v: 1, dates: [] } satisfies DatesSelection),
          )}
        </span>
      </p>
    </div>
  );
}
