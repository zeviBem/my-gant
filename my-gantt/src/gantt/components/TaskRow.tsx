import { Box } from "@mui/material";
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
    <Box
      sx={{
        position: "relative",
        borderBottom: 1,
        borderColor: "grey.100",
        overflow: "hidden",
        height: config.rowHeight,
        width: unitCount * config.unitWidth,
      }}
    >
      {Array.from({ length: unitCount }, (_, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: i * config.unitWidth,
            width: config.unitWidth,
            borderRight: "1px solid",
            borderColor: "grey.100",
          }}
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
    </Box>
  );
}
