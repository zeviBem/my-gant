export type TimeScale = "minute" | "hour" | "day" | "week" | "month" | "year" | "custom";

export interface Task {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export interface GanttConfig {
  unitWidth: number;
  rowHeight: number;
}

export interface TimelineUnit {
  start: Date;
  end: Date;
  label: string;
}

export interface TimelineRange {
  scale: TimeScale;
  start: Date;
  end: Date;
  units: TimelineUnit[];
}

export interface TaskLayout {
  task: Task;
  offsetPx: number;
  widthPx: number;
}
