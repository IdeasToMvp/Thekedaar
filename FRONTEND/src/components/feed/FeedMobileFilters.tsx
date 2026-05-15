"use client";

import { ACTIVE_MARKET, type SalaryBandId } from "@/lib/launch";

type Props = {
  roleId: string;
  salaryBand: SalaryBandId;
  onRoleChange: (roleId: string) => void;
  onSalaryBandChange: (band: SalaryBandId) => void;
};

export function FeedMobileFilters({ roleId, salaryBand, onRoleChange, onSalaryBandChange }: Props) {
  const { roles, salaryBands } = ACTIVE_MARKET;

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
