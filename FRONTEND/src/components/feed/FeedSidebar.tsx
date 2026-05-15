"use client";

import { ACTIVE_MARKET, roleIcon, type SalaryBandId } from "@/lib/launch";

type Props = {
  roleId: string;
  salaryBand: SalaryBandId;
  onRoleChange: (roleId: string) => void;
  onSalaryBandChange: (band: SalaryBandId) => void;
  onClear: () => void;
};

export function FeedSidebar({ roleId, salaryBand, onRoleChange, onSalaryBandChange, onClear }: Props) {
  const { roles, salaryBands } = ACTIVE_MARKET;

  return (
    <aside className="flex h-full flex-col px-1 py-4 lg:py-6">
      <div className="shrink-0 px-3">
        <h2 className="text-lg font-bold text-foreground">Filters</h2>
        <p className="text-xs text-muted">Role &amp; salary</p>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Role</p>
          <ul className="mt-2 space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => onRoleChange("")}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                  !roleId ? "bg-brand/10 font-medium text-brand" : "text-foreground hover:bg-slate-50"
                }`}
              >
                <span aria-hidden>📋</span>
                All roles
              </button>
            </li>
            {roles.map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => onRoleChange(role.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                    roleId === role.id ? "bg-brand/10 font-medium text-brand" : "text-foreground hover:bg-slate-50"
                  }`}
                >
                  <span aria-hidden>{roleIcon(role.id)}</span>
                  <span className="truncate">{role.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Salary</p>
          <ul className="mt-2 space-y-2">
            {salaryBands.map((opt) => (
              <li key={opt.id}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    name="salary"
                    checked={salaryBand === opt.id}
                    onChange={() => onSalaryBandChange(opt.id)}
                    className="accent-brand"
                  />
                  {opt.label}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shrink-0 border-t border-border px-3 pt-4">
        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition hover:bg-slate-50"
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}
