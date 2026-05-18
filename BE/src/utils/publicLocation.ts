import { getCityEntry, matchLocality } from "../data/cityLocalities";

/** What employers/workers see on cards — never a full address. */
export function formatPublicLocation(city?: string | null, displaySector?: string | null): string {
  const c = (city ?? "Gurugram").trim() || "Gurugram";
  const s = (displaySector ?? "").trim();
  if (s) return `${c} · ${s}`;
  return c;
}

export type ResolvedLocation = {
  city: string;
  /** Shown on feed; null if area not in catalog */
  displaySector: string | null;
  /** Stored privately; includes non-catalog area + full address */
  fullAddress: string | null;
};

export function resolveLocationFromInputs(input: {
  cityInput: string;
  areaInput: string;
  fullAddressInput?: string;
}): ResolvedLocation {
  const cityEntry = getCityEntry(input.cityInput);
  const city = (cityEntry?.apiValue ?? input.cityInput.trim()) || "Gurugram";
  const cityKey = cityEntry?.id ?? input.cityInput;
  const areaRaw = input.areaInput.trim();
  const fullRaw = (input.fullAddressInput ?? "").trim();
  const matched = matchLocality(cityKey, areaRaw);

  const privateParts: string[] = [];
  if (!matched && areaRaw) privateParts.push(`Area: ${areaRaw}`);
  if (fullRaw) privateParts.push(fullRaw);

  return {
    city,
    displaySector: matched,
    fullAddress: privateParts.length > 0 ? privateParts.join(" · ") : null,
  };
}
