import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import type { TimeScale } from "../types";

const OPTIONS: TimeScale[] = ["minute", "hour", "day", "week", "month", "year", "custom"];

interface Props {
  value: TimeScale;
  onChange: (scale: TimeScale) => void;
}

export function ScaleSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<TimeScale>) =>
    onChange(e.target.value as TimeScale);

  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <InputLabel id="gantt-scale-label">Scale</InputLabel>
      <Select
        labelId="gantt-scale-label"
        label="Scale"
        value={value}
        onChange={handleChange}
      >
        {OPTIONS.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt[0].toUpperCase() + opt.slice(1)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
