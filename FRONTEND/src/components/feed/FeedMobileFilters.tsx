"use client";

import { ACTIVE_MARKET, type SalaryBandId } from "@/lib/launch";

type Props = {
  roleId: string;
  cityId: string;
  salaryBand: SalaryBandId;
  onRoleChange: (roleId: string) => void;
  onCityChange: (cityId: string) => void;
  onSalaryBandChange: (band: SalaryBandId) => void;
};

export function FeedMobileFilters({
  roleId,
  cityId,
  salaryBand,
  onRoleChange,
  onCityChange,
  onSalaryBandChange,
}: Props) {
  const { roles, cities, salaryBands } = ACTIVE_MARKET;
  const multiCity = cities.length > 1;

  return (
    <div className="shrink-0 space-y-3 border-b border-border pb-4 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip active={!roleId} onClick={() => onRoleChange("")}>
          All roles
        </FilterChip>
        {roles.map((role) => (
          <FilterChip key={role.id} active={roleId === role.id} onClick={() => onRoleChange(role.id)}>
            {role.label}
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {multiCity ? (
          <select
            value={cityId}
            onChange={(e) => onCityChange(e.target.value)}
            className="min-h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
            aria-label="City"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex min-h-10 flex-1 items-center rounded-lg border border-border bg-slate-50/80 px-3 text-sm font-medium text-foreground">
            {cities[0]?.label}
          </span>
        )}
        <select
          value={salaryBand}
          onChange={(e) => onSalaryBandChange(e.target.value as SalaryBandId)}
          className="min-h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
          aria-label="Salary"
        >
          {salaryBands.map((band) => (
            <option key={band.id} value={band.id}>
              {band.shortLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
        active ? "bg-brand text-white" : "border border-border bg-surface text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
