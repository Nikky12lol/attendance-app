import type { Period, Weekday } from "../types";

const DAYS: Array<[Weekday, string]> = [
  ['MON','Mon'],['TUE','Tue'],['WED','Wed'],['THU','Thu'],['FRI','Fri'],['SAT','Sat'],
];

export function Timetable({ periods }: { periods: Period[] }) {
  return (
    <section>
      <h2>Timetable</h2>
      {DAYS.map(([k, label]) => {
        const list = periods.filter(p => p.weekday === k).sort((a, b) => a.start.localeCompare(b.start));
        return (
          <div key={k}>
            <h3>{label}</h3>
            {list.length === 0 ? <p className="muted">No periods</p> : (
              <ul className="timetable-list">
                {list.map(p => (
                  <li key={p.id}>
                    <span>{p.start}–{p.end}</span>
                    <strong>{p.name}</strong>
                    <span>{p.units === 0 ? '—' : `${p.units}u`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

