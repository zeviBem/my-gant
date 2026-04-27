import type { Task } from "../models/Task";
import type { TaskLayout, TimeScale, TimelineRange } from "../types/timeline.types";

export const CARD_HEIGHT = 44;
export const CARD_GAP = 4;
export const CARD_TOP_PADDING = 6;

export const MIN_UNIT_WIDTH: Record<TimeScale, number> = {
  minute: 60,
  hour: 60,
  day: 50,
  week: 80,
  month: 120,
  year: 70,
  custom: 60,
};

export function computeUnitWidth(
  scale: TimeScale,
  containerWidth: number,
  unitCount: number,
  override?: number,
): number {
  if (override) return override;
  const stretched = containerWidth / unitCount;
  return Math.max(MIN_UNIT_WIDTH[scale], stretched || MIN_UNIT_WIDTH[scale]);
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
  const rawOffset = visible ? ((taskStartMs - range.start.getTime()) / rangeMs) * totalWidth : 0;
  const rawWidth = visible ? ((taskEndMs - taskStartMs) / rangeMs) * totalWidth : 0;
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

export function stackLayouts(
  laneLayouts: TaskLayout[],
): Array<{ layout: TaskLayout; rowIndex: number }> {
  const sorted = [...laneLayouts].sort(
    (a, b) => a.task.start.getTime() - b.task.start.getTime(),
  );
  const rowEnds: number[] = [];
  return sorted.map((layout) => {
    const s = layout.task.start.getTime();
    const e = layout.task.end.getTime();
    let rowIndex = rowEnds.findIndex((end) => end <= s);
    if (rowIndex === -1) {
      rowIndex = rowEnds.length;
      rowEnds.push(e);
    } else {
      rowEnds[rowIndex] = e;
    }
    return { layout, rowIndex };
  });
}
