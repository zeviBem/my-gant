import type { Task } from "../types";

export const sampleTasks: Task[] = [
  { id: "1", title: "Design",      start: new Date(2026, 3, 13), end: new Date(2026, 3, 16) },
  { id: "2", title: "Development", start: new Date(2026, 3, 17), end: new Date(2026, 3, 24) },
  { id: "3", title: "Review",      start: new Date(2026, 3, 22), end: new Date(2026, 3, 25) },
  { id: "4", title: "Deploy",      start: new Date(2026, 3, 26), end: new Date(2026, 3, 27) },
];

export async function fetchTasks(): Promise<Task[]> {
  return sampleTasks;
}
