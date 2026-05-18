"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function FeedSearchBar({ value, onChange, placeholder, className = "" }: Props) {
  return (
    <div className={className}>
      <label className="sr-only" htmlFor="feed-search">
        Search
      </label>
      <input
        id="feed-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
      />
    </div>
  );
}
