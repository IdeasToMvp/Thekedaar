/** Normalize BE_API_BASE_URL (no trailing slash; strip a trailing `/api` segment). */
export function getBeApiBase(): string | null {
  const raw = process.env.BE_API_BASE_URL?.trim();
  if (!raw) return null;
  let base = raw.replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }
  return base;
}

/** Build a backend URL for paths like `auth/me` or `/api/jobs/feed`. */
export function beApiUrl(apiPath: string): string | null {
  const base = getBeApiBase();
  if (!base) return null;
  let path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  if (!path.startsWith("/api/")) {
    path = `/api${path}`;
  }
  return `${base}${path}`;
}
