import { useEffect, useRef, useState } from "react";
import type { TimeScale, TimelineRange } from "../types/timeline.types";

export type LiveTickHandler = (now: Date, range: TimelineRange, scale: TimeScale) => void;

export function useLiveMode(
  scale: TimeScale,
  range: TimelineRange,
  onTick: LiveTickHandler,
) {
  const [liveMode, setLiveMode] = useState(false);

  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!liveMode) return;
    const tick = () => {
      const r = rangeRef.current;
      const now = new Date();
      const nowMs = now.getTime();
      if (nowMs > r.start.getTime() && nowMs < r.end.getTime()) return;
      onTickRef.current(now, r, scale);
    };
    tick();
    const interval = scale === "minute" ? 1000 : 60000;
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [liveMode, scale]);

  return { liveMode, setLiveMode };
}
