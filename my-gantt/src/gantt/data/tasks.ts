import type { Category } from "../models/Category";
import type { Task } from "../models/Task";

export const sampleCategories: Category[] = [
  { id: "design", name: "Design" },
  { id: "dev", name: "Development" },
  { id: "ops", name: "Operations" },
];

export const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Wireframes",
    start: new Date(2026, 3, 14),
    end: new Date(2026, 3, 17),
    categoryId: "design",
  },
  {
    id: "2",
    title: "UI Kit",
    start: new Date(2026, 3, 16),
    end: new Date(2026, 3, 19),
    categoryId: "design",
  },
  {
    id: "3",
    title: "Prototype",
    start: new Date(2026, 3, 20),
    end: new Date(2026, 3, 24),
    categoryId: "design",
  },
  {
    id: "4",
    title: "Frontend",
    start: new Date(2026, 3, 15),
    end: new Date(2026, 3, 21),
    categoryId: "dev",
  },
  {
    id: "5",
    title: "API",
    start: new Date(2026, 3, 17),
    end: new Date(2026, 3, 23),
    categoryId: "dev",
  },
  {
    id: "6",
    title: "Deploy",
    start: new Date(2026, 3, 22),
    end: new Date(2026, 3, 23),
    categoryId: "ops",
  },
  {
    id: "7",
    title: "Smoke test",
    start: new Date(2026, 3, 18),
    end: new Date(2026, 3, 21),
    categoryId: "ops",
  },
];

export const fetchTasks = async () => {
  return sampleTasks;
};
