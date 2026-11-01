import type { AppState, Period } from "../types";
import { dateKey, periodsOn, periodView } from "../calc";
import { MarkAttendance } from "./MarkAttendance";

type Props = { state: AppState; now: Date; onMarkPresent: (p: Period) => void };

export function Today({ state, now, onMarkPresent }: Props) {
  const today = dateKey(now);
  const periods = periodsOn(state.periods, today);
  if (periods.length === 0)
    return <section><h2>Today</h2><p className="muted">No classes today.</p></section>;
  return (
    <section>
      <h2>Today</h2>
      <div className="period-list">
        {periods.map(p => {
          const view = periodView(state, p, today, now);
          const record = state.records.find(r => r.periodId === p.id && r.date === today);
          return (
            <article className="period-card" key={p.id}>
              <div>
                <strong>{p.name}</strong>
                <p className="muted">{p.start}–{p.end} · {p.units === 0 ? "No attendance" : `${p.units} unit${p.units === 1 ? "" : "s"}`}</p>
              </div>
              {p.units > 0 && (
                <MarkAttendance active={view === 'OPEN'} view={view} period={p} record={record} onMarkPresent={onMarkPresent} />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

