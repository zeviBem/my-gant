import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  TextField,
} from "@mui/material";
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
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? "Edit Task" : "Add Task"}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            autoFocus
          />
          <TextField
            label="Start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
