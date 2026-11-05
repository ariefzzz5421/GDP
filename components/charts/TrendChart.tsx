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
  formatMetric,
  metricStatus,
  metricUnit,
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
const lightColors = ["#087eaa", "#a35c08", "#7751a8", "#ae4064", "#087d63"];

function chartTheme() {
  const light = document.documentElement.dataset.theme === "light";
  return {
    colors: light ? lightColors : colors,
    text: light ? "#465e70" : "#aeb8c8",
    axis: light ? "#5d7182" : "#8491a4",
    border: light ? "#bbccd8" : "#2c3644",
    grid: light ? "#d9e4eb" : "#202b3a",
    tooltip: light ? "#ffffff" : "#111c2b",
    tooltipText: light ? "#1a3043" : "#eef5ff",
    slider: light ? "#e2eef3" : "#182f46",
    filler: light ? "#087eaa25" : "#42c9ee22",
  };
}

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
    const visual = chartTheme();

    const option: EChartsCoreOption = {
      backgroundColor: "transparent",
      color: visual.colors,
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
      legend: { show: true, textStyle: { color: visual.text }, top: 0 },
      tooltip: {
        trigger: "axis",
        confine: true,
        backgroundColor: visual.tooltip,
        borderColor: visual.border,
        textStyle: { color: visual.tooltipText },
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
            `<b>${year} · ${metricUnit(metric, dataset.unit)}</b><br/>` +
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
                return `${flag}${name} · #${rank || "—"}<br/>GDP: ${compact(r.gdp)} · Per capita: ${compact(r.pc)}<br/>Population: ${formatMetric(r.pop, "pop")} people<br/>${metricStatus(r, metric)}`;
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
        axisLine: { lineStyle: { color: visual.border } },
        axisLabel: { color: visual.axis },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: visual.grid, type: "dashed" } },
        axisLabel: { color: visual.axis, formatter: (v: number) => formatMetric(v, metric) },
      },
      dataZoom: [
        { type: "inside", start: 0, end: 100 },
        {
          type: "slider",
          bottom: 10,
          height: 22,
          borderColor: visual.border,
          textStyle: { color: visual.axis },
          fillerColor: visual.filler,
          handleStyle: { color: visual.colors[0] },
          dataBackground: {
            lineStyle: { color: visual.axis },
            areaStyle: { color: visual.slider },
          },
        },
      ],
      series: countries.map((c, i) => ({
        name: c.name,
        type: "line",
        showSymbol: false,
        connectNulls: false,
        lineStyle: { width: c.code === "IDN" ? 3 : 2, color: visual.colors[i % visual.colors.length] },
        itemStyle: { color: visual.colors[i % visual.colors.length] },
        emphasis: { focus: "series" },
        data: years.map((y) => index.get(`${c.code}-${y}`)?.[metric] ?? null),
      })),
    };
    chart.current.setOption(option, true);
  }, [dataset, countries, metric, resetKey]);

  useEffect(() => {
    const updateTheme = () => {
      const visual = chartTheme();
      chart.current?.setOption({
        color: visual.colors,
        legend: { textStyle: { color: visual.text } },
        tooltip: { backgroundColor: visual.tooltip, borderColor: visual.border, textStyle: { color: visual.tooltipText } },
        xAxis: { axisLine: { lineStyle: { color: visual.border } }, axisLabel: { color: visual.axis } },
        yAxis: { splitLine: { lineStyle: { color: visual.grid } }, axisLabel: { color: visual.axis } },
        dataZoom: [{}, { borderColor: visual.border, textStyle: { color: visual.axis }, fillerColor: visual.filler, handleStyle: { color: visual.colors[0] }, dataBackground: { lineStyle: { color: visual.axis }, areaStyle: { color: visual.slider } } }],
        series: countries.map((country, i) => ({ name: country.name, lineStyle: { color: visual.colors[i % visual.colors.length] }, itemStyle: { color: visual.colors[i % visual.colors.length] } })),
      });
    };
    window.addEventListener("gdp-theme-change", updateTheme);
    return () => window.removeEventListener("gdp-theme-change", updateTheme);
  }, [countries]);

  return (
    <div
      ref={el}
      className="trend-chart"
      role="img"
      aria-label={`${metric === "gdp" ? "GDP" : metric === "pc" ? "GDP per capita" : "Population"} comparison for ${countries.map((c) => c.name).join(", ")}. Use the data table and CSV for accessible values.`}
    />
  );
}
