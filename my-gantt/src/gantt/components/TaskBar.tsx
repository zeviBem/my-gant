import { useRef, useState } from "react";
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
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
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

  return (
    <>
      <div
        className={`gantt-bar${active ? " gantt-bar-active" : ""}`}
        style={{ left: layout.offsetPx, width: layout.widthPx }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseDown={(e) => startDrag(e, "move")}
        onDoubleClick={onDoubleClick}
      >
        <div
          className="gantt-bar-handle gantt-bar-handle-l"
          onMouseDown={(e) => startDrag(e, "resize-l")}
        />
        <span className="gantt-bar-label">{task.title}</span>
        <div
          className="gantt-bar-handle gantt-bar-handle-r"
          onMouseDown={(e) => startDrag(e, "resize-r")}
        />
      </div>
      {hover && !active && (
        <div
          className="gantt-tooltip"
          style={{ left: pos.x + 12, top: pos.y + 12 }}
        >
          <div className="gantt-tooltip-title">{task.title}</div>
          <div>Start: {fmt(task.start)}</div>
          <div>End: {fmt(task.end)}</div>
        </div>
      )}
    </>
  );
}
