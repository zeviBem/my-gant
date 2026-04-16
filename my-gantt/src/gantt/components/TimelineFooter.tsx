import { Box, Typography } from "@mui/material";
import type { TimeScaleTick } from "../engine/timeScaleEngine";

interface Props {
  ticks: TimeScaleTick[];
  totalWidth: number;
  rangeStart: Date;
  rangeEnd: Date;
}

export function TimelineFooter({ ticks, totalWidth, rangeStart, rangeEnd }: Props) {
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  if (rangeMs <= 0) return null;

  return (
    <Box
      sx={{
        width: totalWidth,
        height: 28,
        position: "relative",
        bgcolor: "grey.50",
        borderTop: 1,
        borderColor: "divider",
        mb: 2,
      }}
    >
      {ticks.map((t, i) => {
        const x = ((t.time.getTime() - rangeStart.getTime()) / rangeMs) * totalWidth;
        const atEnd = totalWidth - x < 40;
        return (
          <Typography
            key={i}
            variant="caption"
            sx={{
              position: "absolute",
              left: x,
              top: "6px",
              px: "4px",
              transform: atEnd ? "translateX(-100%)" : "none",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              color: "text.secondary",
            }}
          >
            {t.label}
          </Typography>
        );
      })}
    </Box>
  );
}
