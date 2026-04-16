import { useRef, useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import type { Task, TaskLayout } from "../types";

type DragMode = "move" | "resize-l" | "resize-r";

interface Props {
  layout: TaskLayout;
  msPerPx: number;
  minMs: number;
  onDoubleClick?: () => void;
  onChange?: (task: Task) => void;
}

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskBar({
  layout,
  msPerPx,
  minMs,
  onDoubleClick,
  onChange,
}: Props) {
  const [active, setActive] = useState(false);
  const draggingRef = useRef(false);
  const { task } = layout;

  const startDrag = (e: React.MouseEvent, mode: DragMode) => {
    if (!onChange) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const origStart = task.start.getTime();
    const origEnd = task.end.getTime();
    draggingRef.current = true;
    setActive(true);

    const onMove = (ev: MouseEvent) => {
      const dxMs = (ev.clientX - startX) * msPerPx;
      let s = origStart;
      let en = origEnd;
      if (mode === "move") {
        s = origStart + dxMs;
        en = origEnd + dxMs;
      } else if (mode === "resize-l") {
        s = Math.min(origStart + dxMs, origEnd - minMs);
      } else {
        en = Math.max(origEnd + dxMs, origStart + minMs);
      }
      onChange({ ...task, start: new Date(s), end: new Date(en) });
    };
    const onUp = () => {
      draggingRef.current = false;
      setActive(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const tooltipContent = (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
        {task.title}
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Start: {fmt(task.start)}
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        End: {fmt(task.end)}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={active ? "" : tooltipContent} arrow followCursor>
      <Box
        sx={{
          position: "absolute",
          top: "6px",
          bottom: "6px",
          left: layout.offsetPx,
          width: layout.widthPx,
          bgcolor: "primary.main",
          borderRadius: 1,
          color: "#fff",
          px: 1,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          cursor: "move",
          userSelect: "none",
          boxShadow: active
            ? "0 0 0 2px #2563eb, 0 2px 6px rgba(0,0,0,0.25)"
            : "0 1px 2px rgba(0,0,0,0.1)",
          opacity: active ? 0.92 : 1,
        }}
        onMouseDown={(e) => startDrag(e, "move")}
        onDoubleClick={onDoubleClick}
      >
        <Box
          onMouseDown={(e) => startDrag(e, "resize-l")}
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "6px",
            cursor: "ew-resize",
            bgcolor: "rgba(0,0,0,0.15)",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            px: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            color: "#fff",
          }}
        >
          {task.title}
        </Typography>
        <Box
          onMouseDown={(e) => startDrag(e, "resize-r")}
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "6px",
            cursor: "ew-resize",
            bgcolor: "rgba(0,0,0,0.15)",
            borderRadius: "0 3px 3px 0",
          }}
        />
      </Box>
    </Tooltip>
  );
}
