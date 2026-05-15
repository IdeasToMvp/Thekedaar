import { supabaseAdmin } from "./supabase.service";
import { getUserById } from "./user.service";
import {
  maxFeedJobContacts,
  maxFreeTierJobListings,
  maxProTierListingsPerMonth,
  normalizePlan,
  type BillingPlan,
} from "../utils/planLimits";

export type JobFeedRow = {
  id: string;
  recruiter_id: string;
  title: string;
  city: string | null;
  salary: number | null;
  timing: string | null;
  accommodation: boolean | null;
  urgency: string | null;
  category: string | null;
  description: string | null;
  created_at: string;
};

export type JobFeedApiJob = {
  id: string;
  title: string;
  city: string;
  category: string;
  salaryPerMonth: number;
  postedAt: string;
  employerDisplayName: string;
  employerAvatarKey: string;
  description: string;
  urgency: "low" | "medium" | "high";
  posterSubscription: { plan: BillingPlan; features: Record<string, boolean> };
  contactWaDigits: string;
  isOwnListing?: boolean;
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
    category: job.category || "General",
    salaryPerMonth: job.salary ?? 0,
    postedAt: job.created_at,
    employerDisplayName: recruiter.name?.trim() || `Employer ${recruiter.phone.slice(-4)}`,
    employerAvatarKey: avatarKey(recruiter.name, recruiter.phone),
    description: job.description || `${job.title} in ${job.city || "your city"}.`,
    urgency: normalizeUrgency(job.urgency),
    posterSubscription: { plan, features: plan === "pro" ? { boosted_listing: true } : {} },
    contactWaDigits: waDigitsFromPhone(recruiter.phone),
    ...(viewerId && job.recruiter_id === viewerId ? { isOwnListing: true } : {}),
  };
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

export async function assertCanCreateJob(recruiterId: string): Promise<void> {
  const user = await getUserById(recruiterId);
  if (!user) throw new Error("User not found");
  const plan = normalizePlan(user.subscription_plan ?? undefined);
  const total = await countJobsForRecruiter(recruiterId);
  if (plan !== "pro") {
    if (total >= maxFreeTierJobListings()) {
      throw new Error(
        `Free plan allows up to ${maxFreeTierJobListings()} job listings. Upgrade to Pro for more.`,
      );
    }
  } else {
    const month = await countJobsThisCalendarMonth(recruiterId);
    if (month >= maxProTierListingsPerMonth()) {
      throw new Error(
        `Pro plan allows up to ${maxProTierListingsPerMonth()} new listings per calendar month.`,
      );
    }
  }
}

export async function createJob(input: {
  recruiterId: string;
  title: string;
  city?: string | null;
  salary?: number | null;
  timing?: string | null;
  accommodation?: boolean | null;
  urgency?: string | null;
  category?: string | null;
  description?: string | null;
}) {
  await assertCanCreateJob(input.recruiterId);
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("jobs")
    .insert({
      recruiter_id: input.recruiterId,
      title: input.title,
      city: input.city ?? null,
      salary: input.salary ?? null,
      timing: input.timing ?? null,
      accommodation: input.accommodation ?? null,
      urgency: input.urgency ?? null,
      category: input.category ?? null,
      description: input.description ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function findJobsForWorker(input: { city?: string | null; jobType?: string | null }) {
  const sb = supabaseAdmin();
  let q = sb
    .from("jobs")
    .select("id,title,city,salary,timing,accommodation,created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (input.city) q = q.eq("city", input.city);
  if (input.jobType) q = q.or(`title.ilike.%${input.jobType}%,category.ilike.%${input.jobType}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any[];
}

async function fetchRecruitersMap(recruiterIds: string[]): Promise<
  Map<string, { phone: string; name: string | null; subscription_plan: string | null }>
> {
  const map = new Map<string, { phone: string; name: string | null; subscription_plan: string | null }>();
  if (recruiterIds.length === 0) return map;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("users")
    .select("id,phone,name,subscription_plan")
    .in("id", recruiterIds);
  if (error) throw error;
  for (const row of data ?? []) {
    map.set(row.id as string, {
      phone: row.phone as string,
      name: (row.name as string | null) ?? null,
      subscription_plan: (row.subscription_plan as string | null) ?? null,
    });
  }
  return map;
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
  let q = sb.from("jobs").select(
    "id,recruiter_id,title,city,salary,timing,accommodation,urgency,category,description,created_at",
  );

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
  const rows = (data ?? []) as JobFeedRow[];
  const ids = [...new Set(rows.map((r) => r.recruiter_id))];
  const recruiters = await fetchRecruitersMap(ids);
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
    .select("id,recruiter_id,title,city,salary,timing,accommodation,urgency,category,description,created_at")
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
  const user = await getUserById(input.userId);
  if (!user) throw new Error("User not found");
  const plan = normalizePlan(user.subscription_plan ?? undefined);
  const max = maxFeedJobContacts(plan);

  const already = await hasUserContactedJob(input.userId, input.jobId);
  if (already) {
    const used = await countUserFeedContacts(input.userId);
    return { recorded: false, used, max };
  }

  const usedBefore = await countUserFeedContacts(input.userId);
  if (usedBefore >= max) {
    throw new Error(
      `Your ${plan} plan allows contacting up to ${max} different jobs. Upgrade to Pro for 50.`,
    );
  }

  const sb = supabaseAdmin();
  const { error } = await sb.from("job_feed_contacts").insert({
    user_id: input.userId,
    job_id: input.jobId,
    action: input.action,
  });
  if (error) throw error;
  const used = usedBefore + 1;
  return { recorded: true, used, max };
}

export type FeedLimitsPayload = {
  plan: BillingPlan;
  feedContacts: { used: number; max: number; remaining: number };
  jobListings: { used: number; max: number; scope: "lifetime" | "month" } | null;
  contactedJobIds: string[];
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
    .select("id,recruiter_id,title,city,salary,timing,accommodation,urgency,category,description,created_at")
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
    .select("id,recruiter_id,title,city,salary,timing,accommodation,urgency,category,description,created_at")
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
  const maxContacts = maxFeedJobContacts(plan);
  const contactedJobIds = await listUserContactedJobIds(userId);

  let jobListings: FeedLimitsPayload["jobListings"] = null;
  const sb = supabaseAdmin();
  const { count: rpCount, error: rpErr } = await sb
    .from("recruiter_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (rpErr) throw rpErr;
  const isRecruiter = (rpCount ?? 0) > 0;
  if (isRecruiter) {
    if (plan === "pro") {
      const monthUsed = await countJobsThisCalendarMonth(userId);
      jobListings = {
        used: monthUsed,
        max: maxProTierListingsPerMonth(),
        scope: "month",
      };
    } else {
      const total = await countJobsForRecruiter(userId);
      jobListings = {
        used: total,
        max: maxFreeTierJobListings(),
        scope: "lifetime",
      };
    }
  }

  return {
    plan,
    feedContacts: {
      used: usedContacts,
      max: maxContacts,
      remaining: Math.max(0, maxContacts - usedContacts),
    },
    jobListings,
    contactedJobIds,
  };
}
