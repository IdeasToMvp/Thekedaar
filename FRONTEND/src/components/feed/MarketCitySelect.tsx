"use client";

import { ACTIVE_MARKET } from "@/lib/launch";

type Props = {
  cityId: string;
  onCityChange: (cityId: string) => void;
  className?: string;
  /** Compact style for navbar */
  size?: "sm" | "md";
};

export function MarketCitySelect({ cityId, onCityChange, className = "", size = "md" }: Props) {
  const { cities } = ACTIVE_MARKET;
  const multiCity = cities.length > 1;

  const selectClass =
    size === "sm"
      ? "min-h-9 rounded-lg border border-border bg-surface pl-2 pr-7 text-sm font-semibold text-foreground"
      : "mt-1 w-full rounded-lg border border-border bg-slate-50/80 px-3 py-2 text-sm font-semibold text-foreground";

  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">City</span>
      <select
        value={cityId}
        onChange={(e) => onCityChange(e.target.value)}
        disabled={!multiCity}
        className={`${selectClass} ${!multiCity ? "cursor-default opacity-100" : ""}`}
        aria-label="Select city"
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
