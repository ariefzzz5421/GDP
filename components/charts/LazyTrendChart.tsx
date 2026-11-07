"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Country, Dataset, Metric } from "@/lib/data/model";
const TrendChart = dynamic(() => import("./TrendChart"), {
  ssr: false,
  loading: () => <div className="loading">Loading interactive chart…</div>,
});
export default function LazyTrendChart(props: {
  dataset: Dataset;
  countries: Country[];
  metric: Metric;
  ranking?: Record<string, number>;
  resetKey?: number;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!element.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={element} style={{ minHeight: 300 }}>
      {visible ? (
        <TrendChart {...props} />
      ) : (
        <div
          className="loading"
          aria-label="Comparison chart loads when in view"
        >
          Explore the trend ↓
        </div>
      )}
    </div>
  );
}
