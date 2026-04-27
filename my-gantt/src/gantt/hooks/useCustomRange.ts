import { useState } from "react";
import { DAY, toDatetimeLocal } from "../helpers/time.helpers";

const useCustomRange = (
  setCustomApplied: (v: { start: Date; end: Date } | null) => void,
) => {
  const [startInput, setStartInput] = useState(() =>
    toDatetimeLocal(new Date()),
  );
  const [endInput, setEndInput] = useState(() =>
    toDatetimeLocal(new Date(Date.now() + DAY)),
  );
  const [error, setError] = useState<string | null>(null);

  const sync = (start: Date, end: Date) => {
    setCustomApplied({ start, end });
    setStartInput(toDatetimeLocal(start));
    setEndInput(toDatetimeLocal(end));
  };

  const apply = () => {
    if (!startInput || !endInput) return setError("Both fields are required");
    const s = new Date(startInput);
    const e = new Date(endInput);
    if (isNaN(s.getTime()) || isNaN(e.getTime()))
      return setError("Invalid date");
    if (e.getTime() <= s.getTime()) return setError("End must be after Start");
    setError(null);
    setCustomApplied({ start: s, end: e });
  };

  return {
    startInput,
    endInput,
    error,
    setStartInput,
    setEndInput,
    sync,
    apply,
  };
};
export default useCustomRange;
