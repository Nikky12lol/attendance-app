import type { AttendanceRecord, Period } from "../types";
import type { PeriodView } from "../calc";

type Props = {
  period: Period;
  active: boolean;
  view: PeriodView;
  record?: AttendanceRecord;
  onMarkPresent: (p: Period) => void;
};

export function MarkAttendance({ period, active, view, onMarkPresent }: Props) {
  if (view === 'PRESENT') return <span className="attendance-status present">Present ✓</span>;
  if (view === 'ABSENT') return <span className="attendance-status absent">Absent</span>;
  if (view === 'UPCOMING') return <span className="attendance-status pending">Upcoming</span>;
  if (!active) return <span className="attendance-status pending">Not active</span>;
  return <button type="button" onClick={() => onMarkPresent(period)}>Mark present</button>;
}

