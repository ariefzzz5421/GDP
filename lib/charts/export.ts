import { countryColor } from "@/components/charts/RaceChart";

import {
  compact,
  type Observation,
  type Country,
  type Dataset,
  type Metric,
} from "@/lib/data/model";

export function download(content: Blob, filename: string) {
  const u = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

export async function exportRace(
  rows: Observation[],
  countries: Country[],
  dataset: Dataset,
  metric: Metric,
  year: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 190 + rows.length * 52;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Canvas unavailable");

  ctx.fillStyle = "#0b111b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f0f5fa";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(
    `GDP.  ${metric === "gdp" ? "Economic power" : "Prosperity per person"} / ${year}`,
    45,
    65,
  );
  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#a4b2c5";
  ctx.fillText(`${dataset.source} · ${dataset.unit}`, 45, 103);
  const max = rows[0]?.[metric] ?? 1;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const c = countries.find((c) => c.code === r.code)!;
    const y = 140 + i * 52;
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#d9e1eb";
    ctx.fillText(`${i + 1}.`, 45, y + 24);
    try {
      const flag = new Image();
      flag.src = `/flags/${c.iso2 === "JG" ? "xx" : c.iso2.toLowerCase()}.svg`;
      await flag.decode();
      ctx.drawImage(flag, 80, y + 4, 30, 22);
    } catch {
      /* Country name remains the accessible fallback. */
    }
    ctx.fillText(c.name, 125, y + 24, 225);
    ctx.fillStyle = countryColor(r.code);
    const width = ((r[metric] ?? 0) / max) * 970;
    ctx.fillRect(370, y, width, 30);
    ctx.fillStyle = "#edf6fa";
    ctx.fillText(compact(r[metric]), 385 + width, y + 23);
  }

  ctx.fillStyle = "#8fa0b3";
  ctx.font = "14px sans-serif";
  ctx.fillText(
    `${dataset.version} · Snapshot ${dataset.retrievedAt.slice(0, 10)} · ${dataset.mode === "historical" ? "Historical estimates" : dataset.mode === "outlook" ? "Actuals / estimates / projections" : "Reported actuals; subject to revision"}`,
    45,
    canvas.height - 20,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve),
  );
  if (!blob) throw Error("Image export failed");
  download(blob, `gdp-${dataset.mode}-${metric}-${year}.png`);
}
