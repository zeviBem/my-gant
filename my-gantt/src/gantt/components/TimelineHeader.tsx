import type { GanttConfig, TimelineUnit } from "../types";

interface Props {
  units: TimelineUnit[];
  config: GanttConfig;
}

export function TimelineHeader({ units, config }: Props) {
  return (
    <div className="gantt-header" style={{ width: units.length * config.unitWidth }}>
      {units.map((u, i) => (
        <div
          key={i}
          className="gantt-header-cell"
          style={{ width: config.unitWidth, minWidth: config.unitWidth }}
        >
          {u.label}
        </div>
      ))}
    </div>
  );
}
