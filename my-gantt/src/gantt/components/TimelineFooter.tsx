import type { TimeScaleTick } from "../engine/timeScaleEngine";

interface Props {
  ticks: TimeScaleTick[];
  totalWidth: number;
  rangeStart: Date;
  rangeEnd: Date;
}

export function TimelineFooter({ ticks, totalWidth, rangeStart, rangeEnd }: Props) {
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  if (rangeMs <= 0) return null;

  return (
    <div className="gantt-footer" style={{ width: totalWidth, position: "relative" }}>
      {ticks.map((t, i) => {
        const x = ((t.time.getTime() - rangeStart.getTime()) / rangeMs) * totalWidth;
        return (
          <div key={i} className="gantt-footer-tick" style={{ left: x, position: "absolute" }}>
            {t.label}
          </div>
        );
      })}
    </div>
  );
}
