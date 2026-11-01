type Props = { attendedUnits: number; conductedUnits: number; neededNextUnits: number; remainingUnits: number };

export function PercentDashboard({ attendedUnits, conductedUnits, neededNextUnits, remainingUnits }: Props) {
  const pct = conductedUnits === 0 ? 0 : (attendedUnits / conductedUnits) * 100;
  const onTrack = neededNextUnits === 0;
  return (
    <section className="percent-dashboard">
      <h2>Attendance</h2>
      <output>{pct.toFixed(2)}%</output>
      <p className="muted">{attendedUnits} attended of {conductedUnits} conducted units</p>
      <p className={onTrack ? "target-met" : "target-needed"}>
        {onTrack ? "You are on track for 65%." : `Attend ${neededNextUnits} of the next ${remainingUnits} units to hit 65%.`}
      </p>
    </section>
  );
}

