import type { TimelineUnit } from "../../types/timeline.types";

interface Props {
  units: TimelineUnit[];
  unitWidth: number;
  totalWidth: number;
}

export function TimelineGrid({ units, unitWidth, totalWidth }: Props) {
  return (
    <div className="scheduler-timeline-header" style={{ width: totalWidth }}>
      {units.map((u, i) => {
        const parts = u.label.split(" ");
        return (
          <div
            key={i}
            className="scheduler-timeline-header-cell"
            style={{ width: unitWidth }}
          >
            {parts.length > 1 ? (
              <>
                <span className="scheduler-hdr-primary">{parts[0]}</span>
                <span className="scheduler-hdr-secondary">
                  {parts.slice(1).join(" ")}
                </span>
              </>
            ) : (
              <span className="scheduler-hdr-primary">{u.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
