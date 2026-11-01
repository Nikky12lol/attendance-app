import type { Settings as S } from "../types";

type Props = {
  settings: S;
  onExport: () => void;
  onImport: (f: File) => void;
  onSemesterStart: (d: string) => void;
  onBaseline: (b: Partial<{ attended: number; conducted: number }>) => void;
};

export function Settings({ settings, onExport, onImport, onSemesterStart, onBaseline }: Props) {
  const b = settings.baseline ?? { attended: 0, conducted: 0 };
  const lastBackup = settings.lastBackup ? new Date(settings.lastBackup).toLocaleString() : 'Never';
  const daysSince = settings.lastBackup ? Math.floor((Date.now() - new Date(settings.lastBackup).getTime()) / 86_400_000) : null;
  const stale = daysSince !== null && daysSince >= 7;

  return (
    <section>
      <h2>Settings</h2>
      <div className="field">
        <label>Semester start (sweep begins here — no records before this date)</label>
        <input type="date" value={settings.semesterStart} onChange={e => onSemesterStart(e.target.value)} />
      </div>
      <h3>Baseline (pre-app history)</h3>
      <div className="field">
        <label>Classes attended so far</label>
        <input type="number" value={b.attended} onChange={e => onBaseline({ attended: Number(e.target.value) })} />
      </div>
      <div className="field">
        <label>Classes conducted so far</label>
        <input type="number" value={b.conducted} onChange={e => onBaseline({ conducted: Number(e.target.value) })} />
      </div>
      <p className="muted">Currently {b.attended}/{b.conducted} = {b.conducted ? (b.attended / b.conducted * 100).toFixed(2) : '0.00'}%</p>
      <h3>Backup</h3>
      <p className="muted">iOS may clear website data after ~7 days of non-use. Export weekly to Files/iCloud.</p>
      <p className={stale ? 'danger' : 'muted'}>
        Last backup: {lastBackup}
        {daysSince !== null && ` (${daysSince} day${daysSince === 1 ? '' : 's'} ago)`}
        {stale && ' — export now'}
      </p>
      <button onClick={onExport}>Export backup</button>
      <label className="file-label">
        Import backup
        <input type="file" accept="application/json,.json" onChange={e => {
          const f = e.currentTarget.files?.[0];
          if (f) onImport(f);
          e.currentTarget.value = '';
        }} />
      </label>
    </section>
  );
}

