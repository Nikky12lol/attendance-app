import type { AppState } from './types';

export function downloadBackup(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const name = `attendance-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`;
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseBackup(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(String(r.result));
        if (obj?.settings?.schemaVersion !== 1) throw new Error('version');
        if (!Array.isArray(obj.periods) || !Array.isArray(obj.records)) throw new Error('shape');
        resolve(obj as AppState);
      } catch (e) { reject(e); }
    };
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

