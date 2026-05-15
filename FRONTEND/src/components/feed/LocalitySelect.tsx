"use client";

import { GURUGRAM_LOCALITIES } from "@/lib/launch/gurugramLocalities";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  hint?: string;
};

export function LocalitySelect({
  value,
  onChange,
  label = "Area / sector",
  required = false,
  className = "",
  hint = "Pick a known area in Gurugram. Exact address is not shown on the public feed.",
}: Props) {
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
        {GURUGRAM_LOCALITIES.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </label>
  );
}
