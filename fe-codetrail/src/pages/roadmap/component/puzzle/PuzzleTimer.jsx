import { useEffect, useMemo, useRef, useState } from "react";

export function usePuzzleTimer(open, initialSeconds = 0, resetKey = "default") {
  const [secondsElapsed, setSecondsElapsed] = useState(() =>
    Math.max(0, Number(initialSeconds || 0)),
  );

  const wasOpenRef = useRef(false);
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const shouldReset =
      wasOpenRef.current === false || resetKeyRef.current !== resetKey;

    if (shouldReset) {
      setSecondsElapsed(Math.max(0, Number(initialSeconds || 0)));
      resetKeyRef.current = resetKey;
    }

    wasOpenRef.current = true;
  }, [open, initialSeconds, resetKey]);

  useEffect(() => {
    if (!open) return;

    const timer = setInterval(() => {
      setSecondsElapsed((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open, resetKey]);

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
