"use client";
import { useEffect, useRef } from "react";
import { compact } from "@/lib/data/model";
/** Updates the text node directly so a frame never rerenders the whole race. */
export default function AnimatedValue({
  value,
  duration,
}: {
  value: number | null;
  duration: number;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (!el.current) return;
    if (value === null || from === null || duration === 0) {
      el.current.textContent = compact(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      if (el.current)
        el.current.textContent = compact(
          from + (value - from) * (1 - Math.pow(1 - t, 3)),
        );
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <span ref={el}>{compact(value)}</span>;
}
