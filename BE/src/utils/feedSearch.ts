/** Sanitize user text for PostgREST ilike patterns. */
export function ilikePattern(q: string): string {
  const trimmed = sanitizeSearchTerm(q);
  if (!trimmed) return "";
  return `%${trimmed}%`;
}

export function hasSearchQuery(q?: string): boolean {
  return Boolean(sanitizeSearchTerm(q ?? ""));
}

/** Strip chars that break PostgREST filter strings. */
export function sanitizeSearchTerm(q: string): string {
  return q.trim().replace(/[%_\\",().]/g, "").slice(0, 80);
}

/**
 * Build a PostgREST `.or()` ilike filter, e.g. `role.ilike.%foo%,name.ilike.%foo%`.
 * Pass `referencedTable` when columns live on an embedded resource (e.g. users).
 */
export function buildOrIlikeFilter(columns: string[], rawQuery: string): string | null {
  const term = sanitizeSearchTerm(rawQuery);
  if (!term || columns.length === 0) return null;
  const pattern = `%${term}%`;
  return columns.map((col) => `${col}.ilike.${pattern}`).join(",");
}

export type OrIlikeOptions = {
  /** Embedded table for foreign columns (e.g. `users` on worker_profiles). */
  referencedTable?: string;
};

/** Readable message from Supabase/PostgREST errors (head count often has empty `message`). */
export function formatSupabaseError(e: unknown): string {
  if (e instanceof Error && e.message.trim()) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message;
    if (typeof o.details === "string" && o.details.trim()) return o.details;
    if (typeof o.hint === "string" && o.hint.trim()) return o.hint;
    if (typeof o.code === "string" && o.code.trim()) return `Database error (${o.code})`;
  }
  return "Request failed";
}
