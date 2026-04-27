import { useEffect } from "react";
import type { Category } from "../../models/Category";
import type { Task } from "../../models/Task";
import type { GanttConfig } from "../../models/TimelineConfig";
import type { TimeScale, TimelineRange } from "../../types/timeline.types";
import { useTaskLayout } from "../../hooks/useTaskLayout";
import { CategoryLane } from "./CategoryLane";
import { CurrentTimeNeedle } from "./CurrentTimeNeedle";
import { TimelineGrid } from "./TimelineGrid";

interface Props {
  scale: TimeScale;
  range: TimelineRange;
  headerLabel: string;
  tasks: Task[];
  categories?: Category[];
  config?: Partial<GanttConfig>;
  liveMode: boolean;
  onUserScroll: () => void;
  onEditTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
}

export function GanttTimeline({
  scale, range, headerLabel, tasks, categories, config,
  liveMode, onUserScroll, onEditTask, onUpdateTask,
}: Props) {
  const { scrollRef, cfg, lanes, totalWidth, msPerPx, minMs } = useTaskLayout({
    scale, range, tasks, categories, config,
  });

  useEffect(() => {
    if (!liveMode) return;
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onUserScroll, { passive: true });
    return () => el.removeEventListener("scroll", onUserScroll);
  }, [liveMode, onUserScroll, scrollRef]);

  const laneRows = `repeat(${Math.max(lanes.length, 1)}, 1fr)`;

  return (
    <div className="gantt-page-body" style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}>
      <div className="gantt-paper scheduler-container" style={{ flex: 1, minWidth: 0 }}>
        <div className="gantt-top-time-row scheduler-top-row">{headerLabel}</div>
        <div className="scheduler-outer">
          <div className="gantt-scroll scheduler-scroll" ref={scrollRef}>
            <div className="gantt-inner scheduler-inner" style={{ width: totalWidth }}>
              <TimelineGrid units={range.units} unitWidth={cfg.unitWidth} totalWidth={totalWidth} />
              <div className="scheduler-body" style={{ width: totalWidth, gridTemplateRows: laneRows }}>
                {lanes.map((lane) => (
                  <CategoryLane
                    key={lane.category.id}
                    category={lane.category}
                    units={range.units}
                    unitWidth={cfg.unitWidth}
                    items={lane.items}
                    msPerPx={msPerPx}
                    minMs={minMs}
                    onEditTask={onEditTask}
                    onUpdateTask={onUpdateTask}
                  />
                ))}
                <CurrentTimeNeedle range={range} totalWidth={totalWidth} />
              </div>
            </div>
          </div>
          <aside className="scheduler-labels">
            <div className="scheduler-labels-top-spacer" />
            <div className="scheduler-labels-body" style={{ gridTemplateRows: laneRows }}>
              {lanes.map((lane) => (
                <div className="scheduler-lane-label" key={lane.category.id}>
                  <span className="scheduler-lane-label-text">{lane.category.name}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
