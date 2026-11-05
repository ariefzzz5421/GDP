# GDP — Global Economic Observatory

[Open the live observatory](https://gdp-observatory.vercel.app)

An interactive economic history explorer built with Next.js App Router, TypeScript, Tailwind CSS and Apache ECharts. Oswald 700 and Inter are self-hosted through `next/font/google`.

## Run locally

Requires Node.js 22+ (24 recommended).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No database, API key or runtime environment variables are required. Public snapshots are served locally; an upstream API outage does not break the deployed app.

## Explore

- `/`: economic observatory, animated ranking race, timeline, Indonesia focus, comparison and rankings.
- `/history`: historical race starting in 1900.
- `/compare`: country comparison workspace, up to five series, legend toggles and drag/slider zoom.
- `/rankings`: sortable, searchable same-year leaderboard.
- `/country/idn`: country profile; ISO alpha-3 country routes are prerendered.
- `/methodology`: definitions, attribution, boundaries, units, data status and refresh policy.

Controls include play/pause/restart/previous/next, 0.5–4× speed, year slider, GDP/per-capita, fixed Top 10/20/30/100 or dynamic national cohorts, custom selections, event annotations, local CSV and PNG exports, and shareable URL state. Long charts have a bounded scroll area; tables scroll horizontally on narrow screens. Country details use a keyboard-dismissable native dialog. Motion honors reduced-motion preferences. Snapshot failures offer retry.

## Data — definitions are deliberately separate

| Mode | Source | Coverage in this snapshot | Units |
|---|---|---|---|
| Modern | World Bank WDI | 1960–2025 | Current US dollars |
| Historical | Maddison Project Database 2023 | 1900–2022 | Constant 2011 international dollars, PPP |
| Outlook | IMF October 2026 WEO workbook | 1980–2031 | Current US dollars |

There are 11,764 modern, 14,329 historical and 9,297 IMF country-year records in the initial snapshot. Coverage varies by country and indicator. No application-generated interpolation, backfill or invented GDP values is used.

World Bank indicators: `NY.GDP.MKTP.CD`, `NY.GDP.PCAP.CD`, `NY.GDP.MKTP.KD.ZG`. World Bank reported history is labelled actual, subject to revision and underlying national statistical estimation. Maddison values are historical estimates; total GDP is derived as GDP per capita × population **in thousands × 1,000**. IMF `NGDPD` billions are converted to dollars. IMF `LATEST_ACTUAL_ANNUAL_DATA` is read **per indicator**, not inferred from a universal year: observations up to that boundary are actual; later observations through 2026 are estimates, and 2027 onward are projections.

The default national cohort is the top 30 by 2025 World Bank nominal GDP, including Indonesia. Top 100 uses a separately stored 100-country cohort from the same year. The cohort reference year is the latest year with at least 150 national observations. Dynamic national rankings and all-available economy rankings are different universes. The leaderboard includes separately reported territories and excludes regional aggregates. Rankings never combine years or datasets. Missing values remain missing.

Modern flags identify series, not historical sovereignty. Former USSR, Yugoslavia, Czechoslovakia and former Sudan are excluded from historical normalization rather than mapped to successor states. Other national series retain source boundary conventions. GDP is not a measure of individual welfare or inequality.

## Reproducible data updates

Python 3.10+ is needed only to refresh data, not to build or serve the app.

```sh
python -m pip install -r scripts/requirements.txt
npm run data:refresh
# Re-normalize already-downloaded raw sources without network access:
npm run data:normalize
npm test
```

- `scripts/fetch-data/refresh.py`: concurrent downloads, HTTP and payload checks, validated Excel worksheets, atomic replacement, URL/timestamp/SHA-256 sidecars; retains each last valid raw source on download failure.
- `scripts/normalize-data/normalize.py`: country mapping, territory exclusions, unit conversion, missing-value handling, per-indicator status, cohort construction, source bibliography and normalized snapshots.
- `data/raw/`: gitignored raw downloads and metadata. On a fresh checkout an unavailable source fails the refresh; the committed processed snapshot remains usable.
- `data/processed/manifest.json`: small metadata and country/cohort manifest imported by the app.
- `public/data/*.json`: committed source snapshots, country bibliography and provenance checksums. Data loads by selected methodology and is cached in the browser session.
- `public/flags/`: local MIT-licensed SVG flags for PNG export; UI flags use the same library.

IMF and Maddison release URLs are intentionally pinned. Before adopting a new release, verify its publication, column schema, units and forecast metadata, update the pinned URL and normalization version/year bounds, run the tests, inspect the diff and rebuild. The World Bank endpoint requests through 2026; extend that bound for subsequent calendar-year refreshes. The refresh command does not silently deploy data changes.

A failed normalization leaves prior committed assets available. Review all generated changes before committing: ingestion uses atomic per-file writes, not a multi-file transaction. Run updates in the source checkout, then build/deploy the complete snapshot together; never refresh files in a running production directory.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Data tests cover uniqueness, numeric validity, source separation, forecast boundaries, population-unit conversion, missing years, rankings, national cohort and CSV missing/status fields. Production dependency audit: `npm audit --omit=dev`.

Browser QA should cover 360, 390, 768, 1024, 1280 and 1440px, plus landscape; playback, method changes, per-capita ordering, country detail, source references, chart zoom, comparison selections, table sort/search, PNG/CSV downloads and URL restoration. Test network-failure retry and reduced-motion behavior. Keep local QA output under ignored `output/`.

## Deploy to Vercel

Import `ariefzzz5421/GDP`, choose **Next.js**, repository root, Node 24, `npm ci`, and `npm run build`. No secrets or external runtime services are required. Feature branches create previews; review before merging to the production branch. Alternatively use `npx vercel` for a preview or `npx vercel --prod` for an explicitly intended production deployment.

After Vercel reports READY, verify the homepage, a country route, methodology, a served dataset and actual chart interactions. A successful build alone is not a verified public release.

## Attribution

- [World Bank WDI](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD), CC BY 4.0 subject to source exceptions.
- [Maddison Project Database 2023](https://doi.org/10.34894/INZBF2), CC BY 4.0. Bolt, Jutta and Jan Luiten van Zanden (2024), “Maddison style estimates of the evolution of the world economy: A new 2023 update”, Journal of Economic Surveys. [Paper](https://doi.org/10.1111/joes.12618). Original country papers are extracted into `public/data/historical-sources.json`, surfaced in historical country details and linked from methodology. Consult the complete workbook bibliography for reuse.
- [IMF World Economic Outlook](https://data.imf.org/datasets/WEO), October 2026; [terms of use](https://www.imf.org/external/terms.htm).
- [flag-icons](https://github.com/lipis/flag-icons), MIT. License retained in `public/flags/LICENSE`.
- Event references are stored alongside factual annotations in `lib/data/events.ts`; annotations supply context, not causal claims.

Application code is licensed under the repository MIT license. Dataset rights remain with their respective sources.
