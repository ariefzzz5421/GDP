import type { Country } from "@/lib/data/model";
export default function Flag({ country }: { country: Country }) {
  return (
    <span
      role="img"
      aria-label={`${country.name} flag`}
      className="flag"
      style={{
        backgroundImage: `url(/flags/${country.iso2 === "JG" ? "xx" : country.iso2.toLowerCase()}.svg)`,
      }}
      title={
        country.iso2 === "JG"
          ? "Channel Islands aggregate: no single national flag"
          : country.name
      }
    />
  );
}
