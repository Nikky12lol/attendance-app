import type { AppState, Period, Weekday } from './types';

export const TARGET_PERCENT = 65;
export const SEMESTER_END = '2026-12-31';

const WEEKDAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const pad = (n: number) => (n < 10 ? '0' + n : String(n));

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function weekdayOf(key: string): Weekday | null {
  const idx = parseKey(key).getDay();
  return idx === 0 ? null : WEEKDAYS[idx - 1];
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function nowMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function periodsOn(periods: Period[], key: string): Period[] {
  const wd = weekdayOf(key);
  if (!wd) return [];
  return periods
    .filter(p => p.weekday === wd)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
}

export type MarkFailure =
  | 'NOT_FOUND'
  | 'NO_UNITS'
  | 'ALREADY_MARKED'
  | 'WRONG_DATE'
  | 'OUTSIDE_WINDOW';

export type PeriodView = 'PRESENT' | 'ABSENT' | 'OPEN' | 'UPCOMING' | 'NOT_TRACKED';

export function checkPresent(
  state: AppState, periodId: string, date: string, now: Date
): MarkFailure | null {
  const p = state.periods.find(x => x.id === periodId);
  if (!p) return 'NOT_FOUND';
  if (p.units <= 0) return 'NO_UNITS';
  if (p.weekday !== weekdayOf(date)) return 'WRONG_DATE';
  if (state.records.some(r => r.periodId === periodId && r.date === date)) return 'ALREADY_MARKED';
  if (date !== dateKey(now)) return 'WRONG_DATE';
  const m = nowMinutes(now);
  if (m < minutesOf(p.start) || m > minutesOf(p.end)) return 'OUTSIDE_WINDOW';
  return null;
}

export function markPresent(
  state: AppState, periodId: string, date: string, now: Date
): { ok: true; state: AppState } | { ok: false; reason: MarkFailure } {
  const reason = checkPresent(state, periodId, date, now);
  if (reason) return { ok: false, reason };
  const p = state.periods.find(x => x.id === periodId)!;
  const record = {
    id: `${periodId}|${date}`,
    periodId,
    date,
    status: 'PRESENT' as const,
    units: p.units,
    lockedAt: now.toISOString(),
  };
  return { ok: true, state: { ...state, records: [...state.records, record] } };
}

export function periodView(state: AppState, p: Period, date: string, now: Date): PeriodView {
  if (p.units <= 0) return 'NOT_TRACKED';
  const r = state.records.find(x => x.periodId === p.id && x.date === date);
  if (r) return r.status;
  const today = dateKey(now);
  if (date > today) return 'UPCOMING';
  if (date < today) return 'ABSENT';
  const m = nowMinutes(now);
  if (m < minutesOf(p.start)) return 'UPCOMING';
  if (m <= minutesOf(p.end)) return 'OPEN';
  return 'ABSENT';
}

export function totals(state: AppState): { attended: number; conducted: number } {
  const b = state.settings.baseline ?? { attended: 0, conducted: 0 };
  let attended = b.attended;
  let conducted = b.conducted;
  for (const r of state.records) {
    conducted += r.units;
    if (r.status === 'PRESENT') attended += r.units;
  }
  return { attended, conducted };
}

export function percent(state: AppState): number {
  const { attended, conducted } = totals(state);
  return conducted === 0 ? 0 : (attended * 100) / conducted;
}

export type Forecast = {
  percentNow: number;
  target: number;
  remainingUnits: number;
  remainingDays: number;
  neededAttend: number;
  achievable: boolean;
  end: string;
};

export function forecast(state: AppState, now: Date): Forecast {
  const today = dateKey(now);
  const end = state.settings.semesterEnd;
  const nowMin = nowMinutes(now);
  const { attended, conducted } = totals(state);

  let remainingUnits = 0;
  let remainingDays = 0;

  for (let k = today; k <= end; k = addDays(k, 1)) {
    let dayHasUnits = false;
    for (const p of periodsOn(state.periods, k)) {
      if (p.units <= 0) continue;
      if (k === today && minutesOf(p.end) < nowMin) continue;
      if (state.records.some(r => r.periodId === p.id && r.date === k)) continue;
      remainingUnits += p.units;
      dayHasUnits = true;
    }
    if (dayHasUnits) remainingDays++;
  }

  const total = conducted + remainingUnits;
  const numerator = TARGET_PERCENT * total - 100 * attended;
  const neededAttend = Math.max(0, Math.ceil(numerator / 100));

  return {
    percentNow: percent(state),
    target: TARGET_PERCENT,
    remainingUnits,
    remainingDays,
    neededAttend,
    achievable: neededAttend <= remainingUnits,
    end,
  };
}

