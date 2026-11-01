import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AppState, Period } from './types';
import { loadState, saveState } from './storage';
import { sweep } from './sweep';
import { dateKey, markPresent, totals, forecast } from './calc';
import { Today } from './components/Today';
import { Timetable } from './components/Timetable';
import { TimetableEditor } from './components/TimetableEditor';
import { PercentDashboard } from './components/PercentDashboard';
import { Settings as SettingsScreen } from './components/Settings';
import { AlarmCard } from './components/AlarmCard';
import { downloadBackup, parseBackup } from './exportImport';

type Tab = 'today' | 'timetable' | 'settings';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<Tab>('today');
  const [now, setNow] = useState(new Date());

  const stateRef = useRef(state);
  useLayoutEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const tick = () => {
      setNow(new Date());
      setState(prev => {
        const next = sweep(prev, new Date());
        return next.records.length !== prev.records.length ? next : prev;
      });
    };
    tick();
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      setNow(new Date());
      setState(prev => {
        const next = sweep(prev, new Date());
        return next.records.length !== prev.records.length ? next : prev;
      });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => { saveState(state); }, [state]);

  const patchSettings = (s: Partial<AppState['settings']>) =>
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));

  const patchBaseline = (b: Partial<{ attended: number; conducted: number }>) =>
    setState(prev => {
      const base = prev.settings.baseline ?? { attended: 0, conducted: 0 };
      return { ...prev, settings: { ...prev.settings, baseline: { ...base, ...b } } };
    });

  const handleMarkPresent = (p: Period) => {
    const currentNow = new Date();
    const res = markPresent(stateRef.current, p.id, dateKey(currentNow), currentNow);
    if (!res.ok) { alert(`Cannot mark: ${res.reason}`); return; }
    setState(res.state);
  };

  const handleExport = () => {
    downloadBackup(stateRef.current);
    patchSettings({ lastBackup: new Date().toISOString() });
  };

  const importBackup = async (file: File) => {
    try {
      const parsed = await parseBackup(file);
      setState(() => parsed);
      alert('Restored.');
    } catch {
      alert('Invalid backup file.');
    }
  };

  const { attended, conducted } = totals(state);
  const fc = forecast(state, now);

  return (
    <div className="app">
      <header>
        <h1>Attendance</h1>
        <p className="muted">{dateKey(now)}</p>
      </header>

      <PercentDashboard
        attendedUnits={attended}
        conductedUnits={conducted}
        neededNextUnits={fc.neededAttend}
        remainingUnits={fc.remainingUnits}
      />

      {!fc.achievable && (
        <p className="danger">⚠ 65% is mathematically out of reach with the remaining classes.</p>
      )}

      <nav className="tabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>Today</button>
        <button className={tab === 'timetable' ? 'active' : ''} onClick={() => setTab('timetable')}>Timetable</button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
      </nav>

      {tab === 'today' && (
        <>
          {!state.settings.alarmConfirmed && (
            <AlarmCard alarmConfirmed={false} onConfirmed={() => patchSettings({ alarmConfirmed: true })} />
          )}
          <Today state={state} now={now} onMarkPresent={handleMarkPresent} />
        </>
      )}

      {tab === 'timetable' && (
        <>
          <Timetable periods={state.periods} />
          <TimetableEditor periods={state.periods}
            onChange={(periods) => setState(prev => ({ ...prev, periods }))} />
        </>
      )}

      {tab === 'settings' && (
        <SettingsScreen
          settings={state.settings}
          onExport={handleExport}
          onImport={importBackup}
          onSemesterStart={(d) => patchSettings({ semesterStart: d })}
          onBaseline={patchBaseline}
        />
      )}
    </div>
  );
}

