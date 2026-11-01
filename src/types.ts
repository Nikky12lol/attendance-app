export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export type Period = {
  id: string;
  weekday: Weekday;
  name: string;
  start: string;
  end: string;
  units: number;
};

export type Status = 'PRESENT' | 'ABSENT';

export type AttendanceRecord = {
  id: string;
  periodId: string;
  date: string;
  status: Status;
  units: number;
  lockedAt: string;
};

export type Baseline = { attended: number; conducted: number };

export type Settings = {
  alarmConfirmed: boolean;
  semesterStart: string;
  semesterEnd: '2026-12-31';
  schemaVersion: 1;
  baseline?: Baseline;
  lastBackup?: string;
};

export type AppState = {
  periods: Period[];
  records: AttendanceRecord[];
  settings: Settings;
  lastSweep: string;
};

