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
  minute: 60,
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
  const [centerTime, setCenterTime] = useState<Date>(() => new Date());
  const defaultCustomStart = useMemo(() => new Date(), []);
  const defaultCustomEnd = useMemo(
    () => new Date(defaultCustomStart.getTime() + 24 * 60 * 60 * 1000),
    [defaultCustomStart],
  );
  const [customStartInput, setCustomStartInput] = useState(toDatetimeLocal(defaultCustomStart));
  const [customEndInput, setCustomEndInput] = useState(toDatetimeLocal(defaultCustomEnd));
  const [customApplied, setCustomApplied] = useState<{ start: Date; end: Date } | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);

  const applyCustom = () => {
    setLiveMode(false);
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

  const handleScaleChange = (s: TimeScale) => {
    setLiveMode(false);
    setScale(s);
  };

  useEffect(() => {
    setCenterTime(new Date());
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

  const anchor = anchorDate ?? centerTime;
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

  const updateTask = (updated: Task) => {
    setLiveMode(false);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  useEffect(() => {
    if (!liveMode) return;
    const tick = () => {
      const now = new Date();
      const r = rangeRef.current;
      const nowMs = now.getTime();
      if (nowMs > r.start.getTime() && nowMs < r.end.getTime()) return;
      if (scale === "custom") {
        const duration = r.end.getTime() - r.start.getTime();
        const start = new Date(nowMs - duration / 2);
        const end = new Date(nowMs + duration / 2);
        setCustomApplied({ start, end });
        setCustomStartInput(toDatetimeLocal(start));
        setCustomEndInput(toDatetimeLocal(end));
      } else {
        setCenterTime(now);
      }
    };
    tick();
    const interval = scale === "minute" ? 1000 : 60000;
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [liveMode, scale]);

  useEffect(() => {
    if (!liveMode) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setLiveMode(false);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [liveMode]);

  return (
    <div className="gantt-container">
      <div className="gantt-toolbar">
        <div className="gantt-toolbar-group">
          <ScaleSelector value={scale} onChange={handleScaleChange} />
          <button
            type="button"
            className="gantt-btn"
            onClick={() => {
              const now = new Date();
              if (scale === "custom") {
                const duration = range.end.getTime() - range.start.getTime();
                const start = new Date(now.getTime() - duration / 2);
                const end = new Date(now.getTime() + duration / 2);
                setCustomApplied({ start, end });
                setCustomStartInput(toDatetimeLocal(start));
                setCustomEndInput(toDatetimeLocal(end));
                return;
              }
              setCenterTime(now);
            }}
          >
            Now
          </button>
          <button
            type="button"
            className={`gantt-btn${liveMode ? " gantt-btn-live-on" : ""}`}
            aria-pressed={liveMode}
            onClick={() => setLiveMode((v) => !v)}
          >
            <span aria-hidden="true">👁</span>
            Live
          </button>
          {scale === "custom" && (
            <div className="gantt-toolbar-group">
              <label className="gantt-field">
                <span className="gantt-field-label">Start</span>
                <input
                  className="gantt-input"
                  type="datetime-local"
                  value={customStartInput}
                  onChange={(e) => {
                    setLiveMode(false);
                    setCustomStartInput(e.target.value);
                  }}
                />
              </label>
              <label className="gantt-field">
                <span className="gantt-field-label">End</span>
                <input
                  className="gantt-input"
                  type="datetime-local"
                  value={customEndInput}
                  onChange={(e) => {
                    setLiveMode(false);
                    setCustomEndInput(e.target.value);
                  }}
                />
              </label>
              <button type="button" className="gantt-btn" onClick={applyCustom}>
                Apply
              </button>
              {customError && <div className="gantt-alert-error">{customError}</div>}
            </div>
          )}
        </div>
        <button
          type="button"
          className="gantt-btn gantt-btn-primary"
          onClick={() => setShowModal(true)}
        >
          <span aria-hidden="true">+</span>
          Add Task
        </button>
      </div>

      <div className="gantt-paper">
        <div className="gantt-top-time-row">{timeScale.headerLabel}</div>

        <div className="gantt-scroll" ref={scrollRef}>
          <div className="gantt-inner" style={{ width: totalWidth }}>
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
