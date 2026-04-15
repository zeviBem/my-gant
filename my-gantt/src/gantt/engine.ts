import type {
  Task,
  TaskLayout,
  TimeScale,
  TimelineRange,
  TimelineUnit,
} from "./types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

interface ScaleStrategy {
  buildRange(anchor: Date): { start: Date; end: Date };
  buildUnits(range: { start: Date; end: Date }): TimelineUnit[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SCALES: Record<Exclude<TimeScale, "custom">, ScaleStrategy> = {
  hour: {
    buildRange(anchor) {
      const end = new Date(anchor);
      const start = new Date(end.getTime() - 60 * 60 * 1000);
      return { start, end };
    },
    buildUnits({ start }) {
      return Array.from({ length: 12 }, (_, i) => {
        const s = new Date(start.getTime() + i * 5 * 60 * 1000);
        const e = new Date(s.getTime() + 5 * 60 * 1000);
        const label = `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`;
        return { start: s, end: e, label };
      });
    },
  },
  day: {
    buildRange(anchor) {
      const start = startOfDay(anchor);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    },
    buildUnits({ start }) {
      return Array.from({ length: 24 }, (_, h) => {
        const s = new Date(start);
        s.setHours(h, 0, 0, 0);
        const e = new Date(s);
        e.setHours(h + 1);
        return { start: s, end: e, label: `${String(h).padStart(2, "0")}:00` };
      });
    },
  },
  week: {
    buildRange(anchor) {
      const start = startOfWeek(anchor);
      return { start, end: addDays(start, 7) };
    },
    buildUnits({ start }) {
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return Array.from({ length: 7 }, (_, i) => {
        const s = addDays(start, i);
        const e = addDays(s, 1);
        return { start: s, end: e, label: `${names[i]} ${s.getDate()}` };
      });
    },
  },
  month: {
    buildRange(anchor) {
      const start = startOfMonth(anchor);
      return { start, end: addDays(start, 28) };
    },
    buildUnits({ start }) {
      return Array.from({ length: 4 }, (_, i) => {
        const s = addDays(start, i * 7);
        const e = addDays(s, 7);
        return { start: s, end: e, label: `Week ${i + 1}` };
      });
    },
  },
  year: {
    buildRange(anchor) {
      const start = startOfYear(anchor);
      const end = new Date(start.getFullYear() + 1, 0, 1);
      return { start, end };
    },
    buildUnits({ start }) {
      const year = start.getFullYear();
      return Array.from({ length: 12 }, (_, m) => ({
        start: new Date(year, m, 1),
        end: new Date(year, m + 1, 1),
        label: MONTH_NAMES[m],
      }));
    },
  },
};

export function getTimeScaleRange(scale: TimeScale, anchor: Date): TimelineRange {
  if (scale === "custom") {
    const end = new Date(anchor.getTime() + 24 * 60 * 60 * 1000);
    return getCustomRange(anchor, end);
  }
  const { start, end } = SCALES[scale].buildRange(anchor);
  const units = SCALES[scale].buildUnits({ start, end });
  return { scale, start, end, units };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function getCustomRange(start: Date, end: Date): TimelineRange {
  const rangeMs = end.getTime() - start.getTime();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  let step: number;
  let formatLabel: (d: Date) => string;
  if (rangeMs <= 6 * HOUR) {
    step = 15 * 60 * 1000;
    formatLabel = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } else if (rangeMs <= 2 * DAY) {
    step = HOUR;
    formatLabel = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:00`;
  } else if (rangeMs <= 14 * DAY) {
    step = DAY;
    formatLabel = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  } else if (rangeMs <= 120 * DAY) {
    step = DAY;
    formatLabel = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  } else {
    step = 7 * DAY;
    formatLabel = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  }

  const units: TimelineUnit[] = [];
  let cursor = start.getTime();
  while (cursor < end.getTime()) {
    const s = new Date(cursor);
    const e = new Date(Math.min(cursor + step, end.getTime()));
    units.push({ start: s, end: e, label: formatLabel(s) });
    cursor += step;
  }
  if (units.length === 0) {
    units.push({ start: new Date(start), end: new Date(end), label: formatLabel(start) });
  }

  return { scale: "custom", start: new Date(start), end: new Date(end), units };
}

export function getGridUnits(range: TimelineRange): TimelineUnit[] {
  return range.units;
}

export function getTaskPosition(
  task: Task,
  range: TimelineRange,
  unitWidth: number,
): TaskLayout {
  const totalWidth = range.units.length * unitWidth;
  const rangeMs = range.end.getTime() - range.start.getTime();

  const taskStartMs = Math.max(task.start.getTime(), range.start.getTime());
  const taskEndMs = Math.min(task.end.getTime(), range.end.getTime());

  const visible = taskEndMs > taskStartMs;
  const rawOffset = visible
    ? ((taskStartMs - range.start.getTime()) / rangeMs) * totalWidth
    : 0;
  const rawWidth = visible
    ? ((taskEndMs - taskStartMs) / rangeMs) * totalWidth
    : 0;

  const offsetPx = Math.max(0, Math.min(rawOffset, totalWidth));
  const maxWidth = Math.max(0, totalWidth - offsetPx);
  const widthPx = visible ? Math.min(maxWidth, Math.max(2, rawWidth)) : 0;

  return { task, offsetPx, widthPx };
}

export function layoutTasks(
  tasks: Task[],
  range: TimelineRange,
  unitWidth: number,
): TaskLayout[] {
  return tasks.map((t) => getTaskPosition(t, range, unitWidth));
}
