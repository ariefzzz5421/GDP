"use client";
import { useEffect, useRef } from "react";
import { formatMetric, type Metric } from "@/lib/data/model";
/** Updates the text node directly so a frame never rerenders the whole race. */
export default function AnimatedValue({
  value,
  duration,
  metric,
}: {
  value: number | null;
  duration: number;
  metric: Metric;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (!el.current) return;
    if (value === null || from === null || duration === 0) {
      el.current.textContent = formatMetric(value, metric);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      if (el.current)
        el.current.textContent = formatMetric(
          from + (value - from) * (1 - Math.pow(1 - t, 3)),
          metric,
        );
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, metric]);
  return <span ref={el}>{formatMetric(value, metric)}</span>;
}
