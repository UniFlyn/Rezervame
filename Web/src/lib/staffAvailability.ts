/** Staff.availability string formats: JSON v1 or legacy e.g. "Mon-Fri", "Tue-Sat". */

export type WeeklySelection = { v: 1; weekly: number[] };
export type DatesSelection = { v: 1; dates: string[] };
export type AvailabilityPayload = WeeklySelection | DatesSelection;

const WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_TOKEN: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function weekdayLabel(d: number): string {
  return WEEK_SHORT[d % 7] ?? '';
}

/** Avatar: saved image/data URL, or deterministic initials placeholder. */
export function staffPhotoSrc(name: string, image?: string | null): string {
  const trimmed = (image || '').trim();
  if (trimmed) return trimmed;
  const n = (name || 'Staff').trim() || 'Staff';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=f1f5f9&color=475569&size=256&bold=true`;
}

function parseLegacyRange(s: string): number[] | null {
  const t = s.trim().toLowerCase().replace(/–/g, '-');
  const m = t.match(/^(sun|mon|tue|wed|thu|fri|sat)-(sun|mon|tue|wed|thu|fri|sat)$/);
  if (!m) return null;
  let a = DAY_TOKEN[m[1]];
  let b = DAY_TOKEN[m[2]];
  if (a === undefined || b === undefined) return null;
  const out: number[] = [];
  let i = a;
  for (let n = 0; n < 8; n++) {
    out.push(i);
    if (i === b) break;
    i = (i + 1) % 7;
  }
  return out.length ? Array.from(new Set(out)).sort((x, y) => x - y) : null;
}

/** Which tab to show for saved JSON (`dates`-only payload vs `weekly`). */
export function availabilityUiMode(raw: string): 'weekly' | 'dates' {
  const trimmed = raw.trim();
  if (!trimmed) return 'weekly';
  try {
    const j = JSON.parse(trimmed) as { v?: number; weekly?: unknown; dates?: unknown };
    if (j?.v === 1 && Array.isArray(j.dates) && !('weekly' in j)) return 'dates';
  } catch {
    /* legacy text */
  }
  return 'weekly';
}

export function parseAvailability(raw: string): { mode: 'weekly' | 'dates'; weekly: number[]; dates: string[] } {
  const trimmed = raw.trim();
  if (!trimmed) return { mode: 'weekly', weekly: [], dates: [] };
  try {
    const j = JSON.parse(trimmed) as Record<string, unknown>;
    /** Calendar mode payloads always include `dates` (may be empty); weekly-only JSON has no `dates` key. */
    if (j && j.v === 1 && 'dates' in j && Array.isArray(j.dates)) {
      const dates = Array.from(
        new Set(
          (j.dates as unknown[])
            .map((d) => String(d).slice(0, 10))
            .filter(Boolean),
        ),
      ).sort();
      return { mode: 'dates', weekly: [], dates };
    }
    if (j && j.v === 1 && Array.isArray(j.weekly)) {
      const weekly = Array.from(
        new Set(
          (j.weekly as unknown[])
            .map((n) => Number(n))
            .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6),
        ),
      ).sort((a, b) => a - b);
      return { mode: 'weekly', weekly, dates: [] };
    }
  } catch {
    /* legacy */
  }
  const legacy = parseLegacyRange(trimmed);
  if (legacy) return { mode: 'weekly', weekly: legacy, dates: [] };
  return { mode: 'weekly', weekly: [], dates: [] };
}

export function serializeWeekly(days: number[]): string {
  const weekly = Array.from(new Set(days.filter((d) => d >= 0 && d <= 6))).sort((a, b) => a - b);
  return JSON.stringify({ v: 1, weekly } satisfies WeeklySelection);
}

export function serializeDates(dates: string[]): string {
  const sorted = Array.from(new Set(dates.map((d) => d.slice(0, 10)).filter(Boolean))).sort();
  return JSON.stringify({ v: 1, dates: sorted } satisfies DatesSelection);
}

export function formatAvailabilityDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '—';
  try {
    const j = JSON.parse(trimmed) as { v?: number; weekly?: number[]; dates?: string[] };
    if (j?.v === 1 && Array.isArray(j.dates) && j.dates.length === 0) {
      return 'Pick dates on calendar';
    }
    if (j?.v === 1 && Array.isArray(j.weekly) && j.weekly.length === 0 && (!j.dates || j.dates.length === 0)) {
      return '—';
    }
  } catch {
    /* fall through */
  }
  const { mode, weekly, dates } = parseAvailability(trimmed);
  if (mode === 'weekly' && weekly.length) {
    return weekly.map(weekdayLabel).join(', ');
  }
  if (mode === 'dates' && dates.length) {
    if (dates.length === 1) {
      try {
        return new Date(dates[0] + 'T12:00:00').toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return dates[0];
      }
    }
    return `${dates.length} dates selected`;
  }
  return trimmed;
}
