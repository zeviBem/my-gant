import { useRef, useState } from "react";
import type { Task } from "../../models/Task";
import type { TaskLayout } from "../../types/timeline.types";
import {
  formatTaskLong,
  formatTaskShort,
  stripeColorFor,
} from "../../helpers/task.helpers";

type DragMode = "move" | "resize-l" | "resize-r";

interface Props {
  layout: TaskLayout;
  msPerPx: number;
  minMs: number;
  top?: number;
  height?: number;
  onDoubleClick?: () => void;
  onChange?: (task: Task) => void;
}

export function TaskCard({
  layout,
  msPerPx,
  minMs,
  top,
  height,
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
      // RTL: dragging right on screen moves toward earlier time, so invert the screen delta.
      const dxMs = -(ev.clientX - startX) * msPerPx;
      let s = origStart;
      let en = origEnd;
      if (mode === "move") { s = origStart + dxMs; en = origEnd + dxMs; }
      else if (mode === "resize-l") s = Math.min(origStart + dxMs, origEnd - minMs);
      else en = Math.max(origEnd + dxMs, origStart + minMs);
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

  const tooltip = `${task.title}\nStart: ${formatTaskLong(task.start)}\nEnd: ${formatTaskLong(task.end)}`;
  const stripe = stripeColorFor(task.id);

  return (
    <div
      className={`gantt-bar scheduler-task-card${active ? " gantt-bar-active" : ""}`}
      style={{
        right: layout.offsetPx,
        width: layout.widthPx,
        top: top ?? undefined,
        height: height ?? undefined,
        bottom: top !== undefined ? "auto" : undefined,
      }}
      title={active ? "" : tooltip}
      onMouseDown={(e) => startDrag(e, "move")}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="gantt-bar-handle gantt-bar-handle-l"
        onMouseDown={(e) => startDrag(e, "resize-l")}
      />
      <div className="scheduler-task-content">
        <div className="scheduler-task-title">{task.title}</div>
        <div className="scheduler-task-time">
          {formatTaskShort(task.start)} – {formatTaskShort(task.end)}
        </div>
      </div>
      <span className="scheduler-task-stripe" style={{ background: stripe }} aria-hidden="true" />
      <div
        className="gantt-bar-handle gantt-bar-handle-r"
        onMouseDown={(e) => startDrag(e, "resize-r")}
      />
    </div>
  );
}
