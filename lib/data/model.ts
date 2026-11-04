export type Mode = "modern" | "historical" | "outlook";
export type Metric = "gdp" | "pc";
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
  growth: number | null;
  status: Status;
  pcStatus?: Status;
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
export function csv(rows: Observation[], source: string, unit: string) {
  return [
    [
      "iso3",
      "year",
      "gdp",
      "gdp_per_capita",
      "real_gdp_growth_percent",
      "gdp_status",
      "per_capita_status",
      "growth_status",
      "source",
      "unit",
    ],
    ...rows.map((r) => [
      r.code,
      r.year,
      r.gdp ?? "",
      r.pc ?? "",
      r.growth ?? "",
      r.status,
      r.pcStatus ?? r.status,
      r.growthStatus ?? r.status,
      source,
      unit,
    ]),
  ]
    .map((row) =>
      row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
    )
    .join("\r\n");
}
