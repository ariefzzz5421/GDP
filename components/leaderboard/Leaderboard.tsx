"use client";
import { useState } from "react";
import Flag from "@/components/Flag";
import {
  compact,
  formatMetric,
  metricLabel,
  metricUnit,
  ranked,
  type Country,
  type Dataset,
  type Metric,
  type Observation,
} from "@/lib/data/model";
import { ArrowDownUp, Search, ArrowUpRight } from "lucide-react";
export default function Leaderboard({
  dataset,
  countries,
  year,
  metric,
  onCountry,
  onYear,
  highlight,
}: {
  dataset: Dataset;
  countries: Country[];
  year: number;
  metric: Metric;
  onCountry: (code: string) => void;
  onYear: (year: number) => void;
  highlight: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"rank" | "name" | "gdp" | "pc" | "pop" | "growth">(
    "rank",
  );
  const [asc, setAsc] = useState(true);
  const [limit, setLimit] = useState(20);
  const names = new Map(countries.map((c) => [c.code, c]));
  const eligible = (r: Observation) => metric !== "pop" || names.get(r.code)?.national;
  const ranking = ranked(dataset.rows, year, metric).filter(eligible);
  const previous = ranked(dataset.rows, year - 1, metric).filter(eligible);
  const rows = ranking
    .map((r, i) => ({ ...r, rank: i + 1, country: names.get(r.code)! }))
    .filter(
      (r) =>
        r.country?.name.toLowerCase().includes(query.toLowerCase()) ||
        r.code.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const av =
        sort === "name" ? a.country.name : sort === "rank" ? a.rank : a[sort];
      const bv =
        sort === "name" ? b.country.name : sort === "rank" ? b.rank : b[sort];
      if (av === null) return 1;
      if (bv === null) return -1;
      return (
        (typeof av === "string"
          ? av.localeCompare(String(bv))
          : Number(av) - Number(bv)) * (asc ? 1 : -1)
      );
    });
  function order(key: typeof sort) {
    setSort(key);
    setAsc(sort === key ? !asc : key === "rank" || key === "name");
  }
  const full = (r: Observation, k: Metric) =>
    r[k] === null
      ? "Unavailable"
      : `${r[k]!.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${metricUnit(k, dataset.unit)}`;
  return (
    <section className="leaderboard section-anchor" id="rankings">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE ECONOMIC ORDER</p>
          <h2>
            Global rankings<span className="muted"> / {year}</span>
          </h2>
        </div>
        <button
          onClick={() => {
            const y =
              dataset.mode === "modern"
                ? Math.max(
                    ...dataset.rows
                      .filter((r) => r[metric] !== null)
                      .map((r) => r.year),
                  )
                : dataset.maxYear;
            onYear(y);
          }}
        >
          Latest available <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="table-toolbar">
        <label className="search">
          <Search size={16} />
          <input
            aria-label="Search leaderboard"
            placeholder="Find an economy…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(20);
            }}
          />
        </label>
        <p>
          {ranking.length} economies with{" "}
          {metricLabel(metric)} data · Same-year
          {metric === "pop" ? " national observations" : " observations"}
        </p>
        <label>
          Year{" "}
          <select
            aria-label="Leaderboard year"
            value={year}
            onChange={(e) => onYear(+e.target.value)}
          >
            {Array.from(
              { length: dataset.maxYear - dataset.minYear + 1 },
              (_, i) => dataset.maxYear - i,
            ).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {(
                [
                  ["rank", "Rank"],
                  ["name", "Economy"],
                  ["gdp", "Total GDP"],
                  ["pc", "GDP per capita"],
                  ["pop", "Population"],
                  ["growth", "Real GDP growth"],
                ] as const
              ).map(([key, label]) => (
                <th
                  key={key}
                  aria-sort={
                    sort === key ? (asc ? "ascending" : "descending") : "none"
                  }
                >
                  <button onClick={() => order(key)}>
                    {label}
                    <ArrowDownUp size={12} />
                  </button>
                </th>
              ))}
              <th>Rank Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((r) => {
              const prev = previous.findIndex((p) => p.code === r.code);
              const delta = prev < 0 ? null : prev + 1 - r.rank;
              return (
                <tr
                  key={r.code}
                  className={r.code === highlight ? "highlight-row" : ""}
                >
                  <td className="rank-cell">
                    {String(r.rank).padStart(2, "0")}
                  </td>
                  <td>
                    <button
                      className="country-cell"
                      onClick={() => onCountry(r.code)}
                    >
                      <Flag country={r.country} />
                      <span>{r.country.name}</span>
                      <small>{r.code}</small>
                    </button>
                  </td>
                  <td title={full(r, "gdp")}>{compact(r.gdp)}</td>
                  <td title={full(r, "pc")}>{compact(r.pc)}</td>
                  <td title={full(r, "pop")}>{formatMetric(r.pop, "pop")}</td>
                  <td className={(r.growth ?? 0) > 0 ? "positive" : ""}>
                    {r.growth === null
                      ? "—"
                      : `${r.growth > 0 ? "+" : ""}${r.growth.toFixed(2)}%`}
                  </td>
                  <td
                    className="muted"
                    title="Change from previous year within this dataset's available economies; coverage may change"
                  >
                    {delta === null
                      ? "—"
                      : delta === 0
                        ? "—"
                        : delta > 0
                          ? `↑ ${delta}`
                          : `↓ ${Math.abs(delta)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="empty">No matching economies with data in {year}.</p>
      )}
      {rows.length > limit && (
        <button className="more-button" onClick={() => setLimit((v) => v + 30)}>
          Show 30 more economies ↓
        </button>
      )}
      <p className="source-note">
        {dataset.source} · {dataset.version} · {metricUnit(metric, dataset.unit)}. Growth is real
        annual GDP growth where reported. Rank changes reflect available
        coverage, not a fixed universe. Population rankings include national economies only.{" "}
        {dataset.mode === "outlook"
          ? "IMF actuals, estimates and forecasts; inspect country detail for status."
          : ""}
      </p>
    </section>
  );
}
