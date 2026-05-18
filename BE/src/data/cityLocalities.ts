/**
 * Launch cities and area/sector catalogs for web + WhatsApp.
 * Keep FE/src/lib/launch/cityLocalities.ts in sync.
 */

export type LaunchCityId = "gurugram" | "delhi" | "noida" | "bangalore" | "mumbai";

export type CityCatalogEntry = {
  id: LaunchCityId;
  label: string;
  apiValue: string;
  aliases: readonly string[];
  localities: readonly string[];
};

const GURUGRAM_LOCALITIES = [
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

const DELHI_LOCALITIES = [
  "Connaught Place",
  "Karol Bagh",
  "Lajpat Nagar",
  "Saket",
  "Dwarka Sector 10",
  "Dwarka Sector 21",
  "Rohini Sector 7",
  "Rohini Sector 15",
  "Pitampura",
  "Janakpuri",
  "Rajouri Garden",
  "Mayur Vihar Phase 1",
  "Vasant Kunj",
  "Greater Kailash",
  "Nehru Place",
  "Shahdara",
  "Narela",
  "Okhla",
  "Hauz Khas",
  "Model Town",
  "Paschim Vihar",
  "Preet Vihar",
  "Yamuna Vihar",
  "Civil Lines",
  "Kalkaji",
  "Defence Colony",
  "Chanakyapuri",
  "ITO",
  "Kashmere Gate",
] as const;

const NOIDA_LOCALITIES = [
  "Sector 15",
  "Sector 18",
  "Sector 37",
  "Sector 50",
  "Sector 62",
  "Sector 76",
  "Sector 93",
  "Sector 104",
  "Sector 137",
  "Sector 142",
  "Noida Extension",
  "Greater Noida West",
  "Greater Noida Sector 1",
  "Botanical Garden",
  "Golf Course",
  "Film City",
  "Atta Market",
  "Gaur City",
  "Crossings Republik",
  "Indirapuram",
  "Knowledge Park",
  "Sector 44",
  "Sector 51",
  "Sector 71",
  "Sector 128",
] as const;

const BANGALORE_LOCALITIES = [
  "Koramangala",
  "Indiranagar",
  "HSR Layout",
  "Whitefield",
  "Electronic City",
  "Marathahalli",
  "Bellandur",
  "Jayanagar",
  "BTM Layout",
  "MG Road",
  "Hebbal",
  "Yelahanka",
  "Banashankari",
  "Rajajinagar",
  "Malleshwaram",
  "JP Nagar",
  "Bannerghatta Road",
  "Sarjapur Road",
  "Manyata Tech Park",
  "Mahadevapura",
  "Domlur",
  "Ulsoor",
  "Frazer Town",
  "RT Nagar",
  "Vijayanagar",
] as const;

const MUMBAI_LOCALITIES = [
  "Andheri East",
  "Andheri West",
  "Bandra",
  "Powai",
  "Goregaon",
  "Borivali",
  "Malad",
  "Dadar",
  "Chembur",
  "Ghatkopar",
  "Kurla",
  "Thane",
  "Navi Mumbai Vashi",
  "Navi Mumbai Belapur",
  "Lower Parel",
  "Worli",
  "Colaba",
  "Juhu",
  "Santacruz",
  "Kandivali",
  "Mulund",
  "Bhandup",
  "Vikhroli",
  "Dahisar",
  "Mira Road",
] as const;

export const CITY_CATALOG: readonly CityCatalogEntry[] = [
  {
    id: "gurugram",
    label: "Gurugram",
    apiValue: "Gurugram",
    aliases: ["gurgaon", "gurugram"],
    localities: GURUGRAM_LOCALITIES,
  },
  {
    id: "delhi",
    label: "Delhi",
    apiValue: "Delhi",
    aliases: ["new delhi", "ncr", "delhi ncr"],
    localities: DELHI_LOCALITIES,
  },
  {
    id: "noida",
    label: "Noida",
    apiValue: "Noida",
    aliases: ["greater noida", "noida extension"],
    localities: NOIDA_LOCALITIES,
  },
  {
    id: "bangalore",
    label: "Bangalore",
    apiValue: "Bangalore",
    aliases: ["bengaluru", "bangalore"],
    localities: BANGALORE_LOCALITIES,
  },
  {
    id: "mumbai",
    label: "Mumbai",
    apiValue: "Mumbai",
    aliases: ["bombay", "mumbai", "navi mumbai"],
    localities: MUMBAI_LOCALITIES,
  },
];

/** @deprecated use CITY_CATALOG */
export const GURUGRAM_CITY_LABEL = "Gurugram";
/** @deprecated use getLocalitiesForCity("gurugram") */
export { GURUGRAM_LOCALITIES };

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/sector\s*(\d+)/i, "sector $1");
}

export function getCityEntry(cityIdOrApiValue: string): CityCatalogEntry | undefined {
  const t = norm(cityIdOrApiValue);
  return CITY_CATALOG.find(
    (c) => c.id === t || norm(c.apiValue) === t || c.aliases.some((a) => norm(a) === t || t.includes(norm(a))),
  );
}

export function getLocalitiesForCity(cityIdOrApiValue: string): readonly string[] {
  return getCityEntry(cityIdOrApiValue)?.localities ?? [];
}

export function parseCityMenuChoice(input: string): CityCatalogEntry | null {
  const t = input.trim();
  const n = Number(t.replace(/\D/g, ""));
  if (Number.isInteger(n) && n >= 1 && n <= CITY_CATALOG.length) {
    return CITY_CATALOG[n - 1] ?? null;
  }
  return getCityEntry(t) ?? null;
}

export function cityMenuPrompt(): string {
  const lines = CITY_CATALOG.map((c, i) => `${i + 1}) ${c.label}`);
  return "Sheher chuniye (number reply karein):\n\n" + lines.join("\n") + "\n\n(back = previous)";
}

export function matchLocality(cityIdOrApiValue: string, input: string): string | null {
  const localities = getLocalitiesForCity(cityIdOrApiValue);
  if (localities.length === 0) return null;

  const t = input.trim();
  if (!t) return null;

  const n = Number(t.replace(/\D/g, ""));
  if (Number.isInteger(n) && n >= 1 && n <= localities.length) {
    return localities[n - 1] ?? null;
  }

  const needle = norm(t);
  for (const loc of localities) {
    const l = norm(loc);
    if (needle === l || needle.includes(l) || l.includes(needle)) return loc;
  }

  const sectorNum = needle.match(/(?:sector|sec)\s*(\d{1,3})/);
  if (sectorNum) {
    const label = `Sector ${sectorNum[1]}`;
    if (localities.some((x) => norm(x) === norm(label))) return label;
  }

  return null;
}

export function localityMenuPrompt(cityIdOrApiValue: string, page = 0, pageSize = 12): string {
  const localities = getLocalitiesForCity(cityIdOrApiValue);
  const city = getCityEntry(cityIdOrApiValue);
  const cityLabel = city?.label ?? "your city";
  const start = page * pageSize;
  const slice = localities.slice(start, start + pageSize);
  if (slice.length === 0) return `No more areas in list for ${cityLabel}. Type your area name.`;
  const lines = slice.map((loc, i) => `${start + i + 1}) ${loc}`);
  const more = start + slice.length < localities.length;
  return (
    `Area / sector in ${cityLabel} (number reply karein):\n\n` +
    lines.join("\n") +
    (more ? "\n\n*more* = aur areas | *back* = previous" : "") +
    "\n\nYa area ka naam type karein"
  );
}

/** @deprecated use parseCityMenuChoice */
export function gurugramCityAccepted(text: string): boolean {
  return parseCityMenuChoice(text)?.id === "gurugram";
}

/** @deprecated use matchLocality("gurugram", input) */
export function matchGurugramLocality(input: string): string | null {
  return matchLocality("gurugram", input);
}
