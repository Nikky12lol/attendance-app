export function AlarmCard({ alarmConfirmed, onConfirmed }: { alarmConfirmed: boolean; onConfirmed: () => void }) {
  return (
    <section className="alarm-card">
      <h2>⏰ Set your daily 8:30 alarm</h2>
      <ol>
        <li>Open the <strong>Clock</strong> app.</li>
        <li>Tap <strong>Alarms</strong> → <strong>+</strong>.</li>
        <li>Set time to <strong>8:30 AM</strong>.</li>
        <li>Tap <strong>Sound</strong> → choose <strong>Radar</strong> or <strong>Alarm</strong>.</li>
        <li>Tap <strong>Save</strong>. Set repeat to <strong>Every Day</strong>.</li>
      </ol>
      <p className="muted">The Clock app fires reliably in Silent/Focus and after reboot.</p>
      <button type="button" onClick={onConfirmed}>I've set the 8:30 alarm</button>
    </section>
  );
}

