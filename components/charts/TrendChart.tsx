"use client";

import { useEffect, useRef } from "react";

import {
  use as registerECharts,
  init,
  type EChartsCoreOption,
  type EChartsType,
} from "echarts/core";

import { LineChart } from "echarts/charts";

import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
} from "echarts/components";

import { CanvasRenderer } from "echarts/renderers";

import {
  compact,
  ranked,
  type Country,
  type Dataset,
  type Metric,
} from "@/lib/data/model";

registerECharts([
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  CanvasRenderer,
]);

const colors = ["#4bc9f1", "#f6bd6b", "#b6a1ff", "#f4828f", "#6ed5b2"];

export default function TrendChart({
  dataset,
  countries,
  metric,
  resetKey = 0,
}: {
  dataset: Dataset;
  countries: Country[];
  metric: Metric;
  resetKey?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const c = init(el.current);
    chart.current = c;
    const o = new ResizeObserver(() => c.resize());
    o.observe(el.current);
    return () => {
      o.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chart.current) return;
    const years = Array.from(
      { length: dataset.maxYear - dataset.minYear + 1 },
      (_, i) => dataset.minYear + i,
    );
    const index = new Map(dataset.rows.map((r) => [`${r.code}-${r.year}`, r]));

    const option: EChartsCoreOption = {
      backgroundColor: "transparent",
      color: colors,
      animationDuration: 350,
      animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      grid: {
        left: 10,
        right: 20,
        top: 40,
        bottom: 70,
        outerBoundsMode: "same",
        outerBoundsContain: "axisLabel",
      },
      legend: { show: true, textStyle: { color: "#aeb8c8" }, top: 0 },
      tooltip: {
        trigger: "axis",
        confine: true,
        backgroundColor: "#111c2b",
        borderColor: "#344258",
        textStyle: { color: "#eef5ff" },
        formatter: (params: unknown) => {
          const list = params as {
            axisValue: string;
            seriesName: string;
            seriesIndex: number;
          }[];
          if (!list.length) return "";
          const year = Number(list[0].axisValue);
          const ranks = ranked(dataset.rows, year, metric);
          return (
            `<b>${year} · ${dataset.unit}</b><br/>` +
            list
              .map((p) => {
                const country = countries[p.seriesIndex];
                const r = index.get(`${country.code}-${year}`);
                const name = country.name
                  .replaceAll("&", "&amp;")
                  .replaceAll("<", "&lt;")
                  .replaceAll(">", "&gt;")
                  .replaceAll('"', "&quot;");
                const flag = `<img src="/flags/${country.iso2.toLowerCase() === "jg" ? "xx" : country.iso2.toLowerCase()}.svg" alt="" width="22" height="16" style="vertical-align:middle;margin-right:8px;border-radius:2px"/>`;
                if (!r) return `${flag}${name}: unavailable`;
                const rank =
                  ranks.findIndex((x) => x.code === country.code) + 1;
                return `${flag}${name} · #${rank || "—"}<br/>GDP: ${compact(r.gdp)} · Per capita: ${compact(r.pc)}<br/>${metric === "pc" ? (r.pcStatus ?? r.status) : r.status}`;
              })
              .join("<br/><br/>") +
            `<br/><small>${dataset.source}</small>`
          );
        },
      },
      xAxis: {
        type: "category",
        data: years,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "#2c3644" } },
        axisLabel: { color: "#8491a4" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#202b3a", type: "dashed" } },
        axisLabel: { color: "#8491a4", formatter: (v: number) => compact(v) },
      },
      dataZoom: [
        { type: "inside", start: 0, end: 100 },
        {
          type: "slider",
          bottom: 10,
          height: 22,
          borderColor: "#263245",
          textStyle: { color: "#8795a8" },
          fillerColor: "#42c9ee22",
          handleStyle: { color: "#56c8e8" },
          dataBackground: {
            lineStyle: { color: "#456075" },
            areaStyle: { color: "#182f46" },
          },
        },
      ],
      series: countries.map((c) => ({
        name: c.name,
        type: "line",
        showSymbol: false,
        connectNulls: false,
        lineStyle: { width: c.code === "IDN" ? 3 : 2 },
        emphasis: { focus: "series" },
        data: years.map((y) => index.get(`${c.code}-${y}`)?.[metric] ?? null),
      })),
    };
    chart.current.setOption(option, true);
  }, [dataset, countries, metric, resetKey]);

  return (
    <div
      ref={el}
      className="trend-chart"
      role="img"
      aria-label={`${metric === "gdp" ? "GDP" : "GDP per capita"} comparison for ${countries.map((c) => c.name).join(", ")}. Use the data table and CSV for accessible values.`}
    />
  );
}
