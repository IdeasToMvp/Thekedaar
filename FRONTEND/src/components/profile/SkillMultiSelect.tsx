"use client";

import { ACTIVE_MARKET, roleIcon } from "@/lib/launch";

type Props = {
  selectedRoleIds: string[];
  onChange: (roleIds: string[]) => void;
  max?: number;
};

export function SkillMultiSelect({ selectedRoleIds, onChange, max = 8 }: Props) {
  function toggle(roleId: string) {
    if (selectedRoleIds.includes(roleId)) {
      onChange(selectedRoleIds.filter((id) => id !== roleId));
      return;
    }
    if (selectedRoleIds.length >= max) return;
    onChange([...selectedRoleIds, roleId]);
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground">Skills</p>
      <p className="mt-0.5 text-xs text-muted">Select all roles you can work as (e.g. Maid and Cook).</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {ACTIVE_MARKET.roles.map((role) => {
          const active = selectedRoleIds.includes(role.id);
          return (
            <li key={role.id}>
              <button
                type="button"
                onClick={() => toggle(role.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-brand bg-brand/15 text-brand-dark"
                    : "border-border bg-surface text-foreground hover:border-brand/40"
                }`}
              >
                <span aria-hidden>{roleIcon(role.id)}</span>
                {role.label}
              </button>
            </li>
          );
        })}
      </ul>
      {selectedRoleIds.length === 0 ? (
        <p className="mt-2 text-xs text-amber-800">Pick at least one skill.</p>
      ) : null}
    </div>
  );
}
