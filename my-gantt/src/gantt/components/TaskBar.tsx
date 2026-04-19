import { useRef, useState } from "react";
import type { Task, TaskLayout } from "../types";

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

const STRIPE_COLORS = ["#4ADE80", "#FACC15", "#F87171", "#3FA9FF"];

function stripeColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return STRIPE_COLORS[hash % STRIPE_COLORS.length];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtShort(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskBar({
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

  const tooltip = `${task.title}\nStart: ${fmt(task.start)}\nEnd: ${fmt(task.end)}`;
  const stripe = stripeColorFor(task.id);

  return (
    <div
      className={`gantt-bar scheduler-task-card${active ? " gantt-bar-active" : ""}`}
      style={{
        left: layout.offsetPx,
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
          {fmtShort(task.start)} – {fmtShort(task.end)}
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
