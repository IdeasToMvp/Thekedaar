import type { FeedJob } from "@/lib/jobs/types";

/** Salary band ids — add new bands here and in `salaryBands` below. */
export type SalaryBandId = "all" | "10-15" | "15-25" | "25+";

export type LaunchSalaryBand = {
  id: SalaryBandId;
  label: string;
  shortLabel: string;
};

export type LaunchRole = {
  id: string;
  label: string;
  icon: string;
  /** Value for the jobs API `category` query param */
  apiCategory: string;
  /** Extra category strings returned by older seed data */
  aliases?: string[];
};

export type LaunchCity = {
  id: string;
  label: string;
  /** Value for the jobs API `city` query param */
  apiValue: string;
};

/**
 * Launch market configuration.
 * To expand: add entries to `cities`, `roles`, or `salaryBands` and wire UI automatically.
 */
export type LaunchMarket = {
  id: string;
  displayName: string;
  regionLabel: string;
  defaultCityId: string;
  cities: LaunchCity[];
  roles: LaunchRole[];
  salaryBands: LaunchSalaryBand[];
};

export const GURUGRAM_LAUNCH: LaunchMarket = {
  id: "gurugram-v1",
  displayName: "Gurugram",
  regionLabel: "Gurugram · Launch city",
  defaultCityId: "gurugram",
  cities: [{ id: "gurugram", label: "Gurugram", apiValue: "Gurugram" }],
  roles: [
    { id: "maid", label: "Maid / House help", icon: "🧹", apiCategory: "Maid", aliases: ["House help"] },
    { id: "cook", label: "Cook", icon: "👨‍🍳", apiCategory: "Cook", aliases: ["Chef"] },
    {
      id: "shop-helper",
      label: "Shop helper",
      icon: "🛒",
      apiCategory: "Shop helper",
      aliases: ["Shop Helper", "Retail helper", "Helper"],
    },
  ],
  salaryBands: [
    { id: "all", label: "Any salary", shortLabel: "Any" },
    { id: "10-15", label: "₹10,000 – ₹15,000", shortLabel: "₹10k–15k" },
    { id: "15-25", label: "₹15,000 – ₹25,000", shortLabel: "₹15k–25k" },
    { id: "25+", label: "₹25,000+", shortLabel: "₹25k+" },
  ],
};

/** Active market for the product — point to another config when you launch new cities. */
export const ACTIVE_MARKET: LaunchMarket = GURUGRAM_LAUNCH;

export function getLaunchCity(cityId: string): LaunchCity | undefined {
  return ACTIVE_MARKET.cities.find((c) => c.id === cityId);
}

export function getLaunchRole(roleId: string): LaunchRole | undefined {
  return ACTIVE_MARKET.roles.find((r) => r.id === roleId);
}

export function cityToApiParam(cityId: string): string | undefined {
  const city = getLaunchCity(cityId);
  return city?.apiValue;
}

export function roleToApiParam(roleId: string): string | undefined {
  const role = getLaunchRole(roleId);
  return role?.apiCategory;
}

export function roleIcon(roleId: string): string {
  return getLaunchRole(roleId)?.icon ?? "💼";
}

function categoryMatchesRole(category: string, role: LaunchRole): boolean {
  const c = category.trim().toLowerCase();
  if (!c) return false;
  const targets = [role.apiCategory, ...(role.aliases ?? [])].map((s) => s.toLowerCase());
  return targets.some((t) => c === t || c.includes(t) || t.includes(c));
}

export function jobMatchesLaunchRole(job: FeedJob, roleId: string): boolean {
  if (!roleId) {
    return ACTIVE_MARKET.roles.some((r) => categoryMatchesRole(job.category, r));
  }
  const role = getLaunchRole(roleId);
  if (!role) return true;
  return categoryMatchesRole(job.category, role);
}

export function jobMatchesLaunchCity(job: FeedJob, cityId: string): boolean {
  const city = getLaunchCity(cityId);
  if (!city) return true;
  const jc = (job.city || "").toLowerCase();
  const needle = city.apiValue.toLowerCase();
  return jc.includes(needle) || needle.includes(jc);
}

export function filterJobsToLaunchMarket(jobs: FeedJob[], cityId: string, roleId: string): FeedJob[] {
  return jobs.filter((j) => jobMatchesLaunchCity(j, cityId) && jobMatchesLaunchRole(j, roleId));
}

export function filterJobsBySalary(jobs: FeedJob[], band: SalaryBandId): FeedJob[] {
  if (band === "all") return jobs;
  return jobs.filter((j) => {
    const s = j.salaryPerMonth;
    if (!s || s <= 0) return false;
    if (band === "10-15") return s >= 10_000 && s < 15_000;
    if (band === "15-25") return s >= 15_000 && s < 25_000;
    return s >= 25_000;
  });
}

export function pickFeaturedJob(jobs: FeedJob[]): FeedJob | null {
  if (jobs.length === 0) return null;
  return jobs.find((j) => j.urgency === "high") ?? jobs[0];
}

export function launchHighlights(jobs: FeedJob[]): { label: string; sub: string }[] {
  const counts = new Map<string, number>();
  for (const role of ACTIVE_MARKET.roles) {
    counts.set(role.id, 0);
  }
  for (const j of jobs) {
    for (const role of ACTIVE_MARKET.roles) {
      if (categoryMatchesRole(j.category, role)) {
        counts.set(role.id, (counts.get(role.id) ?? 0) + 1);
        break;
      }
    }
  }
  return ACTIVE_MARKET.roles
    .map((role) => ({
      label: `${counts.get(role.id) ?? 0} ${role.label.toLowerCase()} roles`,
      sub: `Open in ${ACTIVE_MARKET.displayName}`,
    }))
    .filter((h) => !h.label.startsWith("0 "));
}
