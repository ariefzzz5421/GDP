import Link from "next/link";
import manifest from "@/data/processed/manifest.json";
export const metadata = { title: "Methodology & Sources — GDP" };
export default function Methodology() {
  return (
    <main id="main" className="page methodology">
      <p className="eyebrow">A NOTE ON THE NUMBERS</p>
      <h1>
        Good data.
        <br />
        Honest perspective.
      </h1>
      <p className="intro">
        Economic history is a collection of carefully constructed estimates, not
        one perfectly comparable line. This observatory keeps the definitions
        visible and the datasets separate.
      </p>
      <section>
        <h2>Three lenses. Three distinct datasets.</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Coverage</th>
                <th>Units</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(manifest.datasets).map((d) => (
                <tr key={d.mode}>
                  <td>
                    <a href={d.sourceUrl}>{d.source} ↗</a>
                  </td>
                  <td>
                    {d.minYear}–{d.maxYear}
                  </td>
                  <td>{d.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Each mode is a separate series. Switching modes changes the units,
          coverage, source, and status labels. We never splice historical
          purchasing-power estimates into a nominal dollar series. “Present”
          means the latest reported annual observation; the current calendar
          year may only have an IMF estimate.
        </p>
      </section>
      <section>
        <h2>What GDP measures</h2>
        <p>
          <strong>Nominal GDP</strong> is the value of production at current
          prices. Current US dollar GDP converts local output using exchange
          rates. Comparisons over time reflect inflation and currency movements
          as well as economic activity.
        </p>
        <p>
          <strong>Real GDP</strong> adjusts for price changes. The growth column
          uses the World Bank’s annual real GDP growth indicator,
          NY.GDP.MKTP.KD.ZG, or IMF NGDP_RPCH. We do not infer real growth from
          nominal dollar changes.
        </p>
        <p>
          <strong>Purchasing power parity (PPP)</strong> adjusts for differences
          in price levels across economies. An international dollar represents a
          common purchasing-power unit. It is not a current US dollar exchange
          value.
        </p>
        <p>
          <strong>GDP per capita</strong> divides output by population. It is an
          average, not a measure of median income, household wealth, inequality,
          or wellbeing.
        </p>
      </section>
      <section>
        <h2>The long view: Maddison Project</h2>
        <p>
          Historical data use the Maddison Project Database 2023, covering this
          explorer’s 1900–2022 period. GDP per capita is reported in 2011
          international dollars. Total GDP is derived only where both GDP per
          capita and population are available: GDP per capita × population (in
          thousands) × 1,000. The derived total is not a separate reported
          nominal GDP series.
        </p>
        <p>
          All historical observations are labelled historical estimates. Source
          estimates may incorporate reconstruction, interpolation and
          extrapolation; this application adds no interpolation or missing-year
          values. Early observations and boundary conventions carry substantial
          uncertainty.
        </p>
        <p>
          Modern flags identify series, not historical sovereignty. Former USSR,
          Yugoslavia, Czechoslovakia, and former Sudan are excluded rather than
          reassigned to successor states. Remaining national series retain the
          source’s territorial conventions and are not a map of borders at each
          historical date.
        </p>
        <p>
          <strong>Citation:</strong> Bolt, Jutta and Jan Luiten van Zanden
          (2024), “Maddison style estimates of the evolution of the world
          economy: A new 2023 update”, Journal of Economic Surveys.{" "}
          <a href="https://doi.org/10.1111/joes.12618">Paper ↗</a> ·{" "}
          <a href="https://doi.org/10.34894/INZBF2">
            Dataset, original country papers and source workbook ↗
          </a>
        </p>
        <p>
          Original country source references are available in the historical
          country detail panel and in the{" "}
          <a href="/data/historical-sources.json">
            complete extracted bibliography
          </a>
          . General 2008–2022 updates use the Total Economy Database / UN
          national accounts, as documented in the workbook. Dataset license: CC
          BY 4.0.
        </p>
      </section>
      <section>
        <h2>The modern view: World Bank</h2>
        <p>
          World Development Indicators:{" "}
          <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD">
            NY.GDP.MKTP.CD
          </a>{" "}
          (GDP, current US dollars),{" "}
          <a href="https://data.worldbank.org/indicator/NY.GDP.PCAP.CD">
            NY.GDP.PCAP.CD
          </a>{" "}
          (GDP per capita, current US dollars), and{" "}
          <a href="https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG">
            NY.GDP.MKTP.KD.ZG
          </a>{" "}
          (real GDP growth). World Bank historical reported values are labelled
          actual in this interface, may include underlying national estimates,
          and remain subject to revision. They are not application forecasts.
          License: CC BY 4.0, subject to source-specific exceptions.
        </p>
      </section>
      <section>
        <h2>The outlook: IMF</h2>
        <p>
          The October 2026 WEO workbook supplies NGDPD, NGDPDPC and NGDP_RPCH.
          GDP in billions is converted to dollars. Actual status comes from each
          series’ LATEST_ACTUAL_ANNUAL_DATA field. Later observations through
          the publication year are labelled estimates; subsequent years are
          projections. Status can differ between GDP, per capita GDP, and
          growth. IMF staff estimates are not observed outcomes. Future updates
          require verifying and pinning a new release workbook.
        </p>
        <p>
          <a href="https://data.imf.org/Datasets/WEO/Frequently-Asked-Questions">
            IMF definitions, revision policy and status metadata ↗
          </a>{" "}
          ·{" "}
          <a href="https://www.imf.org/external/terms.htm">
            IMF terms of use ↗
          </a>
        </p>
      </section>
      <section>
        <h2>Rankings, cohorts & missing data</h2>
        <p>
          The default cohort is the 30 largest national economies by World Bank
          nominal GDP in {manifest.cohortYear}, including Indonesia. This
          reference year is the latest year with GDP observations for at least
          150 national economies. It is not a list of developed economies. Top
          10 and Top 20 show the highest selected-metric values within that
          cohort unless dynamic ranking is selected.
        </p>
        <p>
          Dynamic rankings use available national observations in the selected
          year. “All available” and the leaderboard also include separately
          reported territories. We exclude World Bank regional aggregates. Ranks
          compare one year, metric and source only. No carry-forward is used;
          missing countries are omitted. Rank changes may reflect coverage
          changes as well as output. Latest rankings use the dataset’s latest
          available year and may have fewer reporting economies.
        </p>
        <p>
          Comparison endpoints use each economy’s first and last available
          years, explicitly shown. A common endpoint cannot be assumed. Lines do
          not connect across missing years. Display values are rounded; table
          hover and CSV retain source precision. Flags use the MIT-licensed{" "}
          <a href="https://github.com/lipis/flag-icons">flag-icons</a> library.
        </p>
      </section>
      <section>
        <h2>Snapshots & reproducibility</h2>
        {Object.values(manifest.datasets).map((d) => (
          <p key={d.mode}>
            <strong>{d.version}</strong>
            <br />
            Retrieved {d.retrievedAt.slice(0, 10)} · {d.license} ·{" "}
            <a href={`/data/${d.mode}.json`}>Normalized dataset ↗</a>
          </p>
        ))}
        <p>
          Runtime charts read bundled snapshots, not live upstream APIs. The
          refresh pipeline validates downloads, records timestamps and SHA-256
          checksums, and retains the previous raw snapshot on fetch failure.
          Normalization runs locally and validates data before replacing output.
          Changes are reviewed and redeployed, so an upstream outage does not
          break the deployed app. See the{" "}
          <a href="https://github.com/ariefzzz5421/GDP">repository README</a>{" "}
          for refresh and deployment instructions.
        </p>
        <p>
          Historical event markers are contextual summaries with individual
          source links. They do not establish that a specific event caused any
          country’s GDP movement.
        </p>
      </section>
      <Link href="/">← Back to the observatory</Link>
    </main>
  );
}
