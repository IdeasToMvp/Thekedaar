type SortOption = "newest" | "salary_high" | "salary_low";

const selectClass =
  "w-full min-h-11 appearance-none rounded-xl border border-border bg-surface px-3 py-2.5 text-base text-foreground shadow-sm sm:min-h-10 sm:text-sm";

type Props = {
  city: string;
  category: string;
  sort: SortOption;
  cities: string[];
  categories: string[];
  onCityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
};

export function JobFeedFilters({
  city,
  category,
  sort,
  cities,
  categories,
  onCityChange,
  onCategoryChange,
  onSortChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Filters</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2">
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-muted">City</span>
          <select value={city} onChange={(e) => onCityChange(e.target.value)} className={selectClass}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-muted">Category</span>
          <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={selectClass}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-muted">Sort by</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={selectClass}
          >
            <option value="newest">Newest first</option>
            <option value="salary_high">Salary: high to low</option>
            <option value="salary_low">Salary: low to high</option>
          </select>
        </label>
      </div>
    </div>
  );
}
