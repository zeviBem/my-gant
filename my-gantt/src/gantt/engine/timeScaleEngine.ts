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

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const hms = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const dmy = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const dmyHm = (d: Date) => `${dmy(d)} ${hm(d)}`;

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function buildMinute(start: Date, end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 5 * SECOND) {
    const d = new Date(t);
    ticks.push({ time: d, label: hms(d) });
  }
  return { headerLabel: `${hms(start)} – ${hms(end)}`, ticks };
}

function buildHour(start: Date, end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 5 * MINUTE) {
    const d = new Date(t);
    ticks.push({ time: d, label: hm(d) });
  }
  return { headerLabel: `${hm(start)} – ${hm(end)}`, ticks };
}

function buildDay(start: Date, end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  const first = new Date(start);
  first.setMinutes(0, 0, 0);
  if (first.getTime() < start.getTime()) {
    first.setTime(first.getTime() + HOUR);
  }
  for (let t = first.getTime(); t <= end.getTime(); t += HOUR) {
    const d = new Date(t);
    ticks.push({ time: d, label: `${pad(d.getHours())}:00` });
  }
  return { headerLabel: `${dmyHm(start)} – ${dmyHm(end)}`, ticks };
}

function buildWeek(start: Date, end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  const first = new Date(start);
  first.setHours(0, 0, 0, 0);
  if (first.getTime() < start.getTime()) {
    first.setDate(first.getDate() + 1);
  }
  for (let t = first.getTime(); t <= end.getTime(); t += DAY) {
    const d = new Date(t);
    ticks.push({ time: d, label: `${DAY_SHORT[d.getDay()]} ${pad(d.getDate())}` });
  }
  return { headerLabel: `${dmy(start)} – ${dmy(end)}`, ticks };
}

function buildMonth(start: Date, end: Date): TimeScaleResult {
  const rangeMs = end.getTime() - start.getTime();
  const segment = rangeMs / 4;
  const ticks: TimeScaleTick[] = Array.from({ length: 4 }, (_, i) => ({
    time: new Date(start.getTime() + i * segment + segment / 2),
    label: `Week ${i + 1}`,
  }));
  return { headerLabel: `${dmy(start)} – ${dmy(end)}`, ticks };
}

function buildYear(start: Date, end: Date): TimeScaleResult {
  const ticks: TimeScaleTick[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  if (cursor.getTime() < start.getTime()) {
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const endTime = end.getTime();
  while (cursor.getTime() <= endTime) {
    ticks.push({ time: new Date(cursor), label: MONTH_SHORT[cursor.getMonth()] });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return {
    headerLabel: `${MONTH_SHORT[start.getMonth()]} ${start.getFullYear()} – ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`,
    ticks,
  };
}

function buildCustom(start: Date, end: Date): TimeScaleResult {
  const duration = end.getTime() - start.getTime();
  let step: number;
  let format: (d: Date) => string;

  if (duration < 10 * MINUTE) {
    step = MINUTE;
    format = hm;
  } else if (duration < 2 * HOUR) {
    step = 5 * MINUTE;
    format = hm;
  } else if (duration < DAY) {
    step = HOUR;
    format = (d) => `${pad(d.getHours())}:00`;
  } else if (duration < 7 * DAY) {
    step = DAY;
    format = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  } else {
    step = 7 * DAY;
    format = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
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
    case "minute": return buildMinute(visibleStart, visibleEnd);
    case "hour": return buildHour(visibleStart, visibleEnd);
    case "day": return buildDay(visibleStart, visibleEnd);
    case "week": return buildWeek(visibleStart, visibleEnd);
    case "month": return buildMonth(visibleStart, visibleEnd);
    case "year": return buildYear(visibleStart, visibleEnd);
    case "custom": return buildCustom(visibleStart, visibleEnd);
  }
}
