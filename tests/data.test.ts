import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ranked, csv, type Dataset } from "../lib/data/model.ts";
const read = (name: string) =>
  JSON.parse(
    fs.readFileSync(
      new URL(`../public/data/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const historical = read("historical") as Dataset;
const modern = read("modern") as Dataset;
const outlook = read("outlook") as Dataset;
test("snapshots have unique source/year/country observations and valid numeric values", () => {
  for (const d of [historical, modern, outlook]) {
    assert.ok(d.rows.length > 9000);
    const keys = new Set();
    for (const r of d.rows) {
      const key = `${r.code}/${r.year}`;
      assert.ok(!keys.has(key));
      keys.add(key);
      assert.ok(r.gdp === null || (Number.isFinite(r.gdp) && r.gdp >= 0));
      assert.ok(r.pc === null || (Number.isFinite(r.pc) && r.pc >= 0));
      assert.ok(r.pop === null || (Number.isFinite(r.pop) && r.pop >= 0));
    }
  }
});
test("methodologies and status boundaries remain separate", () => {
  assert.equal(historical.minYear, 1900);
  assert.equal(historical.maxYear, 2022);
  assert.ok(historical.rows.every((r) => r.status === "historical estimate"));
  assert.ok(modern.rows.every((r) => r.status === "actual"));
  assert.ok(
    outlook.rows
      .filter((r) => r.year > 2026 && r.gdp !== null)
      .every((r) => r.status === "projection"),
  );
  assert.ok(
    outlook.rows
      .filter((r) => r.year > 2026 && r.pop !== null)
      .every((r) => r.popStatus === "projection"),
  );
  assert.notEqual(historical.unit, modern.unit);
});
test("Maddison population in thousands converts to total GDP correctly", () => {
  const usa = historical.rows.find((r) => r.code === "USA" && r.year === 2022)!;
  assert.equal(usa.pop, 333288000);
  assert.ok(Math.abs(usa.gdp! - usa.pc! * usa.pop!) < 1);
});
test("population ranks source observations in people, including countries without GDP", () => {
  const rows = ranked(modern.rows, 2025, "pop");
  assert.ok(rows.length > 190);
  assert.equal(rows[0].code, "IND");
  assert.equal(rows[1].code, "CHN");
  assert.ok(rows.some((r) => r.gdp === null));
  assert.ok(rows.every((r, i) => i === 0 || rows[i - 1].pop! >= r.pop!));
  assert.equal(ranked(modern.rows, 1900, "pop").length, 0);
  assert.ok(outlook.rows.some((r) => r.pop !== null && r.popStatus));
});
test("rankings do not fill missing years or include null metric values", () => {
  const rows = ranked(modern.rows, 2025, "gdp");
  assert.ok(rows.length > 150);
  assert.ok(rows.every((r) => r.year === 2025 && r.gdp !== null));
  assert.ok(rows.every((r, i) => i === 0 || rows[i - 1].gdp! >= r.gdp!));
  assert.equal(ranked(modern.rows, 1900, "gdp").length, 0);
});
test("fixed national cohort is exactly 30 and includes Indonesia", () => {
  const m = read("manifest");
  assert.equal(new Set(m.cohort).size, 30);
  assert.ok(m.cohort.includes("IDN"));
  assert.equal(new Set(m.cohort100).size, 100);
  assert.deepEqual(m.cohort100.slice(0, 30), m.cohort);
  assert.ok(
    m.cohort.every(
      (code: string) =>
        m.countries.find(
          (c: { code: string; national: boolean }) => c.code === code,
        )?.national,
    ),
  );
});
test("CSV distinguishes missing observations, source, unit, and per-indicator status", () => {
  const row = {
    code: "IDN",
    year: 2027,
    gdp: 1,
    pc: null,
    pop: 284670000,
    growth: null,
    status: "projection" as const,
  };
  const result = csv([row], "IMF", "current US dollars");
  assert.ok(result.includes('"projection"'));
  assert.ok(result.includes('"1","","284670000",""'));
  assert.ok(result.includes('"IMF","current US dollars"'));
});
