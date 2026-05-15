import type { FeedWorker } from "./types";
import {
  ACTIVE_MARKET,
  getLaunchRole,
  type SalaryBandId,
} from "@/lib/launch";

function workerSkillLabels(worker: FeedWorker): string[] {
  if (worker.skills?.length) return worker.skills;
  return worker.role ? [worker.role] : [];
}

function roleMatchesWorker(worker: FeedWorker, roleId: string): boolean {
  const labels = workerSkillLabels(worker);
  if (!roleId) {
    return labels.some((label) =>
      ACTIVE_MARKET.roles.some((r) => categoryMatchesRole(label, r.apiCategory, r.aliases)),
    );
  }
  const role = getLaunchRole(roleId);
  if (!role) return true;
  return labels.some((label) => categoryMatchesRole(label, role.apiCategory, role.aliases));
}

function categoryMatchesRole(
  workerRole: string,
  apiCategory: string,
  aliases?: string[],
): boolean {
  const c = workerRole.trim().toLowerCase();
  if (!c) return false;
  const targets = [apiCategory, ...(aliases ?? [])].map((s) => s.toLowerCase());
  return targets.some((t) => c === t || c.includes(t) || t.includes(c));
}

export function workerMatchesLaunchCity(worker: FeedWorker, cityId: string): boolean {
  const city = ACTIVE_MARKET.cities.find((c) => c.id === cityId);
  if (!city) return true;
  const wc = (worker.city || "").toLowerCase();
  const needle = city.apiValue.toLowerCase();
  return wc.includes(needle) || needle.includes(wc);
}

export function filterWorkersToLaunchMarket(
  workers: FeedWorker[],
  cityId: string,
  roleId: string,
): FeedWorker[] {
  return workers.filter(
    (w) =>
      (w.isOwnProfile || workerMatchesLaunchCity(w, cityId)) &&
      (w.isOwnProfile || roleMatchesWorker(w, roleId)),
  );
}

export function filterWorkersBySalary(workers: FeedWorker[], band: SalaryBandId): FeedWorker[] {
  if (band === "all") return workers;
  return workers.filter((w) => {
    if (w.isOwnProfile) return true;
    const s = w.expectedSalary;
    if (!s || s <= 0) return false;
    if (band === "10-15") return s >= 10_000 && s < 15_000;
    if (band === "15-25") return s >= 15_000 && s < 25_000;
    return s >= 25_000;
  });
}
