import type {
  TimeScale,
  TimelineRange,
  TimelineUnit,
} from "../types/timeline.types";

export const SEC = 1_000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const DAY_NAMES = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];
export const MONTH_NAMES = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export const pad = (n: number) => String(n).padStart(2, "0");
export const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const hms = (d: Date) => `${hm(d)}:${pad(d.getSeconds())}`;
export const dmy = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
export const dmyHm = (d: Date) => `${dmy(d)} ${hm(d)}`;
export const mdShort = (d: Date) =>
  `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

export function toDatetimeLocal(day: Date): string {
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${hm(day)}`;
}

function uniformUnits(
  start: Date,
  step: number,
  count: number,
  fmt: (d: Date) => string,
): TimelineUnit[] {
  return Array.from({ length: count }, (_, i) => {
    const s = new Date(start.getTime() + i * step);
    return { start: s, end: new Date(s.getTime() + step), label: fmt(s) };
  });
}

export function buildRange(scale: TimeScale, anchor: Date): TimelineRange {
  const at = anchor.getTime();
  if (scale === "minute") {
    const start = new Date(at - 30 * SEC);
    return {
      scale,
      start,
      end: new Date(at + 30 * SEC),
      units: uniformUnits(start, 5 * SEC, 12, hms),
    };
  }
  if (scale === "hour") {
    const start = new Date(at - 30 * MIN);
    return {
      scale,
      start,
      end: new Date(at + 30 * MIN),
      units: uniformUnits(start, 5 * MIN, 12, hm),
    };
  }
  if (scale === "day") {
    const start = new Date(at - 12 * HOUR);
    return {
      scale,
      start,
      end: new Date(at + 12 * HOUR),
      units: uniformUnits(start, HOUR, 24, (d) => `${pad(d.getHours())}:00`),
    };
  }
  if (scale === "week") {
    const start = new Date(at - 3 * DAY);
    return {
      scale,
      start,
      end: new Date(at + 3 * DAY),
      units: uniformUnits(
        start,
        DAY,
        7,
        (d) => `${DAY_NAMES[d.getDay()]} ${d.getDate()}`,
      ),
    };
  }
  if (scale === "month") {
    const start = new Date(at - 15 * DAY),
      end = new Date(at + 15 * DAY);
    const seg = (end.getTime() - start.getTime()) / 4;
    const units = Array.from({ length: 4 }, (_, i) => ({
      start: new Date(start.getTime() + i * seg),
      end: new Date(start.getTime() + (i + 1) * seg),
      label: `Week ${i + 1}`,
    }));
    return { scale, start, end, units };
  }
  if (scale === "year") {
    const start = new Date(anchor);
    start.setMonth(start.getMonth() - 6);
    const end = new Date(anchor);
    end.setMonth(end.getMonth() + 6);
    const units = Array.from({ length: 12 }, (_, i) => {
      const s = new Date(start.getFullYear(), start.getMonth() + i, 1);
      return {
        start: s,
        end: new Date(start.getFullYear(), start.getMonth() + i + 1, 1),
        label: MONTH_NAMES[s.getMonth()],
      };
    });
    return { scale, start, end, units };
  }
  return buildCustomRange(anchor, new Date(at + DAY));
}

export function buildCustomRange(start: Date, end: Date): TimelineRange {
  const rangeMs = end.getTime() - start.getTime();
  let step: number;
  let fmt: (d: Date) => string;
  if (rangeMs <= 6 * HOUR) {
    step = 15 * MIN;
    fmt = hm;
  } else if (rangeMs <= 2 * DAY) {
    step = HOUR;
    fmt = (d) => `${mdShort(d)} ${pad(d.getHours())}:00`;
  } else if (rangeMs <= 120 * DAY) {
    step = DAY;
    fmt = mdShort;
  } else {
    step = 7 * DAY;
    fmt = mdShort;
  }
  const units: TimelineUnit[] = [];
  for (let cur = start.getTime(); cur < end.getTime(); cur += step) {
    const s = new Date(cur);
    units.push({
      start: s,
      end: new Date(Math.min(cur + step, end.getTime())),
      label: fmt(s),
    });
  }
  if (units.length === 0)
    units.push({
      start: new Date(start),
      end: new Date(end),
      label: fmt(start),
    });
  return { scale: "custom", start: new Date(start), end: new Date(end), units };
}

export function buildHeaderLabel(
  scale: TimeScale,
  start: Date,
  end: Date,
): string {
  if (scale === "minute") return `${hms(start)} – ${hms(end)}`;
  if (scale === "hour") return `${hm(start)} – ${hm(end)}`;
  if (scale === "year")
    return `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()} – ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  if (scale === "day" || scale === "custom")
    return `${dmyHm(start)} – ${dmyHm(end)}`;
  return `${dmy(start)} – ${dmy(end)}`;
}
