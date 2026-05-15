"use client";

export type FeedDetailCell = {
  key: string;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "muted";
  fullWidth?: boolean;
};

const toneClasses: Record<NonNullable<FeedDetailCell["tone"]>, string> = {
  default: "bg-slate-50/80 text-foreground",
  success: "bg-emerald-50 text-emerald-900",
  warning: "bg-amber-50 text-amber-900",
  muted: "bg-slate-50/60 text-muted",
};

function CellIcon({ id }: { id: string }) {
  const className = "h-3.5 w-3.5 shrink-0 opacity-70";
  switch (id) {
    case "location":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "timing":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "accommodation":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "urgency":
    case "availability":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 2v4M16 2v4" />
        </svg>
      );
    case "age":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        </svg>
      );
    case "gender":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "aadhaar":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      );
    case "experience":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

type Props = {
  items: FeedDetailCell[];
  className?: string;
};

export function FeedDetailGrid({ items, className = "" }: Props) {
  if (items.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`.trim()} role="list">
      {items.map((item) => (
        <div
          key={item.key}
          role="listitem"
          className={`rounded-xl border border-border/60 px-2.5 py-2 ${toneClasses[item.tone ?? "default"]} ${
            item.fullWidth ? "col-span-2" : ""
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CellIcon id={item.key} />
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{item.label}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
