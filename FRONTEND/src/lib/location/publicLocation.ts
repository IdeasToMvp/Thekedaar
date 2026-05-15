/** Display-only: city + sector/area. Never show full addresses on cards. */
export function formatPublicLocation(city?: string | null, sector?: string | null): string {
  const c = (city ?? "").trim();
  const s = (sector ?? "").trim();
  if (c && s) return `${c} · ${s}`;
  if (c) return c;
  if (s) return s;
  return "";
}

/** Prefer API `publicLocation`, else build from parts. */
export function workerOrJobLocation(input: {
  publicLocation?: string | null;
  city?: string | null;
  sector?: string | null;
}): string {
  const fromApi = input.publicLocation?.trim();
  if (fromApi) return fromApi;
  return formatPublicLocation(input.city, input.sector) || "Location not set";
}
