import { useEffect, useMemo, useState } from "react";
import type { TimeScale, TimelineRange } from "../types/timeline.types";
import { alignTimeToScale } from "../helpers/align.helpers";
import {
  buildCustomRange,
  buildHeaderLabel,
  buildRange,
} from "../helpers/time.helpers";

export interface TimelineEngine {
  scale: TimeScale;
  setScale: (s: TimeScale) => void;
  centerTime: Date;
  setCenterTime: (d: Date) => void;
  customApplied: { start: Date; end: Date } | null;
  setCustomApplied: (v: { start: Date; end: Date } | null) => void;
  range: TimelineRange;
  headerLabel: string;
}

export function useTimelineEngine(
  initialScale: TimeScale,
  anchorDate?: Date,
): TimelineEngine {
  const [scale, setScale] = useState<TimeScale>(initialScale);
  const [centerTime, setCenterTime] = useState<Date>(() => new Date());
  const [customApplied, setCustomApplied] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  useEffect(() => {
    setCenterTime(new Date());
  }, [scale]);
  // const anchor = anchorDate ?? centerTime;
  const alignedAnchor = useMemo(
    () => alignTimeToScale(scale, anchorDate ?? centerTime),
    [scale, anchorDate, centerTime],
  );
  const range = useMemo(() => {
    if (scale === "custom" && customApplied) {
      return buildCustomRange(customApplied.start, customApplied.end);
    }
    //   return buildRange(scale, anchor);
    // }, [scale, anchor, customApplied]);
    return buildRange(scale, alignedAnchor);
  }, [scale, alignedAnchor, customApplied]);

  const headerLabel = useMemo(
    () => buildHeaderLabel(scale, range.start, range.end),
    [scale, range.start, range.end],
  );

  return {
    scale,
    setScale,
    centerTime,
    setCenterTime,
    customApplied,
    setCustomApplied,
    range,
    headerLabel,
  };
}
