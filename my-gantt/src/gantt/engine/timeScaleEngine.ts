import type { TimeScale } from "../types";

export interface TimeScaleTick {
  time: Date;
  label: string;
}

export interface TimeScaleResult {
  headerLabel: string;
  ticks: TimeScaleTick[];
}

export interface TimeScaleConfig {
  zoom: TimeScale;
  visibleStart: Date;
  visibleEnd: Date;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dmy = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const dmyHm = (d: Date) => `${dmy(d)} ${hm(d)}`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function buildHour(start: Date, end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 5 * MINUTE) {
    const d = new Date(t);
    ticks.push({ time: d, label: hm(d) });
  }
  return { headerLabel: `${hm(start)} – ${hm(end)}`, ticks };
}

function buildDay(start: Date, _end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  const base = new Date(start);
  base.setMinutes(0, 0, 0);
  for (let h = 0; h < 24; h++) {
    const d = new Date(base);
    d.setHours(h);
    ticks.push({ time: d, label: `${pad(h)}:00` });
  }
  return { headerLabel: dmy(start), ticks };
}

function buildWeek(start: Date, end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * DAY);
    ticks.push({ time: d, label: `${DAY_SHORT[d.getDay()]} ${pad(d.getDate())}` });
  }
  const last = new Date(end.getTime() - DAY);
  return { headerLabel: `${dmy(start)} – ${dmy(last)}`, ticks };
}

function buildMonth(start: Date, _end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = Array.from({ length: 4 }, (_, i) => ({
    time: new Date(start.getTime() + i * 7 * DAY),
    label: `Week ${i + 1}`,
  }));
  return {
    headerLabel: `${MONTH_NAMES[start.getMonth()]} – ${start.getFullYear()}`,
    ticks,
  };
}

function buildYear(start: Date, _end: Date): TimeScaleResult {
  const year = start.getFullYear();
  const ticks: TimeScaleTick[] = Array.from({ length: 12 }, (_, m) => ({
    time: new Date(year, m, 1),
    label: MONTH_SHORT[m],
  }));
  return { headerLabel: String(year), ticks };
}

function buildCustom(start: Date, end: Date): TimeScaleResult {
  const duration = end.getTime() - start.getTime();
  let step: number;
  let format: (d: Date) => string;

  if (duration < 3 * HOUR) {
    step = 5 * MINUTE;
    format = hm;
  } else if (duration < DAY) {
    step = HOUR;
    format = (d) => `${pad(d.getHours())}:00`;
  } else if (duration < 7 * DAY) {
    step = DAY;
    format = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  } else if (duration < 30 * DAY) {
    step = 7 * DAY;
    format = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  } else {
    step = 30 * DAY;
    format = (d) => `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }

  const ticks: TimeScaleTick[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += step) {
    const d = new Date(t);
    ticks.push({ time: d, label: format(d) });
  }

  return { headerLabel: `${dmyHm(start)} – ${dmyHm(end)}`, ticks };
}

export function getTimeScale(config: TimeScaleConfig): TimeScaleResult {
  const { zoom, visibleStart, visibleEnd } = config;
  switch (zoom) {
    case "hour": return buildHour(visibleStart, visibleEnd);
    case "day": return buildDay(visibleStart, visibleEnd);
    case "week": return buildWeek(visibleStart, visibleEnd);
    case "month": return buildMonth(visibleStart, visibleEnd);
    case "year": return buildYear(visibleStart, visibleEnd);
    case "custom": return buildCustom(visibleStart, visibleEnd);
  }
}
