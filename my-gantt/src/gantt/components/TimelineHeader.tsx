import { Box } from "@mui/material";
import type { GanttConfig, TimelineUnit } from "../types";

interface Props {
  units: TimelineUnit[];
  config: GanttConfig;
}

export function TimelineHeader({ units, config }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "grey.100",
        width: units.length * config.unitWidth,
      }}
    >
      {units.map((u, i) => (
        <Box
          key={i}
          sx={{
            width: config.unitWidth,
            minWidth: config.unitWidth,
            boxSizing: "border-box",
            borderRight: 1,
            borderColor: "grey.200",
            textAlign: "center",
            py: "6px",
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          {u.label}
        </Box>
      ))}
    </Box>
  );
}
