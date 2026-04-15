import type { TimeScale } from "../types";

const OPTIONS: TimeScale[] = ["hour", "day", "week", "month", "year", "custom"];

interface Props {
  value: TimeScale;
  onChange: (scale: TimeScale) => void;
}

export function ScaleSelector({ value, onChange }: Props) {
  return (
    <div className="gantt-scale-selector">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          className={`gantt-scale-btn${opt === value ? " active" : ""}`}
          onClick={() => onChange(opt)}
          type="button"
        >
          {opt[0].toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}
