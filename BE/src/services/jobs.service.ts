import { supabaseAdmin } from "./supabase.service";
import { formatPublicLocation } from "../utils/publicLocation";
import {
  assertUserCanAuthenticate,
  assertUserCanMutate,
  isPubliclyVisibleAccount,
} from "./accountLifecycle.service";
import { getUserById } from "./user.service";
import { normalizePlan, type BillingPlan } from "../utils/planLimits";
import { isUrgentUrgency } from "../utils/creditPricing";
import { hasWorkerProfile } from "./user.service";
import { chargeForNewJob, chargeForUrgentUpgrade } from "./recruiterBilling.service";
import { MAX_JOB_EDITS } from "../utils/creditPricing";
import { getWalletBalancePaise } from "./wallet.service";
import { paiseToInr, PRICE_WORKER_UNLOCK_PAISE } from "../utils/creditPricing";

export type ListingStatus = "open" | "closed";
export type HireSource = "not_hired" | "platform_worker" | "off_platform";

export const JOB_FEED_COLUMNS =
  "id,recruiter_id,title,city,sector,salary,timing,accommodation,urgency,category,description,min_age,max_age,preferred_gender,required_documents,experience_years_required,created_at,urgent_paid,listing_status,edit_count,edited_at,closed_at,hired_worker_id,hire_source,hired_worker_name";

export type JobFeedRow = {
  id: string;
  recruiter_id: string;
  title: string;
  city: string | null;
  sector: string | null;
  salary: number | null;
  timing: string | null;
  accommodation: boolean | null;
  urgency: string | null;
  category: string | null;
  description: string | null;
  min_age: number | null;
  max_age: number | null;
  preferred_gender: string | null;
  required_documents: string[] | null;
  experience_years_required: number | null;
  created_at: string;
  urgent_paid?: boolean | null;
  listing_status?: ListingStatus | null;
  edit_count?: number | null;
  edited_at?: string | null;
  closed_at?: string | null;
  hired_worker_id?: string | null;
  hire_source?: HireSource | null;
  hired_worker_name?: string | null;
};

export type JobFeedApiJob = {
  id: string;
  title: string;
  city: string;
  sector: string;
  publicLocation: string;
  category: string;
  salaryPerMonth: number;
  postedAt: string;
  employerDisplayName: string;
  employerAvatarKey: string;
  description: string;
  urgency: "low" | "medium" | "high";
  urgencyRaw: string | null;
  timing: string | null;
  accommodation: boolean | null;
  minAge?: number | null;
  maxAge?: number | null;
  preferredGender?: string | null;
  requiredDocuments?: string[];
  experienceYearsRequired?: number | null;
  posterSubscription: { plan: BillingPlan; features: Record<string, boolean> };
  contactWaDigits?: string;
  isOwnListing?: boolean;
  applicationStatus?: "pending" | "approved" | "rejected" | null;
  listingStatus: ListingStatus;
  editCount: number;
  maxEdits: number;
  editedAt: string | null;
  closedAt: string | null;
  canEdit: boolean;
  urgentPaid: boolean;
  hiredWorkerId: string | null;
  hireSource: HireSource | null;
  hiredWorkerName: string | null;
};

export type JobHireCandidate = {
  workerId: string;
  displayName: string;
  source: "application" | "job_contact";
};

function normalizeUrgency(u: string | null | undefined): "low" | "medium" | "high" {
  const t = (u || "").toLowerCase();
  if (t.includes("high") || t.includes("immediate")) return "high";
  if (t.includes("medium")) return "medium";
  return "low";
}

function waDigitsFromPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function avatarKey(name: string | null, phone: string): string {
  const n = (name || phone || "?").trim();
  return n.replace(/^Mrs\. /i, "M").slice(0, 1).toUpperCase();
}

export function mapJobToFeedApi(
  job: JobFeedRow,
  recruiter: { phone: string; name: string | null; subscription_plan?: string | null },
  viewerId?: string,
): JobFeedApiJob {
  const plan = normalizePlan(recruiter.subscription_plan ?? undefined);
  return {
    id: job.id,
    title: job.title,
    city: job.city || "",
    sector: job.sector?.trim() || "",
    publicLocation: formatPublicLocation(job.city, job.sector),
    category: job.category || "General",
    salaryPerMonth: job.salary ?? 0,
    postedAt: job.created_at,
    employerDisplayName: recruiter.name?.trim() || `Employer ${recruiter.phone.slice(-4)}`,
    employerAvatarKey: avatarKey(recruiter.name, recruiter.phone),
    description: job.description || `${job.title} in ${job.city || "your city"}.`,
    urgency: normalizeUrgency(job.urgency),
    urgencyRaw: job.urgency,
    timing: job.timing,
    accommodation: job.accommodation,
    minAge: job.min_age ?? null,
    maxAge: job.max_age ?? null,
    preferredGender: job.preferred_gender ?? null,
    requiredDocuments: job.required_documents ?? [],
    experienceYearsRequired: job.experience_years_required ?? null,
    posterSubscription: {
      plan,
      features:
        plan === "pro" || job.urgent_paid || isUrgentUrgency(job.urgency)
          ? { boosted_listing: true, urgent: Boolean(job.urgent_paid) }
          : {},
    },
    contactWaDigits: waDigitsFromPhone(recruiter.phone),
    listingStatus: (job.listing_status as ListingStatus) ?? "open",
    editCount: job.edit_count ?? 0,
    maxEdits: MAX_JOB_EDITS,
    editedAt: job.edited_at ?? null,
    closedAt: job.closed_at ?? null,
    canEdit:
      (job.listing_status ?? "open") === "open" && (job.edit_count ?? 0) < MAX_JOB_EDITS,
    urgentPaid: Boolean(job.urgent_paid),
    hiredWorkerId: job.hired_worker_id ?? null,
    hireSource: (job.hire_source as HireSource) ?? null,
    hiredWorkerName: job.hired_worker_name ?? null,
    ...(viewerId && job.recruiter_id === viewerId ? { isOwnListing: true } : {}),
  };
}

function assertJobIsOpen(job: JobFeedRow): void {
  if ((job.listing_status ?? "open") === "closed") {
    throw new Error("This listing is closed");
  }
}

export async function countJobsForRecruiter(recruiterId: string): Promise<number> {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("recruiter_id", recruiterId);
  if (error) throw error;
  return count ?? 0;
}

export async function countJobsThisCalendarMonth(recruiterId: string): Promise<number> {
  const sb = supabaseAdmin();
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const iso = start.toISOString();
  const { count, error } = await sb
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("recruiter_id", recruiterId)
    .gte("created_at", iso);
  if (error) throw error;
  return count ?? 0;
}

export async function createJob(input: {
  recruiterId: string;
  title: string;
  city?: string | null;
  sector?: string | null;
  fullAddress?: string | null;
  salary?: number | null;
  timing?: string | null;
  accommodation?: boolean | null;
  urgency?: string | null;
  category?: string | null;
  description?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  preferredGender?: string | null;
  requiredDocuments?: string[] | null;
  experienceYearsRequired?: number | null;
}) {
  await assertUserCanMutate(input.recruiterId);
  const { urgentPaid } = await chargeForNewJob(input.recruiterId, input.urgency);

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("jobs")
    .insert({
      recruiter_id: input.recruiterId,
      title: input.title,
      city: input.city ?? null,
      sector: input.sector?.trim() || null,
      full_address: input.fullAddress?.trim() || null,
      salary: input.salary ?? null,
      timing: input.timing ?? null,
      accommodation: input.accommodation ?? null,
      urgency: input.urgency ?? null,
      category: input.category ?? null,
      description: input.description ?? null,
      min_age: input.minAge ?? null,
      max_age: input.maxAge ?? null,
      preferred_gender: input.preferredGender ?? null,
      required_documents: input.requiredDocuments ?? [],
      experience_years_required: input.experienceYearsRequired ?? null,
      urgent_paid: urgentPaid,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function updateJobForRecruiter(input: {
  jobId: string;
  recruiterId: string;
  salary?: number | null;
  timing?: string | null;
  accommodation?: boolean | null;
  urgency?: string | null;
  description?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  preferredGender?: string | null;
  requiredDocuments?: string[] | null;
  experienceYearsRequired?: number | null;
}) {
  await assertUserCanMutate(input.recruiterId);
  const existing = await getJobById(input.jobId);
  if (!existing) throw new Error("Job not found");
  if (existing.recruiter_id !== input.recruiterId) {
    throw new Error("You can only edit your own listings");
  }
  assertJobIsOpen(existing);

  const editCount = existing.edit_count ?? 0;
  if (editCount >= MAX_JOB_EDITS) {
    throw new Error(`Edit limit reached (${MAX_JOB_EDITS}). Post a new listing to change city, role, or area.`);
  }

  const alreadyUrgent = Boolean(existing.urgent_paid) || isUrgentUrgency(existing.urgency);
  if (
    input.urgency !== undefined &&
    alreadyUrgent &&
    (input.urgency ?? "").trim() !== (existing.urgency ?? "").trim()
  ) {
    throw new Error("Urgency cannot be changed on an urgent listing.");
  }

  const upgradingToUrgent =
    input.urgency !== undefined &&
    isUrgentUrgency(input.urgency) &&
    !alreadyUrgent;

  if (upgradingToUrgent) {
    await chargeForUrgentUpgrade(input.recruiterId, input.jobId);
  }

  const sb = supabaseAdmin();
  const patch: Record<string, unknown> = {
    edit_count: editCount + 1,
    edited_at: new Date().toISOString(),
  };
  if (input.salary !== undefined) patch.salary = input.salary;
  if (input.timing !== undefined) patch.timing = input.timing?.trim() || null;
  if (input.accommodation !== undefined) patch.accommodation = input.accommodation;
  if (input.urgency !== undefined) {
    patch.urgency = input.urgency?.trim() || null;
    if (upgradingToUrgent) patch.urgent_paid = true;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.minAge !== undefined) patch.min_age = input.minAge;
  if (input.maxAge !== undefined) patch.max_age = input.maxAge;
  if (input.preferredGender !== undefined) patch.preferred_gender = input.preferredGender;
  if (input.requiredDocuments !== undefined) patch.required_documents = input.requiredDocuments ?? [];
  if (input.experienceYearsRequired !== undefined) {
    patch.experience_years_required = input.experienceYearsRequired;
  }

  const { error } = await sb.from("jobs").update(patch).eq("id", input.jobId);
  if (error) throw error;
  return { id: input.jobId, editCount: editCount + 1, urgentUpgraded: upgradingToUrgent };
}

export async function closeJobForRecruiter(input: {
  jobId: string;
  recruiterId: string;
  didHire: boolean;
  hiredWorkerId?: string | null;
  hireSource?: HireSource;
  hiredWorkerName?: string | null;
}) {
  await assertUserCanAuthenticate(input.recruiterId);
  const existing = await getJobById(input.jobId);
  if (!existing) throw new Error("Job not found");
  if (existing.recruiter_id !== input.recruiterId) {
    throw new Error("You can only close your own listings");
  }
  if ((existing.listing_status ?? "open") === "closed") {
    throw new Error("Listing is already closed");
  }

  let hireSource: HireSource = "not_hired";
  let hiredWorkerId: string | null = null;
  let hiredWorkerName: string | null = null;

  if (input.didHire) {
    if (input.hireSource === "platform_worker" && input.hiredWorkerId) {
      const candidates = await listHireCandidatesForJob(input.jobId, input.recruiterId);
      const match = candidates.find((c) => c.workerId === input.hiredWorkerId);
      if (!match) {
        throw new Error("Selected worker is not linked to this listing");
      }
      hireSource = "platform_worker";
      hiredWorkerId = input.hiredWorkerId;
      hiredWorkerName = match.displayName;
    } else if (input.hireSource === "off_platform") {
      const name = input.hiredWorkerName?.trim();
      if (!name) throw new Error("Enter the worker name");
      hireSource = "off_platform";
      hiredWorkerName = name;
    } else {
      throw new Error("Select a worker or choose not on platform");
    }
  }

  const sb = supabaseAdmin();
  const { error } = await sb
    .from("jobs")
    .update({
      listing_status: "closed",
      closed_at: new Date().toISOString(),
      hire_source: hireSource,
      hired_worker_id: hiredWorkerId,
      hired_worker_name: hiredWorkerName,
    })
    .eq("id", input.jobId);
  if (error) throw error;
  return { id: input.jobId };
}

export async function listHireCandidatesForJob(
  jobId: string,
  recruiterId: string,
): Promise<JobHireCandidate[]> {
  const job = await getJobById(jobId);
  if (!job) throw new Error("Job not found");
  if (job.recruiter_id !== recruiterId) {
    throw new Error("You can only view candidates for your own listings");
  }

  const sb = supabaseAdmin();
  const byId = new Map<string, JobHireCandidate>();

  const { data: apps, error: appErr } = await sb
    .from("job_applications")
    .select("worker_id")
    .eq("job_id", jobId);
  if (appErr) throw appErr;

  const { data: contacts, error: cErr } = await sb
    .from("job_feed_contacts")
    .select("user_id")
    .eq("job_id", jobId);
  if (cErr) throw cErr;

  const workerIds = new Set<string>();
  for (const row of apps ?? []) {
    workerIds.add((row as { worker_id: string }).worker_id);
  }
  for (const row of contacts ?? []) {
    workerIds.add((row as { user_id: string }).user_id);
  }
  if (workerIds.size === 0) return [];

  const { data: users, error: uErr } = await sb
    .from("users")
    .select("id,name,phone")
    .in("id", [...workerIds]);
  if (uErr) throw uErr;

  const userMap = new Map(
    (users ?? []).map((u) => {
      const row = u as { id: string; name: string | null; phone: string };
      const display =
        row.name?.trim() ||
        `Worker ${row.phone.slice(-4)}`;
      return [row.id, display] as const;
    }),
  );

  for (const row of apps ?? []) {
    const wid = (row as { worker_id: string }).worker_id;
    const displayName = userMap.get(wid);
    if (!displayName) continue;
    byId.set(wid, { workerId: wid, displayName, source: "application" });
  }
  for (const row of contacts ?? []) {
    const wid = (row as { user_id: string }).user_id;
    const displayName = userMap.get(wid);
    if (!displayName) continue;
    const prev = byId.get(wid);
    if (prev) {
      byId.set(wid, { ...prev, source: prev.source === "application" ? "application" : "job_contact" });
    } else {
      byId.set(wid, { workerId: wid, displayName, source: "job_contact" });
    }
  }

  return [...byId.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function findJobsForWorker(input: {
  city?: string | null;
  jobType?: string | null;
  skills?: string[] | null;
}) {
  const sb = supabaseAdmin();
  let q = sb
    .from("jobs")
    .select("id,title,city,salary,timing,accommodation,created_at,recruiter_id,listing_status, users!inner(account_status)")
    .eq("listing_status", "open")
    .eq("users.account_status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  if (input.city) q = q.ilike("city", `%${input.city}%`);
  const terms = [...new Set((input.skills ?? []).filter(Boolean))];
  if (terms.length === 0 && input.jobType) terms.push(input.jobType);
  if (terms.length === 1) {
    const t = terms[0]!;
    q = q.or(`title.ilike.%${t}%,category.ilike.%${t}%`);
  } else if (terms.length > 1) {
    const ors = terms.flatMap((t) => [`title.ilike.%${t}%`, `category.ilike.%${t}%`]);
    q = q.or(ors.join(","));
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any[];
}

async function fetchRecruitersMap(recruiterIds: string[]): Promise<
  Map<
    string,
    {
      phone: string;
      name: string | null;
      subscription_plan: string | null;
      account_status: string | null;
    }
  >
> {
  const map = new Map<
    string,
    {
      phone: string;
      name: string | null;
      subscription_plan: string | null;
      account_status: string | null;
    }
  >();
  if (recruiterIds.length === 0) return map;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("users")
    .select("id,phone,name,subscription_plan,account_status")
    .in("id", recruiterIds);
  if (error) throw error;
  for (const row of data ?? []) {
    map.set(row.id as string, {
      phone: row.phone as string,
      name: (row.name as string | null) ?? null,
      subscription_plan: (row.subscription_plan as string | null) ?? null,
      account_status: (row.account_status as string | null) ?? "active",
    });
  }
  return map;
}

function jobVisibleOnPublicFeed(
  row: JobFeedRow,
  recruiter: { account_status: string | null } | undefined,
  viewerId?: string,
): boolean {
  if (row.listing_status === "closed") return false;
  if (!recruiter) return false;
  const userLike = { account_status: recruiter.account_status ?? "active" } as Parameters<
    typeof isPubliclyVisibleAccount
  >[0];
  if (!isPubliclyVisibleAccount(userLike)) return false;
  return true;
}

export async function listJobsForFeed(input: {
  city?: string;
  category?: string;
  sort: "newest" | "salary_high" | "salary_low";
  offset: number;
  limit: number;
  viewerId?: string;
}): Promise<{ jobs: JobFeedApiJob[]; rawRows: JobFeedRow[] }> {
  const sb = supabaseAdmin();
  let q = sb.from("jobs").select(JOB_FEED_COLUMNS);

  if (input.city) q = q.ilike("city", input.city);
  if (input.category) q = q.ilike("category", input.category);

  if (input.sort === "newest") q = q.order("created_at", { ascending: false });
  else if (input.sort === "salary_high") q = q.order("salary", { ascending: false, nullsFirst: false });
  else q = q.order("salary", { ascending: true, nullsFirst: false });

  const from = input.offset;
  const to = input.offset + input.limit - 1;
  q = q.range(from, to);

  const { data, error } = await q;
  if (error) throw error;
  const allRows = (data ?? []) as JobFeedRow[];
  const ids = [...new Set(allRows.map((r) => r.recruiter_id))];
  const recruiters = await fetchRecruitersMap(ids);
  const rows = allRows.filter((row) => jobVisibleOnPublicFeed(row, recruiters.get(row.recruiter_id), input.viewerId));
  const jobs = rows.map((row) => {
    const rec = recruiters.get(row.recruiter_id);
    if (!rec) {
      return mapJobToFeedApi(row, { phone: "", name: null, subscription_plan: "free" }, input.viewerId);
    }
    return mapJobToFeedApi(row, rec, input.viewerId);
  });
  return { jobs, rawRows: rows };
}

export async function countJobsForFeed(input: { city?: string; category?: string }): Promise<number> {
  const sb = supabaseAdmin();
  let q = sb.from("jobs").select("id", { count: "exact", head: true });
  if (input.city) q = q.ilike("city", input.city);
  if (input.category) q = q.ilike("category", input.category);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export async function distinctJobCities(): Promise<string[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("jobs").select("city").not("city", "is", null).limit(500);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const c = (r as { city: string | null }).city;
    if (c) set.add(c);
  }
  return [...set].sort();
}

export async function distinctJobCategories(): Promise<string[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("jobs").select("category").not("category", "is", null).limit(500);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const c = (r as { category: string | null }).category;
    if (c) set.add(c);
  }
  return [...set].sort();
}

export async function getJobById(jobId: string): Promise<JobFeedRow | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("jobs")
    .select(JOB_FEED_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return (data as JobFeedRow) ?? null;
}

export async function countUserFeedContacts(userId: string): Promise<number> {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("job_feed_contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function hasUserContactedJob(userId: string, jobId: string): Promise<boolean> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("job_feed_contacts")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function recordFeedJobContact(input: {
  userId: string;
  jobId: string;
  action: "apply" | "whatsapp" | "hire";
}): Promise<{ recorded: boolean; used: number; max: number }> {
  await assertUserCanMutate(input.userId);
  const user = await getUserById(input.userId);
  if (!user) throw new Error("User not found");

  const job = await getJobById(input.jobId);
  if (!job) throw new Error("Job not found");
  assertJobIsOpen(job);
  const recruiter = await getUserById(job.recruiter_id);
  if (!isPubliclyVisibleAccount(recruiter)) {
    throw new Error("This listing is not available");
  }

  const already = await hasUserContactedJob(input.userId, input.jobId);
  const used = await countUserFeedContacts(input.userId);
  const workerFree = await hasWorkerProfile(input.userId);
  const max = workerFree ? 999_999 : 0;

  if (already) {
    return { recorded: false, used, max };
  }

  if (!workerFree) {
    throw new Error("Complete your worker profile to apply for jobs.");
  }

  const sb = supabaseAdmin();
  const { error } = await sb.from("job_feed_contacts").insert({
    user_id: input.userId,
    job_id: input.jobId,
    action: input.action,
  });
  if (error) throw error;
  return { recorded: true, used: used + 1, max };
}

export type FeedLimitsPayload = {
  plan: BillingPlan;
  feedContacts: { used: number; max: number; remaining: number };
  jobListings: { used: number; max: number; scope: "lifetime" | "month" } | null;
  contactedJobIds: string[];
  wallet?: { balanceInr: number; unlockCostInr: number };
};

export async function listUserContactedJobIds(userId: string): Promise<string[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("job_feed_contacts").select("job_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { job_id: string }).job_id);
}

export type FeedContactActivity = {
  jobId: string;
  action: "apply" | "whatsapp" | "hire";
  contactedAt: string;
  job: JobFeedApiJob;
};

export async function listUserFeedContactActivity(userId: string): Promise<FeedContactActivity[]> {
  const sb = supabaseAdmin();
  const { data: contacts, error: cErr } = await sb
    .from("job_feed_contacts")
    .select("job_id,action,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (cErr) throw cErr;
  const rows = (contacts ?? []) as { job_id: string; action: string; created_at: string }[];
  if (rows.length === 0) return [];

  const jobIds = [...new Set(rows.map((r) => r.job_id))];
  const { data: jobs, error: jErr } = await sb
    .from("jobs")
    .select(JOB_FEED_COLUMNS)
    .in("id", jobIds);
  if (jErr) throw jErr;
  const jobRows = (jobs ?? []) as JobFeedRow[];
  const recruiterIds = [...new Set(jobRows.map((r) => r.recruiter_id))];
  const recruiters = await fetchRecruitersMap(recruiterIds);
  const jobMap = new Map<string, JobFeedApiJob>();
  for (const row of jobRows) {
    const rec = recruiters.get(row.recruiter_id);
    jobMap.set(
      row.id,
      mapJobToFeedApi(row, rec ?? { phone: "", name: null, subscription_plan: "free" }),
    );
  }

  return rows
    .map((r) => {
      const job = jobMap.get(r.job_id);
      if (!job) return null;
      const action = r.action as FeedContactActivity["action"];
      if (action !== "apply" && action !== "whatsapp" && action !== "hire") return null;
      return {
        jobId: r.job_id,
        action,
        contactedAt: r.created_at,
        job,
      };
    })
    .filter((x): x is FeedContactActivity => x != null);
}

export async function listRecruiterOwnListings(userId: string, limit = 20): Promise<JobFeedApiJob[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("jobs")
    .select(JOB_FEED_COLUMNS)
    .eq("recruiter_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as JobFeedRow[];
  const user = await getUserById(userId);
  const rec = {
    phone: user?.phone ?? "",
    name: user?.name ?? null,
    subscription_plan: user?.subscription_plan ?? "free",
  };
  return rows.map((row) => mapJobToFeedApi(row, rec));
}

export async function buildFeedLimits(userId: string): Promise<FeedLimitsPayload> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const plan = normalizePlan(user.subscription_plan ?? undefined);
  const usedContacts = await countUserFeedContacts(userId);
  const workerFree = await hasWorkerProfile(userId);
  const maxContacts = workerFree ? 999_999 : 0;
  const contactedJobIds = await listUserContactedJobIds(userId);

  let wallet: FeedLimitsPayload["wallet"];
  const { count: rpCount, error: rpErr } = await supabaseAdmin()
    .from("recruiter_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (rpErr) throw rpErr;
  if ((rpCount ?? 0) > 0) {
    const balancePaise = await getWalletBalancePaise(userId);
    wallet = {
      balanceInr: paiseToInr(balancePaise),
      unlockCostInr: paiseToInr(PRICE_WORKER_UNLOCK_PAISE),
    };
  }

  return {
    plan,
    feedContacts: {
      used: usedContacts,
      max: maxContacts,
      remaining: workerFree ? 999_999 : 0,
    },
    jobListings: null,
    contactedJobIds,
    wallet,
  };
}
