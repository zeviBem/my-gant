import type { Task } from "../models/Task";
import type { TimeScale, TimelineRange } from "../types/timeline.types";

export function centerRangeAroundNow(
  range: TimelineRange,
  now: Date,
): { start: Date; end: Date } {
  const half = (range.end.getTime() - range.start.getTime()) / 2;
  return {
    start: new Date(now.getTime() - half),
    end: new Date(now.getTime() + half),
  };
}

export function replaceTask(tasks: Task[], updated: Task): Task[] {
  return tasks.map((t) => (t.id === updated.id ? updated : t));
}

export function addTask(tasks: Task[], task: Task): Task[] {
  return [...tasks, task];
}

export function findTaskById(tasks: Task[], id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function applyLiveTick(
  now: Date,
  range: TimelineRange,
  scale: TimeScale,
  onStandard: (now: Date) => void,
  onCustom: (start: Date, end: Date) => void,
): void {
  if (scale === "custom") {
    const { start, end } = centerRangeAroundNow(range, now);
    onCustom(start, end);
  } else {
    onStandard(now);
  }
}

export function withLiveOff<A extends unknown[]>(
  setLiveMode: (v: boolean) => void,
  fn: (...args: A) => void,
): (...args: A) => void {
  return (...args: A) => {
    setLiveMode(false);
    fn(...args);
  };
}
