import type { TimeScale } from "../../types/timeline.types";
import { ScaleSelector } from "./ScaleSelector";

interface Props {
  title?: string;
  scale: TimeScale;
  onScaleChange: (s: TimeScale) => void;
  onNow: () => void;
  liveMode: boolean;
  onToggleLive: () => void;
  onAddTask: () => void;
  customStartInput: string;
  customEndInput: string;
  customError: string | null;
  onCustomStartInputChange: (v: string) => void;
  onCustomEndInputChange: (v: string) => void;
  onApplyCustom: () => void;
}

export function GanttHeader({
  title = "Project Timeline",
  scale,
  onScaleChange,
  onNow,
  liveMode,
  onToggleLive,
  onAddTask,
  customStartInput,
  customEndInput,
  customError,
  onCustomStartInputChange,
  onCustomEndInputChange,
  onApplyCustom,
}: Props) {
  return (
    <div style={{ flexShrink: 0 }}>
      <h2 style={{ margin: "0 0 16px" }}>{title}</h2>
      <div className="gantt-toolbar">
        <div className="gantt-toolbar-group">
          <ScaleSelector value={scale} onChange={onScaleChange} />
          <button type="button" className="gantt-btn" onClick={onNow}>
            Now
          </button>
          <button
            type="button"
            className={`gantt-btn${liveMode ? " gantt-btn-live-on" : ""}`}
            aria-pressed={liveMode}
            onClick={onToggleLive}
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
                  onChange={(e) => onCustomStartInputChange(e.target.value)}
                />
              </label>
              <label className="gantt-field">
                <span className="gantt-field-label">End</span>
                <input
                  className="gantt-input"
                  type="datetime-local"
                  value={customEndInput}
                  onChange={(e) => onCustomEndInputChange(e.target.value)}
                />
              </label>
              <button type="button" className="gantt-btn" onClick={onApplyCustom}>
                Apply
              </button>
              {customError && <div className="gantt-alert-error">{customError}</div>}
            </div>
          )}
        </div>
        <button type="button" className="gantt-btn gantt-btn-primary" onClick={onAddTask}>
          <span aria-hidden="true">+</span>
          Add Task
        </button>
      </div>
    </div>
  );
}
