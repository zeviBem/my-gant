import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { GanttConfig, Task, TimeScale } from "../types";
import { getCustomRange, getTimeScaleRange, layoutTasks } from "../engine";
import { TaskRow } from "./TaskRow";
import { ScaleSelector } from "./ScaleSelector";
import { CurrentTimeLine } from "./CurrentTimeLine";
import { AddTaskModal } from "./AddTaskModal";
import { TimelineFooter } from "./TimelineFooter";
import { getTimeScale } from "../engine/timeScaleEngine";

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
    <Box sx={{ fontFamily: "system-ui, sans-serif", width: "100%", boxSizing: "border-box" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <ScaleSelector value={scale} onChange={handleScaleChange} />
          <Button
            variant="outlined"
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
          </Button>
          <Button
            variant={liveMode ? "contained" : "outlined"}
            color={liveMode ? "error" : "primary"}
            startIcon={<VisibilityIcon />}
            onClick={() => setLiveMode((v) => !v)}
          >
            Live
          </Button>
          {scale === "custom" && (
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <TextField
                label="Start"
                type="datetime-local"
                size="small"
                value={customStartInput}
                onChange={(e) => {
                  setLiveMode(false);
                  setCustomStartInput(e.target.value);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End"
                type="datetime-local"
                size="small"
                value={customEndInput}
                onChange={(e) => {
                  setLiveMode(false);
                  setCustomEndInput(e.target.value);
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button variant="outlined" onClick={applyCustom}>
                Apply
              </Button>
              {customError && (
                <Alert severity="error" sx={{ py: 0 }}>
                  {customError}
                </Alert>
              )}
            </Box>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowModal(true)}
        >
          Add Task
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "hidden" }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            fontWeight: 600,
            bgcolor: "grey.50",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {timeScale.headerLabel}
          </Typography>
        </Box>

        <Box
          ref={scrollRef}
          sx={{
            width: "100%",
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            boxSizing: "border-box",
            scrollbarGutter: "stable",
          }}
        >
          <Box sx={{ position: "relative", width: totalWidth }}>
            <Box sx={{ position: "relative" }}>
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
            </Box>
            <CurrentTimeLine range={range} totalWidth={totalWidth} />
            <TimelineFooter
              ticks={timeScale.ticks}
              totalWidth={totalWidth}
              rangeStart={range.start}
              rangeEnd={range.end}
            />
          </Box>
        </Box>
      </Paper>

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
    </Box>
  );
}
