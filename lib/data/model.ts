export type Mode = "modern" | "historical" | "outlook";
export type Metric = "gdp" | "pc" | "pop";
export type Status =
  "actual" | "historical estimate" | "estimate" | "projection";
export type Country = {
  code: string;
  iso2: string;
  name: string;
  region: string;
  national: boolean;
};
export type Observation = {
  code: string;
  year: number;
  gdp: number | null;
  pc: number | null;
  pop: number | null;
  growth: number | null;
  status: Status;
  pcStatus?: Status;
  popStatus?: Status;
  growthStatus?: Status;
};
export type Dataset = {
  mode: Mode;
  source: string;
  version: string;
  unit: string;
  retrievedAt: string;
  sourceUrl: string;
  license: string;
  minYear: number;
  maxYear: number;
  rows: Observation[];
};
export function ranked(rows: Observation[], year: number, metric: Metric) {
  return rows
    .filter(
      (r) =>
        r.year === year && r[metric] !== null && Number.isFinite(r[metric]),
    )
    .sort((a, b) => b[metric]! - a[metric]! || a.code.localeCompare(b.code));
}
export function compact(value: number | null | undefined, prefix = "$") {
  if (value == null) return "—";
  const abs = Math.abs(value);
  for (const [n, s] of [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ] as const)
    if (abs >= n)
      return `${prefix}${(value / n).toLocaleString("en-US", { maximumFractionDigits: 2 })}${s}`;
  return `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
export const metricLabel = (metric: Metric) =>
  metric === "gdp" ? "Total GDP" : metric === "pc" ? "GDP per capita" : "Population";
export const metricUnit = (metric: Metric, dollarUnit: string) =>
  metric === "pop" ? "people" : dollarUnit;
export const metricStatus = (r: Observation, metric: Metric) =>
  metric === "pc" ? (r.pcStatus ?? r.status) : metric === "pop" ? (r.popStatus ?? r.status) : r.status;
export const formatMetric = (value: number | null | undefined, metric: Metric) =>
  compact(value, metric === "pop" ? "" : "$");
export function csv(rows: Observation[], source: string, unit: string) {
  return [
    [
      "iso3",
      "year",
      "gdp",
      "gdp_per_capita",
      "population_people",
      "real_gdp_growth_percent",
      "gdp_status",
      "per_capita_status",
      "population_status",
      "growth_status",
      "source",
      "unit",
    ],
    ...rows.map((r) => [
      r.code,
      r.year,
      r.gdp ?? "",
      r.pc ?? "",
      r.pop ?? "",
      r.growth ?? "",
      r.gdp == null ? "" : r.status,
      r.pc == null ? "" : (r.pcStatus ?? r.status),
      r.pop == null ? "" : (r.popStatus ?? r.status),
      r.growth == null ? "" : (r.growthStatus ?? r.status),
      source,
      unit,
    ]),
  ]
    .map((row) =>
      row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
    )
    .join("\r\n");
}
