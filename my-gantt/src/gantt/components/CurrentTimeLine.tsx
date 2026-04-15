import { useEffect, useState } from "react";
import type { TimelineRange } from "../types";

interface Props {
  range: TimelineRange;
  totalWidth: number;
}

const ONE_MINUTE = 60_000;

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CurrentTimeLine({ range, totalWidth }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ONE_MINUTE);
    return () => clearInterval(id);
  }, []);

  const current = now.getTime();
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  if (current < startMs || current > endMs) return null;

  const x = ((current - startMs) / (endMs - startMs)) * totalWidth;

  return (
    <div
      className="gantt-now-line"
      style={{ left: x }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div className="gantt-now-tooltip">{formatTimestamp(now)}</div>
      )}
    </div>
  );
}
