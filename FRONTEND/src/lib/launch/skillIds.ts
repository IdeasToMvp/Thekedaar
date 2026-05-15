import { ACTIVE_MARKET } from "./market";

/** Map stored skill label (e.g. "Cook") to launch role id for forms. */
export function skillLabelToRoleId(label: string): string {
  const lower = label.trim().toLowerCase();
  const match = ACTIVE_MARKET.roles.find((r) => {
    const targets = [r.apiCategory, r.label, ...(r.aliases ?? [])].map((s) => s.toLowerCase());
    return targets.some((t) => t === lower || lower.includes(t) || t.includes(lower));
  });
  return match?.id ?? "";
}

export function roleIdToSkillLabel(roleId: string): string {
  const role = ACTIVE_MARKET.roles.find((r) => r.id === roleId);
  return role?.apiCategory ?? "";
}

export function skillLabelsToRoleIds(labels: string[]): string[] {
  const ids: string[] = [];
  for (const label of labels) {
    const id = skillLabelToRoleId(label);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function roleIdsToSkillLabels(roleIds: string[]): string[] {
  return [...new Set(roleIds.map(roleIdToSkillLabel).filter(Boolean))];
}
