/** Gurugram sectors / localities for matching & WhatsApp menus (extend per new cities later). */

export const GURUGRAM_CITY_LABEL = "Gurugram";

export const GURUGRAM_LOCALITIES: readonly string[] = [
  "Sector 14",
  "Sector 15",
  "Sector 17",
  "Sector 21",
  "Sector 22",
  "Sector 23",
  "Sector 28",
  "Sector 29",
  "Sector 31",
  "Sector 38",
  "Sector 39",
  "Sector 40",
  "Sector 43",
  "Sector 44",
  "Sector 45",
  "Sector 46",
  "Sector 47",
  "Sector 48",
  "Sector 49",
  "Sector 50",
  "Sector 51",
  "Sector 52",
  "Sector 53",
  "Sector 54",
  "Sector 55",
  "Sector 56",
  "Sector 57",
  "Sector 62",
  "Sector 63",
  "Sector 65",
  "Sector 66",
  "Sector 67",
  "Sector 70",
  "Sector 71",
  "Sector 82",
  "Sector 83",
  "Sector 84",
  "Sector 86",
  "Sector 89",
  "Sector 90",
  "Sector 91",
  "Sector 92",
  "Sector 93",
  "Sector 95",
  "DLF Phase 1",
  "DLF Phase 2",
  "DLF Phase 3",
  "DLF Phase 4",
  "DLF Phase 5",
  "Golf Course Road",
  "Sohna Road",
  "Sikanderpur",
  "Udyog Vihar",
  "Palam Vihar",
  "South City 1",
  "South City 2",
  "Nirvana Country",
  "Malibu Town",
  "MG Road",
  "IFFCO Chowk",
  "HUDA City Centre",
  "New Gurgaon",
  "Manesar (border)",
] as const;

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/sector\s*(\d+)/i, "sector $1");
}

/** Match free text or menu number to a catalog locality label. */
export function matchGurugramLocality(input: string): string | null {
  const t = input.trim();
  if (!t) return null;

  const n = Number(t.replace(/\D/g, ""));
  if (Number.isInteger(n) && n >= 1 && n <= GURUGRAM_LOCALITIES.length) {
    return GURUGRAM_LOCALITIES[n - 1] ?? null;
  }

  const needle = norm(t);
  for (const loc of GURUGRAM_LOCALITIES) {
    const l = norm(loc);
    if (needle === l || needle.includes(l) || l.includes(needle)) return loc;
  }

  const sectorNum = needle.match(/(?:sector|sec)\s*(\d{1,3})/);
  if (sectorNum) {
    const label = `Sector ${sectorNum[1]}`;
    if (GURUGRAM_LOCALITIES.some((x) => norm(x) === norm(label))) return label;
  }

  return null;
}

export function gurugramCityAccepted(text: string): boolean {
  const t = norm(text);
  return t === "1" || t.includes("gurugram") || t.includes("gurgaon");
}

export function localityMenuPrompt(page = 0, pageSize = 12): string {
  const start = page * pageSize;
  const slice = GURUGRAM_LOCALITIES.slice(start, start + pageSize);
  if (slice.length === 0) return "No more areas in list. Type your area name.";
  const lines = slice.map((loc, i) => `${start + i + 1}) ${loc}`);
  const more = start + slice.length < GURUGRAM_LOCALITIES.length;
  return (
    "Area / sector chuniye (number reply karein):\n\n" +
    lines.join("\n") +
    (more ? "\n\n*more* = aur areas | *back* = previous" : "") +
    "\n\nYa area ka naam type karein (e.g. Sector 56)"
  );
}
