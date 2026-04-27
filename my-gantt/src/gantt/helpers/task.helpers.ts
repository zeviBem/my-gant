import type { Task } from "../models/Task";
import { hm, pad } from "./time.helpers";

const STRIPE_COLORS = ["#4ADE80", "#FACC15", "#F87171", "#3FA9FF"];

export function stripeColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return STRIPE_COLORS[hash % STRIPE_COLORS.length];
}

export function taskDurationMs(t: Task): number {
  return t.end.getTime() - t.start.getTime();
}

export function tasksOverlap(a: Task, b: Task): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

export function formatTaskLong(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm(d)}`;
}

export const formatTaskShort = hm;
