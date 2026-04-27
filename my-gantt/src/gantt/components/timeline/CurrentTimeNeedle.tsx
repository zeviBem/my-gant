import { useEffect, useState } from "react";
import type { TimelineRange } from "../../types/timeline.types";
import { hm, pad } from "../../helpers/time.helpers";

interface Props {
  range: TimelineRange;
  totalWidth: number;
}

const ONE_SECOND = 1_000;
const ONE_MINUTE = 60_000;

function formatTimestamp(d: Date, withSeconds: boolean): string {
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm(d)}`;
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
}

export function CurrentTimeNeedle({ range, totalWidth }: Props) {
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
