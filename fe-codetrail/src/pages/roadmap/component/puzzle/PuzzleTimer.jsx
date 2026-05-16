import { useEffect, useMemo, useState } from "react";

export function usePuzzleTimer(open) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!open) return;

    setSecondsElapsed(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setSecondsElapsed((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const timeMM = useMemo(() => {
    return String(Math.floor(secondsElapsed / 60)).padStart(2, "0");
  }, [secondsElapsed]);

  const timeSS = useMemo(() => {
    return String(secondsElapsed % 60).padStart(2, "0");
  }, [secondsElapsed]);

  return {
    secondsElapsed,
    timeMM,
    timeSS,
    timeText: `${timeMM}:${timeSS}`,
  };
}