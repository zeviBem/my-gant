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
    <div className="gantt-footer" style={{ width: totalWidth }}>
      {ticks.map((t, i) => {
        const x = ((t.time.getTime() - rangeStart.getTime()) / rangeMs) * totalWidth;
        const atEnd = totalWidth - x < 40;
        return (
          <span
            key={i}
            className={`gantt-footer-tick${atEnd ? " gantt-footer-tick-end" : ""}`}
            style={{ left: x }}
          >
            {t.label}
          </span>
        );
      })}
    </div>
  );
}
