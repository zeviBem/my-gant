import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "../models/Category";
import type { Task } from "../models/Task";
import type { GanttConfig } from "../models/TimelineConfig";
import type { TaskLayout, TimeScale, TimelineRange } from "../types/timeline.types";
import { deriveCategories, tasksOfCategory } from "../helpers/category.helpers";
import { computeUnitWidth, layoutTasks, stackLayouts } from "../helpers/layout.helpers";

export interface LaneView {
  category: Category;
  items: Array<{ layout: TaskLayout; rowIndex: number }>;
}

interface Params {
  scale: TimeScale;
  range: TimelineRange;
  tasks: Task[];
  categories?: Category[];
  config?: Partial<GanttConfig>;
}

export function useTaskLayout({ scale, range, tasks, categories, config }: Params) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const unitWidth = useMemo(
    () => computeUnitWidth(scale, containerWidth, range.units.length, config?.unitWidth),
    [scale, containerWidth, range.units.length, config?.unitWidth],
  );

  const cfg: GanttConfig = {
    unitWidth,
    rowHeight: config?.rowHeight ?? 64,
  };

  const resolvedCategories = useMemo(
    () => deriveCategories(tasks, categories),
    [tasks, categories],
  );

  const lanes: LaneView[] = useMemo(
    () =>
      resolvedCategories.map((cat) => {
        const laneTasks = tasksOfCategory(tasks, cat.id);
        const laneLayouts = layoutTasks(laneTasks, range, cfg.unitWidth);
        return { category: cat, items: stackLayouts(laneLayouts) };
      }),
    [resolvedCategories, tasks, range, cfg.unitWidth],
  );

  const totalWidth = range.units.length * cfg.unitWidth;
  const rangeMs = range.end.getTime() - range.start.getTime();
  const msPerPx = totalWidth > 0 ? rangeMs / totalWidth : 0;
  const minMs = rangeMs / range.units.length;

  return { scrollRef, cfg, lanes, totalWidth, msPerPx, minMs };
}
