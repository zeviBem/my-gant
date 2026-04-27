import type { Category } from "../models/Category";
import type { Task } from "../models/Task";

export const DEFAULT_CATEGORY_ID = "general";

export function deriveCategories(tasks: Task[], provided?: Category[]): Category[] {
  if (provided && provided.length > 0) return provided;
  const seen = new Map<string, Category>();
  for (const t of tasks) {
    const id = t.categoryId ?? DEFAULT_CATEGORY_ID;
    if (!seen.has(id)) {
      seen.set(id, { id, name: id === DEFAULT_CATEGORY_ID ? "Tasks" : id });
    }
  }
  if (seen.size === 0) {
    seen.set(DEFAULT_CATEGORY_ID, { id: DEFAULT_CATEGORY_ID, name: "Tasks" });
  }
  return Array.from(seen.values());
}

export function tasksOfCategory(tasks: Task[], categoryId: string): Task[] {
  return tasks.filter((t) => (t.categoryId ?? DEFAULT_CATEGORY_ID) === categoryId);
}
