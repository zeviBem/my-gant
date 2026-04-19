import type { TimeScale } from "../types";

const OPTIONS: TimeScale[] = ["minute", "hour", "day", "week", "month", "year", "custom"];

interface Props {
  value: TimeScale;
  onChange: (scale: TimeScale) => void;
}

export function ScaleSelector({ value, onChange }: Props) {
  return (
    <select
      className="gantt-select"
      aria-label="Scale"
      value={value}
      onChange={(e) => onChange(e.target.value as TimeScale)}
    >
      {OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt[0].toUpperCase() + opt.slice(1)}
        </option>
      ))}
    </select>
  );
}
