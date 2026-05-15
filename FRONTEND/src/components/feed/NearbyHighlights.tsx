type Highlight = { label: string; sub: string };

type Props = {
  items: Highlight[];
};

export function NearbyHighlights({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="mt-6" aria-label="Nearby highlights">
      <h2 className="text-sm font-semibold text-foreground">Nearby</h2>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li
            key={item.label}
            className="min-w-[200px] shrink-0 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm"
          >
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted">{item.sub}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
