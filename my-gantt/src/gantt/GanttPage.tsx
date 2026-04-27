import { useCallback, useState } from "react";
import type { Category } from "./models/Category";
import type { Task } from "./models/Task";
import type { GanttConfig } from "./models/TimelineConfig";
import type { TimeScale } from "./types/timeline.types";
import {
  addTask,
  applyLiveTick,
  findTaskById,
  replaceTask,
  withLiveOff,
} from "./helpers/gantt.helpers";
import useCustomRange from "./hooks/useCustomRange";
import { useLiveMode } from "./hooks/useLiveMode";
import { useTimelineEngine } from "./hooks/useTimelineEngine";
import { AddTaskModal } from "./components/AddTaskModal";
import { GanttHeader } from "./components/header/GanttHeader";
import { GanttTimeline } from "./components/timeline/GanttTimeline";
import "./Gantt.css";

interface Props {
  tasks: Task[];
  categories?: Category[];
  anchorDate?: Date;
  initialScale?: TimeScale;
  config?: Partial<GanttConfig>;
  title?: string;
}

export function GanttPage({
  tasks: initialTasks,
  categories,
  anchorDate,
  initialScale = "week",
  config,
  title,
}: Props) {
  const {
    scale,
    setScale,
    setCenterTime,
    setCustomApplied,
    range,
    headerLabel,
  } = useTimelineEngine(initialScale, anchorDate);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const custom = useCustomRange(setCustomApplied);

  const { liveMode, setLiveMode } = useLiveMode(scale, range, (now, r, s) =>
    applyLiveTick(now, r, s, setCenterTime, custom.sync),
  );

  const handleScaleChange = withLiveOff(setLiveMode, setScale);
  const handleNow = () =>
    applyLiveTick(new Date(), range, scale, setCenterTime, custom.sync);
  const updateTask = withLiveOff(setLiveMode, (u: Task) =>
    setTasks((prev) => replaceTask(prev, u)),
  );
  const onUserScroll = useCallback(() => setLiveMode(false), [setLiveMode]);
  const onCustomStartInputChange = withLiveOff(setLiveMode, custom.setStartInput);
  const onCustomEndInputChange = withLiveOff(setLiveMode, custom.setEndInput);
  const onApplyCustom = withLiveOff(setLiveMode, custom.apply);

  return (
    <div
      className="gantt-page"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <GanttHeader
        title={title}
        scale={scale}
        onScaleChange={handleScaleChange}
        onNow={handleNow}
        liveMode={liveMode}
        onToggleLive={() => setLiveMode((v) => !v)}
        onAddTask={() => setShowModal(true)}
        customStartInput={custom.startInput}
        customEndInput={custom.endInput}
        customError={custom.error}
        onCustomStartInputChange={onCustomStartInputChange}
        onCustomEndInputChange={onCustomEndInputChange}
        onApplyCustom={onApplyCustom}
      />
      <GanttTimeline
        scale={scale}
        range={range}
        headerLabel={headerLabel}
        tasks={tasks}
        categories={categories}
        config={config}
        liveMode={liveMode}
        onUserScroll={onUserScroll}
        onEditTask={setEditingId}
        onUpdateTask={updateTask}
      />
      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onSave={(t) => setTasks((prev) => addTask(prev, t))}
        />
      )}
      {editingId && (
        <AddTaskModal
          initial={findTaskById(tasks, editingId)}
          onClose={() => setEditingId(null)}
          onSave={(u) => setTasks((prev) => replaceTask(prev, u))}
        />
      )}
    </div>
  );
}
