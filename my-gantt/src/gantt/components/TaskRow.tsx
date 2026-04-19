import type { GanttConfig, Task, TaskLayout } from "../types";
import { TaskBar } from "./TaskBar";

interface Props {
  layout: TaskLayout;
  unitCount: number;
  config: GanttConfig;
  msPerPx: number;
  minMs: number;
  onEdit?: () => void;
  onChange?: (task: Task) => void;
}

export function TaskRow({ layout, unitCount, config, msPerPx, minMs, onEdit, onChange }: Props) {
  return (
    <div
      className="gantt-row"
      style={{ height: config.rowHeight, width: unitCount * config.unitWidth }}
    >
      {Array.from({ length: unitCount }, (_, i) => (
        <div
          key={i}
          className="gantt-grid-cell"
          style={{ left: i * config.unitWidth, width: config.unitWidth }}
        />
      ))}
      {layout.widthPx > 0 && (
        <TaskBar
          layout={layout}
          msPerPx={msPerPx}
          minMs={minMs}
          onDoubleClick={onEdit}
          onChange={onChange}
        />
      )}
    </div>
  );
}
