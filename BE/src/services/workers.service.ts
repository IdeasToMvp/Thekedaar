import { assertUserCanMutate, isPubliclyVisibleAccount } from "./accountLifecycle.service";
import { supabaseAdmin } from "./supabase.service";
import { sendHireContactDetailsWhatsApp } from "../utils/contactDetails";
import { getUserById } from "./user.service";
import { formatPublicLocation } from "../utils/publicLocation";
import { normalizePlan, type BillingPlan } from "../utils/planLimits";
import { PRICE_WORKER_UNLOCK_PAISE, paiseToInr } from "../utils/creditPricing";
import { chargeWorkerUnlock } from "./recruiterBilling.service";
import { getWalletBalancePaise } from "./wallet.service";

export type WorkerUserJoin = {
  id: string;
  name: string | null;
  city: string | null;
  sector: string | null;
  phone: string;
  created_at: string;
};

/** Shape returned by Supabase for worker_profiles + users!inner join */
export type WorkerFeedRowRaw = {
  user_id: string;
  role: string | null;
  skills?: string[] | null;
  age: number | null;
  gender: string | null;
  has_aadhaar: boolean | null;
  experience_years: number | null;
  expected_salary: number | null;
  availability: string | null;
  users: WorkerUserJoin | WorkerUserJoin[];
};

function resolveWorkerSkills(row: WorkerFeedRowRaw): string[] {
  const fromSkills = (row.skills ?? []).map((s) => s.trim()).filter(Boolean);
  if (fromSkills.length > 0) return [...new Set(fromSkills)];
  const role = row.role?.trim();
  return role ? [role] : [];
}

function resolveWorkerUser(users: WorkerUserJoin | WorkerUserJoin[]): WorkerUserJoin {
  const u = Array.isArray(users) ? users[0] : users;
  if (!u) throw new Error("Worker user row missing");
  return u;
}

export type WorkerFeedApiWorker = {
  id: string;
  displayName: string;
  avatarKey: string;
  role: string;
  skills: string[];
  city: string;
  sector: string;
  publicLocation: string;
  age: number | null;
  gender: string | null;
  hasAadhaar: boolean | null;
  expectedSalary: number;
  experienceYears: number | null;
  availability: string;
  listedAt: string;
  contactWaDigits: string;
  isOwnProfile?: boolean;
};

function avatarKey(name: string | null, phone: string): string {
  const n = (name || phone || "?").trim();
  return n.slice(0, 1).toUpperCase();
}

function waDigitsFromPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function mapWorkerToFeedApi(row: WorkerFeedRowRaw, viewerId?: string): WorkerFeedApiWorker {
  const u = resolveWorkerUser(row.users);
  const phone = u.phone ?? "";
  const skills = resolveWorkerSkills(row);
  return {
    id: u.id,
    displayName: u.name?.trim() || `Worker ${phone.slice(-4)}`,
    avatarKey: avatarKey(u.name, phone),
    role: skills[0] ?? "General",
    skills,
    city: u.city?.trim() || "",
    sector: u.sector?.trim() || "",
    publicLocation: formatPublicLocation(u.city, u.sector),
    age: row.age ?? null,
    gender: row.gender ?? null,
    hasAadhaar: row.has_aadhaar ?? null,
    expectedSalary: row.expected_salary ?? 0,
    experienceYears: row.experience_years,
    availability: row.availability?.trim() || "Not specified",
    listedAt: u.created_at,
    contactWaDigits: waDigitsFromPhone(phone),
    ...(viewerId && u.id === viewerId ? { isOwnProfile: true } : {}),
  };
}

export async function countWorkersForFeed(input: { city?: string; role?: string }): Promise<number> {
  const sb = supabaseAdmin();
  let q = sb
    .from("worker_profiles")
    .select("user_id, users!inner(id)", { count: "exact", head: true })
    .eq("users.account_status", "active");
  if (input.city) q = q.ilike("users.city", input.city);
  if (input.role) q = q.ilike("role", input.role);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export async function listWorkersForFeed(input: {
  city?: string;
  role?: string;
  sort: "newest" | "salary_high" | "salary_low";
  offset: number;
  limit: number;
  viewerId?: string;
}): Promise<{ workers: WorkerFeedApiWorker[] }> {
  const sb = supabaseAdmin();
  let q = sb
    .from("worker_profiles")
    .select(
      "user_id, role, skills, age, gender, has_aadhaar, experience_years, expected_salary, availability, users!inner(id, name, city, sector, phone, created_at, account_status)",
    )
    .eq("users.account_status", "active");

  if (input.city) q = q.ilike("users.city", input.city);
  if (input.role) q = q.ilike("role", input.role);

  if (input.sort === "newest") q = q.order("updated_at", { ascending: false });
  else if (input.sort === "salary_high") {
    q = q.order("expected_salary", { ascending: false, nullsFirst: false });
  } else {
    q = q.order("expected_salary", { ascending: true, nullsFirst: false });
  }

  const from = input.offset;
  const to = input.offset + input.limit - 1;
  q = q.range(from, to);

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as WorkerFeedRowRaw[];
  return {
    workers: rows.map((row) => mapWorkerToFeedApi(row, input.viewerId)),
  };
}

export type WorkerHireApiWorker = WorkerFeedApiWorker & {
  phone: string;
  hiredAt: string;
};

async function fetchWorkerFeedRow(workerId: string): Promise<WorkerFeedRowRaw | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("worker_profiles")
    .select(
      "user_id, role, skills, age, gender, has_aadhaar, experience_years, expected_salary, availability, users!inner(id, name, city, sector, phone, created_at)",
    )
    .eq("user_id", workerId)
    .maybeSingle();
  if (error) throw error;
  return (data as WorkerFeedRowRaw | null) ?? null;
}

export async function hasEmployerHiredWorker(employerId: string, workerId: string): Promise<boolean> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("worker_feed_contacts")
    .select("id")
    .eq("employer_id", employerId)
    .eq("worker_id", workerId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function countEmployerWorkerContacts(employerId: string): Promise<number> {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("worker_feed_contacts")
    .select("id", { count: "exact", head: true })
    .eq("employer_id", employerId);
  if (error) throw error;
  return count ?? 0;
}

export async function listEmployerContactedWorkerIds(employerId: string): Promise<string[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("worker_feed_contacts")
    .select("worker_id")
    .eq("employer_id", employerId);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { worker_id: string }).worker_id);
}

export async function recordEmployerWorkerHire(input: {
  employerId: string;
  workerId: string;
}): Promise<{ recorded: boolean; worker: WorkerHireApiWorker }> {
  if (input.employerId === input.workerId) {
    throw new Error("You cannot hire your own profile");
  }

  await assertUserCanMutate(input.employerId);
  const row = await fetchWorkerFeedRow(input.workerId);
  if (!row) throw new Error("Worker not found");
  const workerUser = row.users as { account_status?: string | null } | undefined;
  if (workerUser?.account_status && workerUser.account_status !== "active") {
    throw new Error("This worker profile is not available");
  }

  const employer = await getUserById(input.employerId);
  if (!employer) throw new Error("User not found");
  const plan = normalizePlan(employer.subscription_plan ?? undefined);

  const already = await hasEmployerHiredWorker(input.employerId, input.workerId);
  const usedBefore = await countEmployerWorkerContacts(input.employerId);

  if (!already) {
    await chargeWorkerUnlock(input.employerId, input.workerId);
    const sb = supabaseAdmin();
    const { error } = await sb.from("worker_feed_contacts").insert({
      employer_id: input.employerId,
      worker_id: input.workerId,
      action: "hire",
    });
    if (error) throw error;
    try {
      await sendHireContactDetailsWhatsApp(input.employerId, input.workerId);
    } catch {
      /* non-blocking */
    }
  }

  const sb = supabaseAdmin();
  const { data: contactRow, error: cErr } = await sb
    .from("worker_feed_contacts")
    .select("created_at")
    .eq("employer_id", input.employerId)
    .eq("worker_id", input.workerId)
    .maybeSingle();
  if (cErr) throw cErr;

  const mapped = mapWorkerToFeedApi(row);
  const u = resolveWorkerUser(row.users);
  const worker: WorkerHireApiWorker = {
    ...mapped,
    phone: u.phone ?? "",
    contactWaDigits: waDigitsFromPhone(u.phone ?? ""),
    hiredAt: (contactRow as { created_at: string } | null)?.created_at ?? new Date().toISOString(),
  };

  return { recorded: !already, worker };
}

export type EmployerWorkerContactActivity = {
  workerId: string;
  hiredAt: string;
  worker: WorkerHireApiWorker;
};

export async function listEmployerContactedWorkers(employerId: string, limit = 50): Promise<EmployerWorkerContactActivity[]> {
  const sb = supabaseAdmin();
  const { data: contacts, error: cErr } = await sb
    .from("worker_feed_contacts")
    .select("worker_id, created_at")
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (cErr) throw cErr;
  const rows = (contacts ?? []) as { worker_id: string; created_at: string }[];
  if (rows.length === 0) return [];

  const workerIds = rows.map((r) => r.worker_id);
  const { data: profiles, error: pErr } = await sb
    .from("worker_profiles")
    .select(
      "user_id, role, skills, age, gender, has_aadhaar, experience_years, expected_salary, availability, users!inner(id, name, city, sector, phone, created_at)",
    )
    .in("user_id", workerIds);
  if (pErr) throw pErr;

  const profileRows = (profiles ?? []) as WorkerFeedRowRaw[];
  const profileMap = new Map(profileRows.map((r) => [resolveWorkerUser(r.users).id, r]));

  return rows
    .map((r) => {
      const profile = profileMap.get(r.worker_id);
      if (!profile) return null;
      const mapped = mapWorkerToFeedApi(profile);
      const u = resolveWorkerUser(profile.users);
      const worker: WorkerHireApiWorker = {
        ...mapped,
        phone: u.phone ?? "",
        contactWaDigits: waDigitsFromPhone(u.phone ?? ""),
        hiredAt: r.created_at,
      };
      return { workerId: r.worker_id, hiredAt: r.created_at, worker };
    })
    .filter((x): x is EmployerWorkerContactActivity => x != null);
}

export async function buildWorkerHireLimits(employerId: string): Promise<{
  plan: BillingPlan;
  wallet: { balanceInr: number; unlockCostInr: number };
  contactedWorkerIds: string[];
}> {
  const employer = await getUserById(employerId);
  if (!employer) throw new Error("User not found");
  const plan = normalizePlan(employer.subscription_plan ?? undefined);
  const contactedWorkerIds = await listEmployerContactedWorkerIds(employerId);
  const balancePaise = await getWalletBalancePaise(employerId);

  return {
    plan,
    wallet: {
      balanceInr: paiseToInr(balancePaise),
      unlockCostInr: paiseToInr(PRICE_WORKER_UNLOCK_PAISE),
    },
    contactedWorkerIds,
  };
}
