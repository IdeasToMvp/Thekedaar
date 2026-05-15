/** Block values that look like full street addresses (privacy). */
const ADDRESS_LIKE =
  /\b(house|flat|plot|floor|road|street|st\.|lane|gali|near|opposite|opp\.|pin\s*code|pincode|hno|#)\b|\d{6}/i;

export function sanitizeSectorInput(text: string): { ok: true; value: string } | { ok: false; reason: string } {
  const value = text.trim().replace(/\s+/g, " ");
  if (value.length < 2) return { ok: false, reason: "Area name bahut chhota hai." };
  if (value.length > 80) return { ok: false, reason: "Sirf area/sector likho (80 characters se kam)." };
  if (ADDRESS_LIKE.test(value)) {
    return {
      ok: false,
      reason: "Poora address mat likho — sirf sector / area (e.g. Sector 56, DLF Phase 2).",
    };
  }
  return { ok: true, value };
}

export function sanitizeCityInput(text: string): string | null {
  const value = text.trim().replace(/\s+/g, " ");
  if (value.length < 2 || value.length > 80) return null;
  if (ADDRESS_LIKE.test(value)) return null;
  return value;
}

/** What employers/workers see on cards — never a full address. */
export function formatPublicLocation(city?: string | null, sector?: string | null): string {
  const c = (city ?? "").trim();
  const s = (sector ?? "").trim();
  if (c && s) return `${c} · ${s}`;
  if (c) return c;
  if (s) return s;
  return "";
}
