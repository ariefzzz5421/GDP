"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Focus, Search } from "lucide-react";
import Flag from "@/components/Flag";
import type { Country } from "@/lib/data/model";
export default function HighlightPicker({
  countries,
  country,
  onSelect,
}: {
  countries: Country[];
  country: Country;
  onSelect: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const close = (event: PointerEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const filtered = countries.filter((c) =>
    `${c.name} ${c.code}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div
      className="highlight-picker"
      ref={wrapper}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          e.stopPropagation();
        }
      }}
    >
      <span className="highlight-caption">
        <Focus size={14} /> Highlight
      </span>
      <button
        type="button"
        className="highlight-trigger"
        aria-label="Highlight country"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
      >
        <Flag country={country} />
        <span>{country.name}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="highlight-menu">
          <label className="highlight-search">
            <Search size={15} />
            <input
              ref={search}
              aria-label="Search highlight countries"
              value={query}
              placeholder="Search economies…"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div
            className="highlight-options"
            role="listbox"
            aria-label="Countries to highlight"
          >
            {filtered.map((c) => (
              <button
                type="button"
                role="option"
                aria-selected={country.code === c.code}
                key={c.code}
                onClick={() => {
                  onSelect(c.code);
                  setOpen(false);
                }}
              >
                <Flag country={c} />
                <span>{c.name}</span>
                <small>{c.code}</small>
              </button>
            ))}
            {!filtered.length && <p>No matching economies.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
