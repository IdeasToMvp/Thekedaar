"use client";

import { useState } from "react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
};

export function CopyShareField({ label, value, hint, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          readOnly
          value={value}
          className="min-h-10 min-w-0 flex-1 rounded-xl border border-border bg-slate-50 px-3 text-xs text-foreground"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="min-h-10 shrink-0 rounded-xl border border-brand bg-brand/10 px-4 text-xs font-semibold text-brand-dark transition hover:bg-brand/15 sm:min-w-[5.5rem]"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}
