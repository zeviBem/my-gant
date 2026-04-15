import { useEffect, useMemo, useRef, useState } from "react";
import type { GanttConfig, Task, TimeScale } from "../types";
import { getCustomRange, getTimeScaleRange, layoutTasks } from "../engine";
import { TaskRow } from "./TaskRow";
import { ScaleSelector } from "./ScaleSelector";
import { CurrentTimeLine } from "./CurrentTimeLine";
import { AddTaskModal } from "./AddTaskModal";
import { TimelineFooter } from "./TimelineFooter";
import { getTimeScale } from "../engine/timeScaleEngine";
import "../Gantt.css";

interface Props {
  tasks: Task[];
  anchorDate?: Date;
  initialScale?: TimeScale;
  config?: Partial<GanttConfig>;
}

const MIN_UNIT_WIDTH: Record<TimeScale, number> = {
  hour: 60,
  day: 50,
  week: 80,
  month: 120,
  year: 70,
  custom: 60,
};

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Gantt({ tasks: initialTasks, anchorDate, initialScale = "week", config }: Props) {
  const [scale, setScale] = useState<TimeScale>(initialScale);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hourEntryTime, setHourEntryTime] = useState<Date | null>(
    initialScale === "hour" ? new Date() : null,
  );
  const defaultCustomStart = useMemo(() => new Date(), []);
  const defaultCustomEnd = useMemo(
    () => new Date(defaultCustomStart.getTime() + 24 * 60 * 60 * 1000),
    [defaultCustomStart],
  );
  const [customStartInput, setCustomStartInput] = useState(toDatetimeLocal(defaultCustomStart));
  const [customEndInput, setCustomEndInput] = useState(toDatetimeLocal(defaultCustomEnd));
  const [customApplied, setCustomApplied] = useState<{ start: Date; end: Date } | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const applyCustom = () => {
    if (!customStartInput || !customEndInput) {
      setCustomError("Both fields are required");
      return;
    }
    const s = new Date(customStartInput);
    const e = new Date(customEndInput);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      setCustomError("Invalid date");
      return;
    }
    if (e.getTime() <= s.getTime()) {
      setCustomError("End must be after Start");
      return;
    }
    setCustomError(null);
    setCustomApplied({ start: s, end: e });
  };

  useEffect(() => {
    if (scale === "hour") {
      setHourEntryTime((prev) => prev ?? new Date());
    } else {
      setHourEntryTime(null);
    }
  }, [scale]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const anchor =
    anchorDate ??
    (scale === "hour"
      ? hourEntryTime ?? new Date()
      : scale === "day"
        ? new Date()
        : tasks[0]?.start ?? new Date());
  const range = useMemo(() => {
    if (scale === "custom" && customApplied) {
      return getCustomRange(customApplied.start, customApplied.end);
    }
    return getTimeScaleRange(scale, anchor);
  }, [scale, anchor, customApplied]);

  const unitWidth = useMemo(() => {
    if (config?.unitWidth) return config.unitWidth;
    const stretched = containerWidth / range.units.length;
    return Math.max(MIN_UNIT_WIDTH[scale], stretched || MIN_UNIT_WIDTH[scale]);
  }, [containerWidth, range.units.length, scale, config?.unitWidth]);

  const cfg: GanttConfig = {
    unitWidth,
    rowHeight: config?.rowHeight ?? 36,
  };

  const layouts = useMemo(
    () => layoutTasks(tasks, range, cfg.unitWidth),
    [tasks, range, cfg.unitWidth],
  );

  const totalWidth = range.units.length * cfg.unitWidth;
  const timeScale = useMemo(
    () => getTimeScale({ zoom: scale, visibleStart: range.start, visibleEnd: range.end }),
    [scale, range.start, range.end],
  );
  const rangeMs = range.end.getTime() - range.start.getTime();
  const msPerPx = totalWidth > 0 ? rangeMs / totalWidth : 0;
  const minMs = rangeMs / range.units.length;

  const updateTask = (updated: Task) =>
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  return (
    <div className="gantt-container">
      <div className="gantt-toolbar">
        <ScaleSelector value={scale} onChange={setScale} />
        <button className="gantt-add-btn" onClick={() => setShowModal(true)}>
          + Add Task
        </button>
        {scale === "custom" && (
          <div className="gantt-custom-range">
            <label>
              Start
              <input
                type="datetime-local"
                value={customStartInput}
                onChange={(e) => setCustomStartInput(e.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="datetime-local"
                value={customEndInput}
                onChange={(e) => setCustomEndInput(e.target.value)}
              />
            </label>
            <button type="button" onClick={applyCustom}>Apply</button>
            {customError && <span className="gantt-custom-error">{customError}</span>}
          </div>
        )}
      </div>
      <div className="gantt-scroll" ref={scrollRef}>
        <div className="gantt-inner" style={{ width: totalWidth }}>
          <div
            className="gantt-top-time-row"
            style={{ width: totalWidth }}
          >
            {timeScale.headerLabel}
          </div>
          <div className="gantt-body">
            {layouts.map((layout) => (
              <TaskRow
                key={layout.task.id}
                layout={layout}
                unitCount={range.units.length}
                config={cfg}
                msPerPx={msPerPx}
                minMs={minMs}
                onEdit={() => setEditingId(layout.task.id)}
                onChange={updateTask}
              />
            ))}
          </div>
          <CurrentTimeLine range={range} totalWidth={totalWidth} />
          <TimelineFooter
            ticks={timeScale.ticks}
            totalWidth={totalWidth}
            rangeStart={range.start}
            rangeEnd={range.end}
          />
        </div>
      </div>
      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onSave={(t) => setTasks((prev) => [...prev, t])}
        />
      )}
      {editingId && (
        <AddTaskModal
          initial={tasks.find((t) => t.id === editingId)}
          onClose={() => setEditingId(null)}
          onSave={(updated) =>
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }
        />
      )}
    </div>
  );
}
