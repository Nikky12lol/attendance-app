import type { AppState, AttendanceRecord } from './types';
import { addDays, dateKey, minutesOf, nowMinutes, periodsOn } from './calc';

export function sweep(state: AppState, now: Date): AppState {
  const today = dateKey(now);
  const nowMin = nowMinutes(now);
  const { semesterStart: start, semesterEnd: end } = state.settings;
  const last = today < end ? today : end;
  const lockedAt = now.toISOString();

  const seen = new Set(state.records.map(r => `${r.periodId}|${r.date}`));
  const added: AttendanceRecord[] = [];

  if (start <= last) {
    for (let k = start; k <= last; k = addDays(k, 1)) {
      for (const p of periodsOn(state.periods, k)) {
        if (p.units <= 0) continue;
        const key = `${p.id}|${k}`;
        if (seen.has(key)) continue;
        const ended = k < today || minutesOf(p.end) < nowMin;
        if (!ended) continue;
        seen.add(key);
        added.push({ id: key, periodId: p.id, date: k, status: 'ABSENT', units: p.units, lockedAt });
      }
    }
  }

  return {
    ...state,
    records: added.length ? [...state.records, ...added] : state.records,
    lastSweep: lockedAt,
  };
}

