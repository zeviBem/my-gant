import type { TimeScale } from "../types/timeline.types";

export function alignTimeToScale(scale: TimeScale, date: Date): Date {
  const d = new Date(date);
  switch (scale) {
    case "minute":
      return d;
    case "hour":
      d.setSeconds(0, 0);
      return d;
    case "day":
      d.setMinutes(0, 0, 0);
      return d;
    case "week":
    case "month":
      d.setHours(0, 0, 0, 0);
      return d;
    case "year":
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    case "custom":
      return d;
  }
}
