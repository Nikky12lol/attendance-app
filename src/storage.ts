import type { AppState, Period, Settings, Weekday } from './types';
import { dateKey } from './calc';

const KEY = 'attendance_app_state_v1';

const TIMES = [
  { name: 'Period 1', start: '09:00', end: '09:50', units: 1 },
  { name: 'Period 2', start: '09:55', end: '10:45', units: 1 },
  { name: 'Period 3', start: '10:50', end: '11:40', units: 1 },
  { name: 'Lunch',    start: '11:45', end: '12:30', units: 0 },
  { name: 'Period 4', start: '12:30', end: '13:20', units: 1 },
  { name: 'Period 5', start: '13:25', end: '14:15', units: 1 },
  { name: 'Period 6', start: '14:20', end: '15:10', units: 1 },
];
const DAYS: Weekday[] = ['MON','TUE','WED','THU','FRI','SAT'];

function defaultPeriods(): Period[] {
  const out: Period[] = [];
  for (const wd of DAYS) {
    TIMES.forEach((t, i) => {
      out.push({ id: `${wd}-p${i+1}`, weekday: wd, name: t.name, start: t.start, end: t.end, units: t.units });
    });
  }
  return out;
}

export function emptyState(): AppState {
  const today = dateKey(new Date());
  const settings: Settings = {
    alarmConfirmed: false,
    semesterStart: today,
    semesterEnd: '2026-12-31',
    schemaVersion: 1,
    baseline: { attended: 130, conducted: 230 },
  };
  return { periods: defaultPeriods(), records: [], settings, lastSweep: new Date().toISOString() };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { const s = emptyState(); saveState(s); return s; }
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.settings.baseline) parsed.settings.baseline = { attended: 130, conducted: 230 };
    return parsed;
  } catch { return emptyState(); }
}

export function saveState(state: AppState): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.error('save failed', e); }
}

