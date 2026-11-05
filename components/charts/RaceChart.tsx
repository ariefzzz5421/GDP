"use client";

import AnimatedValue from "@/components/charts/AnimatedValue";

import Flag from "@/components/Flag";

import {
  compact,
  type Country,
  type Observation,
  type Metric,
} from "@/lib/data/model";

export function countryColor(code: string) {
  return (
    (
      {
        USA: "#55bfe5",
        CHN: "#e69b5b",
        DEU: "#ac9ae1",
        JPN: "#db879f",
        IND: "#76bfa7",
        GBR: "#72a2cf",
        FRA: "#779bd6",
        ITA: "#95ab73",
        CAN: "#bd839a",
        BRA: "#a2b970",
        IDN: "#edc36e",
      } as Record<string, string>
    )[code] ?? "#6998ad"
  );
}

export default function RaceChart({
  rows,
  countries,
  metric,
  year,
  highlight,
  onCountry,
  duration,
  unit,
  source,
}: {
  rows: Observation[];
  countries: Country[];
  metric: Metric;
  year: number;
  highlight: string;
  onCountry: (code: string) => void;
  duration: number;
  unit: string;
  source: string;
}) {
  const max = rows[0]?.[metric] ?? 1;
  const lookup = new Map(countries.map((c) => [c.code, c]));

  return (
    <div className="race-viewport">
      <div className="race-axis">
        <span>RANK / ECONOMY</span>
        <div>
          {[0, 0.25, 0.5, 0.75, 1].map((n) => (
            <span
              key={n}
              style={{
                left: `${n * 100}%`,
                transform: n ? "translateX(-50%)" : undefined,
              }}
            >
              {compact(n * max)}
            </span>
          ))}
        </div>
      </div>
      <div
        className="race-plot"
        style={{ height: Math.max(rows.length * 43, 210) }}
      >
        <div className="chart-grid">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} />
          ))}
        </div>
        <div className="year-watermark" aria-hidden="true">
          {year}
          <small>{unit}</small>
        </div>
        {rows.map((r, index) => {
          const c = lookup.get(r.code);
          if (!c) return null;
          return (
            <button
              className={`race-row ${r.code === highlight ? "race-highlight" : ""}`}
              key={r.code}
              style={{
                transform: `translateY(${index * 43}px)`,
                transitionDuration: `${duration}ms`,
              }}
              onClick={() => onCountry(r.code)}
              title={`${c.name} · ${year} · ${source}\nGDP: ${r.gdp?.toLocaleString("en-US") ?? "unavailable"}\nPer capita: ${r.pc?.toLocaleString("en-US") ?? "unavailable"}\n${unit} · ${metric === "pc" ? (r.pcStatus ?? r.status) : r.status}`}
            >
              <span className="race-label">
                <small>{String(index + 1).padStart(2, "0")}</small>
                <Flag country={c} />
                <span>{c.name}</span>
              </span>
              <span className="bar-track">
                <span
                  className="race-bar"
                  style={{
                    width: `calc(${(r[metric] ?? 0) / max} * var(--bar-fill, 82%))`,
                    background: countryColor(r.code),
                    transitionDuration: `${duration}ms`,
                  }}
                >
                  <span className="bar-value">
                    <AnimatedValue value={r[metric]} duration={duration} />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
        {!rows.length && (
          <p className="empty">
            No comparable observations in this selection. Try another year or
            cohort.
          </p>
        )}
      </div>
    </div>
  );
}
