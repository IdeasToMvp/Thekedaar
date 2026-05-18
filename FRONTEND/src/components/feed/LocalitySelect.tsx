"use client";

import { getCityEntry, getLocalitiesForCity } from "@/lib/launch/cityLocalities";

type Props = {
  cityId: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  hint?: string;
};

export function LocalitySelect({
  cityId,
  value,
  onChange,
  label = "Area / sector",
  required = false,
  className = "",
  hint,
}: Props) {
  const cityLabel = getCityEntry(cityId)?.label ?? "your city";
  const localities = getLocalitiesForCity(cityId);
  const defaultHint = `Pick a known area in ${cityLabel}. Exact address is not shown on the public feed.`;

  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
      >
        <option value="">Select area</option>
        {localities.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      {(hint ?? defaultHint) ? <p className="mt-1 text-xs text-muted">{hint ?? defaultHint}</p> : null}
    </label>
  );
}
