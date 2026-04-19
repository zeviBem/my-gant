import { useEffect, useState } from "react";
import type { TimelineRange } from "../types";

interface Props {
  range: TimelineRange;
  totalWidth: number;
}

const ONE_SECOND = 1_000;
const ONE_MINUTE = 60_000;

function formatTimestamp(d: Date, withSeconds: boolean): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
}

export function CurrentTimeLine({ range, totalWidth }: Props) {
  const [now, setNow] = useState(() => new Date());
  const isMinute = range.scale === "minute";

  useEffect(() => {
    const interval = isMinute ? ONE_SECOND : ONE_MINUTE;
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [isMinute]);

  const current = now.getTime();
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  if (current < startMs || current > endMs) return null;

  const x = ((current - startMs) / (endMs - startMs)) * totalWidth;

  return (
    <div
      className="gantt-now-line"
      style={{ left: x }}
      title={formatTimestamp(now, isMinute)}
    />
  );
}
