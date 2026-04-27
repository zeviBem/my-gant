import type { Category } from "../../models/Category";
import type { Task } from "../../models/Task";
import type { TaskLayout, TimelineUnit } from "../../types/timeline.types";
import {
  CARD_GAP,
  CARD_HEIGHT,
  CARD_TOP_PADDING,
} from "../../helpers/layout.helpers";
import { TaskCard } from "./TaskCard";

interface Props {
  category: Category;
  units: TimelineUnit[];
  unitWidth: number;
  items: Array<{ layout: TaskLayout; rowIndex: number }>;
  msPerPx: number;
  minMs: number;
  onEditTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
}

export function CategoryLane({
  units,
  unitWidth,
  items,
  msPerPx,
  minMs,
  onEditTask,
  onUpdateTask,
}: Props) {
  return (
    <div className="scheduler-lane">
      <div className="scheduler-lane-grid">
        {units.map((_, i) => (
          <div
            key={i}
            className="scheduler-grid-col"
            style={{ right: i * unitWidth, width: unitWidth }}
          />
        ))}
      </div>
      <div className="scheduler-lane-tasks">
        {items.map(({ layout, rowIndex }) =>
          layout.widthPx > 0 ? (
            <TaskCard
              key={layout.task.id}
              layout={layout}
              top={rowIndex * (CARD_HEIGHT + CARD_GAP) + CARD_TOP_PADDING}
              height={CARD_HEIGHT}
              msPerPx={msPerPx}
              minMs={minMs}
              onDoubleClick={() => onEditTask(layout.task.id)}
              onChange={onUpdateTask}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
