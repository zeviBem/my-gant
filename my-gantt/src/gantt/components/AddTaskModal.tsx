import { useEffect, useState } from "react";
import type { Task } from "../types";

interface Props {
  onClose: () => void;
  onSave: (task: Task) => void;
  initial?: Task;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddTaskModal({ onClose, onSave, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [start, setStart] = useState(initial ? toLocalInput(initial.start) : "");
  const [end, setEnd] = useState(initial ? toLocalInput(initial.end) : "");
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    if (!title.trim()) return setError("Title is required");
    if (!start || !end) return setError("Start and end dates are required");
    const s = new Date(start);
    const e = new Date(end);
    if (e <= s) return setError("End must be after start");
    onSave({
      id: initial?.id ?? `task-${Date.now()}`,
      title: title.trim(),
      start: s,
      end: e,
    });
    onClose();
  };

  return (
    <div
      className="gantt-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gantt-modal-title"
      onClick={onClose}
    >
      <div className="gantt-modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="gantt-modal-title" className="gantt-modal-title">
          {initial ? "Edit Task" : "Add Task"}
        </h3>
        <div className="gantt-modal-content">
          <label className="gantt-field">
            <span className="gantt-field-label">Title</span>
            <input
              className="gantt-input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="gantt-field">
            <span className="gantt-field-label">Start</span>
            <input
              className="gantt-input"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="gantt-field">
            <span className="gantt-field-label">End</span>
            <input
              className="gantt-input"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          {error && <div className="gantt-alert-error">{error}</div>}
        </div>
        <div className="gantt-modal-actions">
          <button type="button" className="gantt-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="gantt-btn gantt-btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
