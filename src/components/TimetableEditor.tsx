import { useState } from "react";
import type { Period, Weekday } from "../types";

const DAYS: Weekday[] = ['MON','TUE','WED','THU','FRI','SAT'];

export function TimetableEditor({ periods, onChange }: { periods: Period[]; onChange: (p: Period[]) => void }) {
  const [day, setDay] = useState<Weekday>('MON');
  const list = periods.filter(p => p.weekday === day).sort((a, b) => a.start.localeCompare(b.start));
  const add = () => onChange([...periods, { id: `${day}-${Date.now()}`, weekday: day, name: 'New period', start: '09:00', end: '09:50', units: 1 }]);
  const del = (id: string) => onChange(periods.filter(p => p.id !== id));
  const upd = (id: string, patch: Partial<Period>) =>
    onChange(periods.map(p => p.id === id ? { ...p, ...patch } : p));

  return (
    <section>
      <h2>Edit timetable</h2>
      <div className="day-tabs">
        {DAYS.map(d => <button key={d} className={day === d ? 'active' : ''} onClick={() => setDay(d)}>{d}</button>)}
      </div>
      <ul className="editor-list">
        {list.map(p => (
          <li key={p.id}>
            <input value={p.name} onChange={e => upd(p.id, { name: e.target.value })} />
            <input type="time" value={p.start} onChange={e => upd(p.id, { start: e.target.value })} />
            <input type="time" value={p.end} onChange={e => upd(p.id, { end: e.target.value })} />
            <select value={p.units} onChange={e => upd(p.id, { units: Number(e.target.value) })}>
              <option value={0}>—</option>
              <option value={1}>1u</option>
              <option value={2}>Lab 2u</option>
            </select>
            <button onClick={() => del(p.id)}>✕</button>
          </li>
        ))}
      </ul>
      <button onClick={add}>+ Add period</button>
      <p className="muted">Labs = one row with units=2. Sports/Library/Lunch = 0 units.</p>
    </section>
  );
}

