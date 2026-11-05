"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

import TrendChart from "@/components/charts/LazyTrendChart";

import Link from "next/link";

import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Download,
  Share2,
  ArrowUpRight,
  SlidersHorizontal,
  Info,
  X,
  Check,
  Focus,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import HeroGlobe from "@/components/HeroGlobe";

import manifest from "@/data/processed/manifest.json";

import {
  compact,
  formatMetric,
  metricLabel,
  metricStatus,
  metricUnit,
  csv,
  ranked,
  type Mode,
  type Metric,
  type Dataset,
  type Country,
} from "@/lib/data/model";

import { events } from "@/lib/data/events";

import RaceChart from "@/components/charts/RaceChart";

import Leaderboard from "@/components/leaderboard/Leaderboard";

import Flag from "@/components/Flag";
import HighlightPicker from "@/components/HighlightPicker";

import { download, exportRace } from "@/lib/charts/export";

const countries = manifest.countries as Country[];
const countryMap = new Map(countries.map((c) => [c.code, c]));

const cache = new Map<Mode, Dataset>();

const modes: { id: Mode; label: string; range: string }[] = [
  { id: "modern", label: "Modern", range: "WORLD BANK" },
  { id: "historical", label: "Historical", range: "MADDISON" },
  { id: "outlook", label: "Outlook", range: "IMF WEO" },
];

export default function Observatory({
  view,
  initialCountry = "IDN",
}: {
  view: "observatory" | "history" | "compare" | "rankings" | "country";
  initialCountry?: string;
}) {
  const [mode, setMode] = useState<Mode>(
    view === "history" ? "historical" : "modern",
  );
  const [metric, setMetric] = useState<Metric>("gdp");
  const [year, setYear] = useState(manifest.cohortYear);
  const [cohort, setCohort] = useState("30");
  const [dynamicCohort, setDynamicCohort] = useState(false);
  const [selected, setSelected] = useState<string[]>([
    "USA",
    "CHN",
    "IND",
    "IDN",
  ]);
  const [compare, setCompare] = useState<string[]>([
    ...new Set(["USA", "CHN", initialCountry]),
  ]);
  const [highlight, setHighlight] = useState(initialCountry);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [loadedDataset, setDataset] = useState<Dataset | null>(null);
  const dataset = loadedDataset?.mode === mode ? loadedDataset : null;
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [event, setEvent] = useState<number | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [countrySearch, setCountrySearch] = useState("");
  const [reduced, setReduced] = useState(false);
  const [sources, setSources] = useState<Record<string, string[]>>({});
  const dialog = useRef<HTMLDialogElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- These effects synchronize browser URL/media state and abortable external data loading after hydration. */
  // URL and media preferences are browser-owned state, synchronized once after hydration.

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const m = q.get("mode");
    const activeMode = modes.some((x) => x.id === m)
      ? (m as Mode)
      : view === "history"
        ? "historical"
        : "modern";
    setMode(activeMode);
    const info = manifest.datasets[activeMode];
    const y = Number(q.get("year"));
    setYear(
      q.has("year") && Number.isFinite(y)
        ? Math.max(info.minYear, Math.min(info.maxYear, Math.round(y)))
        : activeMode === "historical"
          ? 1900
          : activeMode === "outlook"
            ? 2026
            : manifest.cohortYear,
    );
    if (q.get("metric") === "pc" || q.get("metric") === "pop")
      setMetric(q.get("metric") as Metric);
    const c = q.get("cohort");
    if (c && ["10", "20", "30", "100", "all", "selected"].includes(c))
      setCohort(c);
    setDynamicCohort(q.get("dynamic") === "1" || (q.get("metric") === "pop" && !q.has("dynamic")));
    const parse = (key: string) =>
      q
        .get(key)
        ?.split(",")
        .filter((c) => countryMap.has(c));
    const list = parse("countries");
    if (list) setSelected([...new Set(list)]);
    const comp = parse("compare");
    if (comp) setCompare([...new Set(comp)].slice(0, 5));
    const h = q.get("highlight");
    if (h && countryMap.has(h)) setHighlight(h);
    const s = Number(q.get("speed"));
    if ([0.5, 1, 2, 4].includes(s)) setSpeed(s);
    setReady(true);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [view]);

  // A source change invalidates the previous source before starting the abortable request.

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setError("");
    setDataset(null);
    const saved = cache.get(mode);
    if (saved) {
      setDataset(saved);
      return;
    }
    fetch(`/data/${mode}.json`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("Snapshot could not be loaded");
        return r.json();
      })
      .then((d: Dataset) => {
        if (!d.rows?.length || d.mode !== mode) throw Error("Invalid snapshot");
        cache.set(mode, d);
        setDataset(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "The saved data snapshot could not be loaded. Check your connection and retry.",
          );
      });
    return () => controller.abort();
  }, [mode, ready, retry]);

  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams({
      mode,
      metric,
      year: String(year),
      cohort,
      dynamic: dynamicCohort ? "1" : "0",
      countries: selected.join(","),
      compare: compare.join(","),
      highlight,
      speed: String(speed),
    });
    history.replaceState(null, "", `${location.pathname}?${q}`);
  }, [
    ready,
    mode,
    metric,
    year,
    cohort,
    dynamicCohort,
    selected,
    compare,
    highlight,
    speed,
  ]);

  useEffect(() => {
    if (!playing || !dataset) return;
    const timer = setInterval(
      () =>
        setYear((y) => {
          if (y >= dataset.maxYear) {
            setPlaying(false);
            return y;
          }
          return y + 1;
        }),
      1500 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, dataset, speed]);

  useEffect(() => {
    if (detail) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [detail]);

  useEffect(() => {
    if (mode === "historical")
      fetch("/data/historical-sources.json")
        .then((r) => r.json())
        .then(setSources)
        .catch(() => {});
  }, [mode]);

  const ranking = useMemo(
    () => (dataset ? ranked(dataset.rows, year, metric).filter((r) => metric !== "pop" || countryMap.get(r.code)?.national) : []),
    [dataset, year, metric],
  );

  const raceRows = useMemo(() => {
    let rows = ranking;
    if (cohort === "selected")
      return rows.filter((r) => selected.includes(r.code));
    if (cohort === "all") return rows;
    rows = dynamicCohort
      ? rows.filter((r) => countryMap.get(r.code)?.national)
      : rows.filter((r) =>
          (cohort === "100" ? manifest.cohort100 : manifest.cohort).includes(
            r.code,
          ),
        );
    return rows.slice(0, Number(cohort));
  }, [ranking, cohort, dynamicCohort, selected]);

  const compared = useMemo(
    () => compare.map((c) => countryMap.get(c)!).filter(Boolean),
    [compare],
  );

  const focusedCountry = countryMap.get(highlight) ?? countryMap.get("IDN")!;
  const focusedObservation = ranking.find(
    (r) => r.code === focusedCountry.code,
  );
  const focusedRank =
    ranking.findIndex((r) => r.code === focusedCountry.code) + 1;
  const info = manifest.datasets[mode];

  const switchMode = (m: Mode) => {
    setPlaying(false);
    setMode(m);
    const d = manifest.datasets[m];
    setYear((y) => Math.min(d.maxYear, Math.max(d.minYear, y)));
  };

  const selectYear = useCallback((y: number) => {
    setPlaying(false);
    setYear(y);
  }, []);

  function toggleCompare(code: string) {
    if (compare.includes(code)) setCompare(compare.filter((c) => c !== code));
    else if (compare.length < 5) setCompare([...compare, code]);
    else
      setNotice(
        "Choose up to five economies. Remove one before adding another.",
      );
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      setNotice("Chart link copied — your settings are included.");
    } catch {
      setNotice(`Copy this link from your address bar: ${location.href}`);
    }
  }

  const profileCountry = countryMap.get(initialCountry)!;
  const profileRows =
    dataset?.rows.filter((r) => r.code === initialCountry) ?? [];
  const profileLatest = profileRows.filter((r) => r.gdp !== null).at(-1);

  const dc = detail ? countryMap.get(detail) : null;
  const dr = detail
    ? dataset?.rows.find((r) => r.code === detail && r.year === year)
    : null;
  const dLatest =
    dataset && detail
      ? dataset.rows.filter((r) => r.code === detail && r[metric] !== null).at(-1)
      : null;

  const pageTitle =
    view === "history"
      ? "A century of shifting power."
      : view === "compare"
        ? "Different paths. One world."
        : view === "rankings"
          ? "The world, ranked."
          : view === "country"
            ? `${countryMap.get(initialCountry)?.name}. In perspective.`
            : "The world economy. In motion.";

  return (
    <main id="main" className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> THE GLOBAL ECONOMIC OBSERVATORY{" "}
            <span className="edition">/ VOL. 01</span>
          </div>
          <h1>
            {pageTitle.split(". ")[0].replace(/\.$/, "")}.<br />
            <span>{pageTitle.split(". ").slice(1).join(". ")}</span>
          </h1>
          <p>
            Explore 125+ years of global economic power.
            <br />
            Follow the rise, the shifts, and the stories behind the numbers.
          </p>
        </div>
        <div className="hero-aside">
          <HeroGlobe />
          <div className="hero-index">
            <span>1900 — TODAY</span>
            <p>
              A longer view.
              <br />A clearer perspective.
            </p>
            <a href="#explorer">EXPLORE THE DATA ↓</a>
            <small className="globe-hint">
              DRAG TO ROTATE · <a href="https://svs.gsfc.nasa.gov/2915" target="_blank" rel="noreferrer">NASA BLUE MARBLE ↗</a>
            </small>
          </div>
        </div>
      </section>

      <div className="source-ribbon">
        <span>
          <i /> BUILT ON PUBLIC DATA
        </span>
        <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD">
          WORLD BANK
        </a>
        <a href="https://doi.org/10.34894/INZBF2">MADDISON PROJECT</a>
        <a href="https://data.imf.org/datasets/WEO">IMF</a>
        <Link href="/methodology">
          Understand the numbers <ArrowUpRight size={13} />
        </Link>
      </div>

      {view === "country" && dataset && (
        <section className="country-overview">
          <div className="section-heading">
            <div>
              <p className="eyebrow">COUNTRY PROFILE / {profileCountry.code}</p>
              <h2>
                <Flag country={profileCountry} /> {profileCountry.name}
              </h2>
              <p className="muted">
                {profileCountry.region} · {dataset.source}
              </p>
            </div>
            <button onClick={() => setDetail(initialCountry)}>
              Full country details <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="detail-stats">
            <div>
              <small>Latest GDP · {profileLatest?.year ?? "—"}</small>
              <strong>{compact(profileLatest?.gdp)}</strong>
              <span>{profileLatest?.status ?? "Unavailable"}</span>
            </div>
            <div>
              <small>
                Latest GDP per capita · {profileLatest?.year ?? "—"}
              </small>
              <strong>{compact(profileLatest?.pc)}</strong>
              <span>{dataset.unit}</span>
            </div>
          </div>
          <TrendChart
            dataset={dataset}
            countries={[profileCountry]}
            metric={metric}
          />
        </section>
      )}

      <section id="explorer" className="explorer section-anchor">
        <div className="explorer-top">
          <div className="mode-tabs" role="group" aria-label="GDP methodology">
            {modes.map((m) => (
              <button
                key={m.id}
                aria-pressed={mode === m.id}
                onClick={() => switchMode(m.id)}
                className={mode === m.id ? "active" : ""}
              >
                {m.label}
                <small>{m.range}</small>
              </button>
            ))}
          </div>
          <div className="export-tools">
            <button
              aria-label="Download chart as PNG"
              title="Download chart as PNG"
              onClick={async () => {
                if (dataset)
                  try {
                    await exportRace(
                      raceRows,
                      countries,
                      dataset,
                      metric,
                      year,
                    );
                    setNotice("PNG downloaded.");
                  } catch {
                    setNotice("Image export failed. Please try again.");
                  }
              }}
            >
              <Download size={15} />
              <span>PNG</span>
            </button>
            <button
              onClick={() => {
                if (dataset) {
                  download(
                    new Blob(
                      [
                        csv(
                          dataset.rows.filter((r) =>
                            raceRows.some((c) => c.code === r.code),
                          ),
                          dataset.source,
                          dataset.unit,
                        ),
                      ],
                      { type: "text/csv;charset=utf-8" },
                    ),
                    `gdp-${mode}.csv`,
                  );
                  setNotice(
                    "CSV downloaded with all available years for the displayed economies.",
                  );
                }
              }}
            >
              CSV
            </button>
            <button onClick={share}>
              <Share2 size={15} />
              <span>Share</span>
            </button>
          </div>
        </div>

        <div className="chart-heading">
          <div>
            <p className="eyebrow">
              {mode === "historical"
                ? "THE LONG VIEW"
                : mode === "outlook"
                  ? "LOOKING AHEAD"
                  : "THE GLOBAL PICTURE"}
            </p>
            <h2>
              {metric === "gdp"
                ? "The engines of the world economy"
                : metric === "pc"
                  ? "Prosperity, per person"
                  : "The world's population, ranked"}
            </h2>
            <p>
              {metricUnit(metric, info.unit)} <span>·</span>{" "}
              {mode === "historical"
                ? "Historical estimates"
                : mode === "outlook"
                  ? "Actuals, estimates & projections"
                  : "Reported annual data"}{" "}
              <span>·</span> {year}
            </p>
          </div>
          <div className="metric-toggle" role="group" aria-label="Metric">
            <button
              aria-pressed={metric === "gdp"}
              className={metric === "gdp" ? "active" : ""}
              onClick={() => setMetric("gdp")}
            >
              Total GDP
            </button>
            <button
              aria-pressed={metric === "pc"}
              className={metric === "pc" ? "active" : ""}
              onClick={() => setMetric("pc")}
            >
              Per capita
            </button>
            <button
              aria-pressed={metric === "pop"}
              className={metric === "pop" ? "active" : ""}
              onClick={() => {
                setMetric("pop");
                setDynamicCohort(true);
              }}
            >
              Population
            </button>
          </div>
        </div>

        <div className="chart-toolbar">
          <label>
            <SlidersHorizontal size={14} /> Show{" "}
            <select
              aria-label="Chart cohort"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="30">Top 30</option>
              <option value="100">Top 100</option>
              <option value="all">All available</option>
              <option value="selected">My selected countries</option>
            </select>
          </label>
          {!["all", "selected"].includes(cohort) && (
            <select
              aria-label="Cohort basis"
              value={dynamicCohort ? "dynamic" : "fixed"}
              onChange={(e) => setDynamicCohort(e.target.value === "dynamic")}
            >
              <option value="fixed">
                GDP Top {cohort === "100" ? "100" : "30"}, tracked
                historically
              </option>
              <option value="dynamic">
                Dynamic national ranking each year
              </option>
            </select>
          )}
          <HighlightPicker
            countries={countries}
            country={focusedCountry}
            onSelect={(code) => {
              setHighlight(code);
              if (cohort === "selected" && !selected.includes(code))
                setSelected([...selected, code]);
            }}
          />
          <label className="event-toggle">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
            />{" "}
            Historical events
          </label>
        </div>

        {cohort === "selected" && (
          <details className="country-picker" open>
            <summary>Select economies ({selected.length})</summary>
            <input
              aria-label="Search race countries"
              placeholder="Search countries…"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
            />
            <div>
              {countries
                .filter((c) =>
                  c.name.toLowerCase().includes(countrySearch.toLowerCase()),
                )
                .map((c) => (
                  <label key={c.code}>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.code)}
                      onChange={() =>
                        setSelected(
                          selected.includes(c.code)
                            ? selected.filter((x) => x !== c.code)
                            : [...selected, c.code],
                        )
                      }
                    />
                    <Flag country={c} />
                    {c.name}
                  </label>
                ))}
            </div>
          </details>
        )}

        {error ? (
          <div className="empty">
            <p>{error}</p>
            <button onClick={() => setRetry((v) => v + 1)}>
              Retry data load
            </button>
          </div>
        ) : !dataset ? (
          <div className="loading">Loading verified {mode} snapshot…</div>
        ) : (
          <div className="chart-layout">
            <div className="race-column">
              <RaceChart
                rows={raceRows}
                countries={countries}
                metric={metric}
                year={year}
                highlight={highlight}
                onCountry={(code) => {
                  setPlaying(false);
                  setDetail(code);
                }}
                duration={reduced ? 0 : Math.min(750, 1200 / speed)}
                unit={metricUnit(metric, info.unit)}
                source={info.source}
              />
              <p className="chart-hint">
                {raceRows.length} economies shown · Scroll the chart to explore
                all bars · Select an economy for details
              </p>
            </div>
            <aside className="chart-aside">
              <p className="eyebrow">IN FOCUS</p>
              <Flag country={focusedCountry} />
              <h3>{focusedCountry.name}</h3>
              <p className="focus-value">
                {formatMetric(focusedObservation?.[metric], metric)}
              </p>
              <p className="muted">
                {metric === "gdp"
                  ? "Total economic output"
                  : metric === "pc"
                    ? "Output per person"
                    : "People"}{" "}
                · {year}
              </p>
              <div className="focus-rank">
                <strong>{focusedRank ? `#${focusedRank}` : "—"}</strong>
                <span>
                  among available
                  <br />
                  economies
                </span>
              </div>
              <button
                onClick={() => {
                  setPlaying(false);
                  setDetail(focusedCountry.code);
                }}
              >
                Explore {focusedCountry.name} <ArrowUpRight size={15} />
              </button>
              <div className="aside-note">
                <Info size={15} />
                <p>
                  {metric === "pop"
                    ? "Population uses source-reported counts. Historical estimates and IMF projections have different certainty; country boundaries can change."
                    : mode === "modern"
                    ? "Nominal GDP reflects both economic output and exchange rates. It is not adjusted for inflation."
                    : mode === "historical"
                      ? "Historical estimates use purchasing power parity. Modern flags identify series, not historical sovereignty."
                      : "Forecasts are not outcomes. Each indicator has its own last actual year, supplied by the IMF."}
                </p>
              </div>
              <div className="aside-range">
                <span>{info.minYear}</span>
                <i />
                <span>{info.maxYear}</span>
              </div>
            </aside>
          </div>
        )}

        <div className="playback">
          <div className="transport">
            <button
              aria-label="Restart timeline"
              onClick={() => {
                setYear(info.minYear);
                setPlaying(false);
              }}
            >
              <RotateCcw size={17} />
            </button>
            <button
              aria-label="Previous year"
              disabled={year <= info.minYear}
              onClick={() => selectYear(year - 1)}
            >
              <SkipBack size={16} />
            </button>
            <button
              className="play-button"
              disabled={!dataset}
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => {
                if (year === info.maxYear) setYear(info.minYear);
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              <span>{playing ? "Pause" : "Play"}</span>
            </button>
            <button
              aria-label="Next year"
              disabled={year >= info.maxYear}
              onClick={() => selectYear(year + 1)}
            >
              <SkipForward size={16} />
            </button>
          </div>
          <div className="slider-wrap">
            <input
              aria-label="Timeline year"
              type="range"
              min={info.minYear}
              max={info.maxYear}
              value={year}
              onChange={(e) => selectYear(+e.target.value)}
            />
            <div className="timeline-labels">
              <span>{info.minYear}</span>
              <span>{Math.round((info.minYear + info.maxYear) / 2)}</span>
              <span>{info.maxYear}</span>
            </div>
          </div>
          <label className="year-input">
            <span className="sr-only">Selected year</span>
            <input
              aria-label="Selected year"
              type="number"
              min={info.minYear}
              max={info.maxYear}
              value={year}
              onChange={(e) => {
                const y = Number(e.target.value);
                if (y >= info.minYear && y <= info.maxYear) selectYear(y);
              }}
            />
          </label>
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
          >
            {[0.5, 1, 2, 4].map((s) => (
              <option key={s} value={s}>
                {s}× speed
              </option>
            ))}
          </select>
        </div>

        {showEvents && (
          <div className="event-strip">
            <span>TURNING POINTS</span>
            {events
              .filter((e) => e.year >= info.minYear && e.year <= info.maxYear)
              .map((e) => (
                <button
                  className={year === e.year ? "active" : ""}
                  key={e.year}
                  onClick={() => {
                    setEvent(e.year);
                    selectYear(e.year);
                  }}
                >
                  <i />
                  {e.year} <span>{e.title}</span>
                </button>
              ))}
          </div>
        )}
        {event && showEvents && (
          <div className="event-explainer">
            <div>
              <strong>
                {events.find((e) => e.year === event)?.title} · {event}
              </strong>
              <p>
                {events.find((e) => e.year === event)?.text} These annotations
                provide context, not a causal explanation for every movement.
              </p>
              <a
                href={events.find((e) => e.year === event)?.url}
                target="_blank"
                rel="noreferrer"
              >
                Read the source ↗
              </a>
            </div>
            <button
              aria-label="Close event explanation"
              onClick={() => setEvent(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="chart-footnote">
          <span>
            <i /> {info.source} · Snapshot {info.retrievedAt.slice(0, 10)}
          </span>
          <Link href="/methodology">Units, coverage & limitations ↗</Link>
        </div>
        <p className="coverage-note">
          {cohort === "all"
            ? metric === "pop"
              ? "All available national economies with population observations."
              : "All available economies, including separately reported territories."
            : dynamicCohort
              ? "Ranks reflect national economies with observations in the selected year."
              : `Fixed cohort based on ${manifest.cohortYear} World Bank nominal GDP. Missing observations are omitted, never filled.`}{" "}
          {mode === "historical" && metric !== "pop"
            ? "Historical series follow source boundary conventions; former aggregate states are excluded. Dollar symbols here denote international dollars."
            : ""}
        </p>
      </section>

      {dataset && (
        <>
          {view === "rankings" && (
            <Leaderboard
              dataset={dataset}
              countries={countries}
              year={year}
              metric={metric}
              onCountry={(code) => {
                setPlaying(false);
                setDetail(code);
              }}
              onYear={selectYear}
              highlight={highlight}
            />
          )}

          <section className="comparison section-anchor" id="comparison">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PUT GROWTH IN PERSPECTIVE</p>
                <h2>Every economy has a story.</h2>
                <p className="muted">
                  Compare up to five economies. Drag the chart to zoom into a
                  chapter.
                </p>
              </div>
              <button onClick={() => setResetKey((k) => k + 1)}>
                <RotateCcw size={14} /> Reset chart
              </button>
            </div>
            <div className="comparison-controls">
              <div className="country-chips">
                {compared.map((c) => (
                  <button key={c.code} onClick={() => toggleCompare(c.code)}>
                    <Flag country={c} />
                    {c.name}
                    <X size={13} />
                  </button>
                ))}
              </div>
              <label className="add-country">
                <span className="sr-only">Add comparison country</span>
                <select
                  aria-label="Add comparison country"
                  value=""
                  onChange={(e) => toggleCompare(e.target.value)}
                >
                  <option value="">+ Add economy</option>
                  {countries
                    .filter((c) => !compare.includes(c.code))
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <button
                onClick={() => {
                  if (!compare.includes("IDN")) {
                    if (compare.length >= 5)
                      setCompare([...compare.slice(0, 4), "IDN"]);
                    else setCompare([...compare, "IDN"]);
                  }
                  setHighlight("IDN");
                }}
              >
                <Focus size={14} /> Indonesia
              </button>
            </div>
            {compared.length ? (
              <TrendChart
                dataset={dataset}
                countries={compared}
                metric={metric}
                resetKey={resetKey}
              />
            ) : (
              <p className="empty">Add an economy to begin your comparison.</p>
            )}
            <div className="comparison-endpoints">
              {compared.map((c) => {
                const rows = dataset.rows.filter(
                  (r) => r.code === c.code && r[metric] !== null,
                );
                const first = rows[0],
                  last = rows.at(-1);
                return (
                  <div key={c.code}>
                    <span>
                      <Flag country={c} />
                      {c.name}
                    </span>
                    <strong>
                      {formatMetric(first?.[metric], metric)}
                      <ChevronRight size={13} />
                      {formatMetric(last?.[metric], metric)}
                    </strong>
                    <small>
                      {first?.year ?? "No coverage"} — {last?.year ?? "—"} ·{" "}
                      {last ? metricStatus(last, metric) : "unavailable"}
                    </small>
                  </div>
                );
              })}
            </div>
            <p className="source-note">
              {dataset.source} · {metricUnit(metric, dataset.unit)}. Gaps are left unconnected.
              Endpoints use each country’s first and last available observation;
              dates can differ. Toggle series in the chart legend.
            </p>
          </section>

          {view !== "rankings" && (
            <Leaderboard
              dataset={dataset}
              countries={countries}
              year={year}
              metric={metric}
              onCountry={(code) => {
                setPlaying(false);
                setDetail(code);
              }}
              onYear={selectYear}
              highlight={highlight}
            />
          )}
        </>
      )}

      <section className="editorial">
        <div>
          <p className="eyebrow">BEYOND THE RANKINGS</p>
          <h2>
            Numbers tell a story.
            <br />
            <span className="muted">Context gives it meaning.</span>
          </h2>
        </div>
        <div>
          <p>
            A larger economy isn’t always a richer population. Exchange rates
            can move rankings. And historical estimates carry uncertainty.
          </p>
          <Link href="/methodology">
            How to read the world economy <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <dialog
        ref={dialog}
        className="country-dialog"
        onCancel={() => setDetail(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setDetail(null);
        }}
      >
        {dc && dataset && (
          <div className="detail-content">
            <div className="detail-top">
              <p className="eyebrow">COUNTRY PROFILE / {dc.code}</p>
              <button
                aria-label="Close country details"
                onClick={() => setDetail(null)}
              >
                <X size={20} />
              </button>
            </div>
            <Flag country={dc} />
            <h2>{dc.name}</h2>
            <p className="muted">
              {dc.region} · {year} · {dataset.unit}
            </p>
            <div className="detail-stats">
              <div>
                <small>GDP / {year}</small>
                <strong>{compact(dr?.gdp)}</strong>
                <span>{dr?.gdp == null ? "Unavailable" : dr.status}</span>
              </div>
              <div>
                <small>GDP per capita / {year}</small>
                <strong>{compact(dr?.pc)}</strong>
                <span>{dr?.pc == null ? "Unavailable" : (dr.pcStatus ?? dr.status)}</span>
              </div>
              <div>
                <small>
                  Ranking / {metricLabel(metric)}
                </small>
                <strong>
                  {ranking.some((r) => r.code === dc.code)
                    ? `#${ranking.findIndex((r) => r.code === dc.code) + 1}`
                    : "—"}
                </strong>
                <span>Available economies</span>
              </div>
              <div>
                <small>Population / {year}</small>
                <strong>{formatMetric(dr?.pop, "pop")}</strong>
                <span>{dr?.pop == null ? "Unavailable" : metricStatus(dr, "pop")}</span>
              </div>
              <div>
                <small>Real GDP growth</small>
                <strong>
                  {dr?.growth == null ? "—" : `${dr.growth.toFixed(2)}%`}
                </strong>
                <span>
                  {dr?.growth == null
                    ? "Unavailable"
                    : (dr.growthStatus ?? dr.status)}
                </span>
              </div>
            </div>
            <p className="source-note">
              Latest available {metricLabel(metric)} in this dataset: {dLatest?.year ?? "—"} · GDP{" "}
              {compact(dLatest?.gdp)} · Per capita {compact(dLatest?.pc)} · Population {formatMetric(dLatest?.pop, "pop")} ·{" "}
              {dLatest?.status ?? "unavailable"}.
            </p>
            <div className="detail-actions">
              <button
                onClick={() => {
                  toggleCompare(dc.code);
                  setDetail(null);
                  document.getElementById("comparison")?.scrollIntoView({
                    behavior: reduced ? "instant" : "smooth",
                  });
                }}
              >
                <TrendingUp size={15} />
                {compare.includes(dc.code)
                  ? "Remove comparison"
                  : "Compare country"}
              </button>
              <button
                onClick={() => {
                  setHighlight(dc.code);
                  setCohort("selected");
                  setSelected([...new Set([...selected, dc.code])]);
                  setDetail(null);
                }}
              >
                <Focus size={15} />
                Highlight in chart
              </button>
              <Link
                href={`/country/${dc.code.toLowerCase()}?mode=historical&compare=${dc.code}&highlight=${dc.code}`}
              >
                View historical trend ↗
              </Link>
            </div>
            <h3>Total GDP over time</h3>
            <TrendChart dataset={dataset} countries={[dc]} metric="gdp" />
            <h3>GDP per capita over time</h3>
            <TrendChart dataset={dataset} countries={[dc]} metric="pc" />
            <h3>Population over time</h3>
            <TrendChart dataset={dataset} countries={[dc]} metric="pop" />
            <p className="source-note">
              {dataset.source} · {dataset.version}. Status is assigned per
              indicator; forecasts remain separate from World Bank and
              historical data.
            </p>
            {mode === "historical" && (
              <details>
                <summary>
                  Original historical sources ({sources[dc.code]?.length ?? 0})
                </summary>
                <p>
                  Bolt & van Zanden (2024), MPD 2023. General update: Total
                  Economy Database / UN national accounts, 2008–2022.
                </p>
                {sources[dc.code]?.map((s, i) => (
                  <p key={i} className="source-note">
                    {s}
                  </p>
                ))}
                <a href="https://doi.org/10.34894/INZBF2">
                  Full source workbook and original bibliography ↗
                </a>
              </details>
            )}
          </div>
        )}
      </dialog>
    </main>
  );
}
