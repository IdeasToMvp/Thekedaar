"use client";

import { ACTIVE_MARKET, type SalaryBandId } from "@/lib/launch";
import { getLocalitiesForCity } from "@/lib/launch/cityLocalities";
import { FeedSearchBar } from "./FeedSearchBar";

type Props = {
  cityId: string;
  roleId: string;
  salaryBand: SalaryBandId;
  sector: string;
  searchQuery: string;
  onRoleChange: (roleId: string) => void;
  onSalaryBandChange: (band: SalaryBandId) => void;
  onSectorChange: (sector: string) => void;
  onSearchChange: (q: string) => void;
  searchPlaceholder: string;
};

export function FeedMobileFilters({
  cityId,
  roleId,
  salaryBand,
  sector,
  searchQuery,
  onRoleChange,
  onSalaryBandChange,
  onSectorChange,
  onSearchChange,
  searchPlaceholder,
}: Props) {
  const { roles, salaryBands } = ACTIVE_MARKET;
  const localities = getLocalitiesForCity(cityId);

  return (
    <div className="shrink-0 space-y-3 border-b border-border pb-4 lg:hidden">
      <FeedSearchBar value={searchQuery} onChange={onSearchChange} placeholder={searchPlaceholder} />

      {localities.length > 0 ? (
        <select
          value={sector}
          onChange={(e) => onSectorChange(e.target.value)}
          className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          aria-label="Area or sector"
        >
          <option value="">All areas</option>
          {localities.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      ) : null}

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

      <select
        value={salaryBand}
        onChange={(e) => onSalaryBandChange(e.target.value as SalaryBandId)}
        className="min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
        aria-label="Salary"
      >
        {salaryBands.map((band) => (
          <option key={band.id} value={band.id}>
            {band.shortLabel}
          </option>
        ))}
      </select>
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
