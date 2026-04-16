import type {
  Task,
  TaskLayout,
  TimeScale,
  TimelineRange,
  TimelineUnit,
} from "./types";

interface ScaleStrategy {
  buildRange(anchor: Date): { start: Date; end: Date };
  buildUnits(range: { start: Date; end: Date }): TimelineUnit[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad2 = (n: number) => String(n).padStart(2, "0");

const SCALES: Record<Exclude<TimeScale, "custom">, ScaleStrategy> = {
  minute: {
    buildRange(anchor) {
      const start = new Date(anchor.getTime() - 30 * 1000);
      const end = new Date(anchor.getTime() + 30 * 1000);
      return { start, end };
    },
    buildUnits({ start }) {
      return Array.from({ length: 12 }, (_, i) => {
        const s = new Date(start.getTime() + i * 5 * 1000);
        const e = new Date(s.getTime() + 5 * 1000);
        return {
          start: s,
          end: e,
          label: `${pad2(s.getHours())}:${pad2(s.getMinutes())}:${pad2(s.getSeconds())}`,
        };
      });
    },
  },
  hour: {
    buildRange(anchor) {
      const start = new Date(anchor.getTime() - 30 * MINUTE_MS);
      const end = new Date(anchor.getTime() + 30 * MINUTE_MS);
      return { start, end };
    },
    buildUnits({ start }) {
      return Array.from({ length: 12 }, (_, i) => {
        const s = new Date(start.getTime() + i * 5 * MINUTE_MS);
        const e = new Date(s.getTime() + 5 * MINUTE_MS);
        return { start: s, end: e, label: `${pad2(s.getHours())}:${pad2(s.getMinutes())}` };
      });
    },
  },
  day: {
    buildRange(anchor) {
      const start = new Date(anchor.getTime() - 12 * HOUR_MS);
      const end = new Date(anchor.getTime() + 12 * HOUR_MS);
      return { start, end };
    },
    buildUnits({ start }) {
      return Array.from({ length: 24 }, (_, i) => {
        const s = new Date(start.getTime() + i * HOUR_MS);
        const e = new Date(s.getTime() + HOUR_MS);
        return { start: s, end: e, label: `${pad2(s.getHours())}:00` };
      });
    },
  },
  week: {
    buildRange(anchor) {
      const half = 3.5 * DAY_MS;
      return {
        start: new Date(anchor.getTime() - half),
        end: new Date(anchor.getTime() + half),
      };
    },
    buildUnits({ start }) {
      return Array.from({ length: 7 }, (_, i) => {
        const s = new Date(start.getTime() + i * DAY_MS);
        const e = new Date(s.getTime() + DAY_MS);
        return { start: s, end: e, label: `${DAY_NAMES[s.getDay()]} ${s.getDate()}` };
      });
    },
  },
  month: {
    buildRange(anchor) {
      const half = 15 * DAY_MS;
      return {
        start: new Date(anchor.getTime() - half),
        end: new Date(anchor.getTime() + half),
      };
    },
    buildUnits({ start, end }) {
      const segment = (end.getTime() - start.getTime()) / 4;
      return Array.from({ length: 4 }, (_, i) => {
        const s = new Date(start.getTime() + i * segment);
        const e = new Date(start.getTime() + (i + 1) * segment);
        return { start: s, end: e, label: `Week ${i + 1}` };
      });
    },
  },
  year: {
    buildRange(anchor) {
      const start = new Date(anchor);
      start.setMonth(start.getMonth() - 6);
      const end = new Date(anchor);
      end.setMonth(end.getMonth() + 6);
      return { start, end };
    },
    buildUnits({ start }) {
      return Array.from({ length: 12 }, (_, i) => {
        const s = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const e = new Date(start.getFullYear(), start.getMonth() + i + 1, 1);
        return { start: s, end: e, label: MONTH_NAMES[s.getMonth()] };
      });
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
