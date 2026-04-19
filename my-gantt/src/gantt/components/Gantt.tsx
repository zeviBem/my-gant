import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, GanttConfig, Task, TaskLayout, TimeScale } from "../types";
import { getCustomRange, getTimeScaleRange, layoutTasks } from "../engine";
import { ScaleSelector } from "./ScaleSelector";
import { CurrentTimeLine } from "./CurrentTimeLine";
import { AddTaskModal } from "./AddTaskModal";
import { TaskBar } from "./TaskBar";
import { getTimeScale } from "../engine/timeScaleEngine";
import "../Gantt.css";

interface Props {
  tasks: Task[];
  categories?: Category[];
  anchorDate?: Date;
  initialScale?: TimeScale;
  config?: Partial<GanttConfig>;
}

const CARD_HEIGHT = 44;
const CARD_GAP = 4;
const CARD_TOP_PADDING = 6;

const DEFAULT_CATEGORY_ID = "general";

function stackLaneTasks(
  laneLayouts: TaskLayout[],
): Array<{ layout: TaskLayout; rowIndex: number }> {
  const sorted = [...laneLayouts].sort(
    (a, b) => a.task.start.getTime() - b.task.start.getTime(),
  );
  const rowEnds: number[] = [];
  return sorted.map((layout) => {
    const s = layout.task.start.getTime();
    const e = layout.task.end.getTime();
    let rowIndex = rowEnds.findIndex((end) => end <= s);
    if (rowIndex === -1) {
      rowIndex = rowEnds.length;
      rowEnds.push(e);
    } else {
      rowEnds[rowIndex] = e;
    }
    return { layout, rowIndex };
  });
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

export function Gantt({
  tasks: initialTasks,
  categories,
  anchorDate,
  initialScale = "week",
  config,
}: Props) {
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
    rowHeight: config?.rowHeight ?? 64,
  };

  const derivedCategories = useMemo<Category[]>(() => {
    if (categories && categories.length > 0) return categories;
    const seen = new Map<string, Category>();
    for (const t of tasks) {
      const id = t.categoryId ?? DEFAULT_CATEGORY_ID;
      if (!seen.has(id)) {
        seen.set(id, { id, name: id === DEFAULT_CATEGORY_ID ? "Tasks" : id });
      }
    }
    if (seen.size === 0) {
      seen.set(DEFAULT_CATEGORY_ID, { id: DEFAULT_CATEGORY_ID, name: "Tasks" });
    }
    return Array.from(seen.values());
  }, [categories, tasks]);

  const lanes = useMemo(() => {
    return derivedCategories.map((cat) => {
      const laneTasks = tasks.filter(
        (t) => (t.categoryId ?? DEFAULT_CATEGORY_ID) === cat.id,
      );
      const laneLayouts = layoutTasks(laneTasks, range, cfg.unitWidth);
      return { category: cat, items: stackLaneTasks(laneLayouts) };
    });
  }, [derivedCategories, tasks, range, cfg.unitWidth]);

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

      <div className="gantt-paper scheduler-container">
        <div className="gantt-top-time-row scheduler-top-row">{timeScale.headerLabel}</div>

        <div className="scheduler-outer">
          <div className="gantt-scroll scheduler-scroll" ref={scrollRef}>
            <div
              className="gantt-inner scheduler-inner"
              style={{ width: totalWidth }}
            >
              <div
                className="scheduler-timeline-header"
                style={{ width: totalWidth }}
              >
                {range.units.map((u, i) => {
                  const parts = u.label.split(" ");
                  return (
                    <div
                      key={i}
                      className="scheduler-timeline-header-cell"
                      style={{ width: cfg.unitWidth }}
                    >
                      {parts.length > 1 ? (
                        <>
                          <span className="scheduler-hdr-primary">{parts[0]}</span>
                          <span className="scheduler-hdr-secondary">
                            {parts.slice(1).join(" ")}
                          </span>
                        </>
                      ) : (
                        <span className="scheduler-hdr-primary">{u.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                className="scheduler-body"
                style={{
                  width: totalWidth,
                  gridTemplateRows: `repeat(${Math.max(lanes.length, 1)}, 1fr)`,
                }}
              >
                {lanes.map((lane) => (
                  <div className="scheduler-lane" key={lane.category.id}>
                    <div className="scheduler-lane-grid">
                      {range.units.map((_, i) => (
                        <div
                          key={i}
                          className="scheduler-grid-col"
                          style={{
                            left: i * cfg.unitWidth,
                            width: cfg.unitWidth,
                          }}
                        />
                      ))}
                    </div>
                    <div className="scheduler-lane-tasks">
                      {lane.items.map(({ layout, rowIndex }) =>
                        layout.widthPx > 0 ? (
                          <TaskBar
                            key={layout.task.id}
                            layout={layout}
                            top={
                              rowIndex * (CARD_HEIGHT + CARD_GAP) +
                              CARD_TOP_PADDING
                            }
                            height={CARD_HEIGHT}
                            msPerPx={msPerPx}
                            minMs={minMs}
                            onDoubleClick={() => setEditingId(layout.task.id)}
                            onChange={updateTask}
                          />
                        ) : null,
                      )}
                    </div>
                  </div>
                ))}
                <CurrentTimeLine range={range} totalWidth={totalWidth} />
              </div>
            </div>
          </div>
          <aside className="scheduler-labels">
            <div className="scheduler-labels-top-spacer" />
            <div
              className="scheduler-labels-body"
              style={{
                gridTemplateRows: `repeat(${Math.max(lanes.length, 1)}, 1fr)`,
              }}
            >
              {lanes.map((lane) => (
                <div className="scheduler-lane-label" key={lane.category.id}>
                  <span className="scheduler-lane-label-text">
                    {lane.category.name}
                  </span>
                </div>
              ))}
            </div>
          </aside>
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
