import { normalizeText } from "../utils/messageParser";
import { supabaseAdmin } from "./supabase.service";
import { setConversationState } from "./conversation.service";
import { getUserById, getUserByPhone, getUserCapabilities } from "./user.service";
import {
  getJobById,
  mapJobToFeedApi,
  type JobFeedApiJob,
  type JobFeedRow,
} from "./jobs.service";
import { sendWhatsAppText } from "./whatsapp.service";
import { type ContactParty, fetchJobWorkAddress, formatContactBlock } from "../utils/contactDetails";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type WorkerApplicationSummary = {
  worker: {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    sector: string | null;
    skills: string[];
    age: number | null;
    experienceYears: number | null;
    availability: string | null;
    fullAddress?: string | null;
  };
};

export type JobApplicationApi = {
  id: string;
  jobId: string;
  workerId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  job: JobFeedApiJob;
  worker?: WorkerApplicationSummary["worker"];
  /** Only when status is approved and viewer is the worker */
  employerContact?: ContactParty;
};

function frontendBaseUrl(): string {
  return (process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function waPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  return d.length >= 10 ? d : "";
}

function withoutEmployerContact(job: JobFeedApiJob): JobFeedApiJob {
  const { contactWaDigits: _wa, ...rest } = job;
  return rest;
}

export function parseApplicationDecision(text: string): "approved" | "rejected" | null {
  const t = normalizeText(text);
  if (["1", "approve", "approved", "accept", "yes", "haan", "han"].includes(t)) return "approved";
  if (["0", "decline", "declined", "reject", "rejected", "no", "nahi", "nahin"].includes(t)) return "rejected";
  return null;
}

async function recruiterFromWhatsAppPhone(phone: string) {
  const direct = await getUserByPhone(phone);
  if (direct) return direct;
  const digits = phone.replace(/\D/g, "");
  if (digits !== phone) return getUserByPhone(digits);
  return null;
}

async function findPendingApplicationForRecruiter(
  recruiterId: string,
  applicationId?: string,
): Promise<{ id: string; job_id: string; worker_id: string; status: string } | null> {
  const sb = supabaseAdmin();
  if (applicationId) {
    const { data, error } = await sb
      .from("job_applications")
      .select("id, job_id, worker_id, status")
      .eq("id", applicationId)
      .eq("status", "pending")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as { id: string; job_id: string; worker_id: string; status: string };
    const job = await getJobById(row.job_id);
    if (!job || job.recruiter_id !== recruiterId) return null;
    return row;
  }

  const { data: myJobs, error: jErr } = await sb.from("jobs").select("id").eq("recruiter_id", recruiterId);
  if (jErr) throw jErr;
  const jobIds = (myJobs ?? []).map((j) => (j as { id: string }).id);
  if (jobIds.length === 0) return null;

  const { data, error } = await sb
    .from("job_applications")
    .select("id, job_id, worker_id, status")
    .in("job_id", jobIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as { id: string; job_id: string; worker_id: string; status: string } | null) ?? null;
}

/** Returns true if the message was handled as an application approve/decline. */
export async function handleApplicationReplyFromWhatsApp(phone: string, text: string): Promise<boolean> {
  const decision = parseApplicationDecision(text);
  if (!decision) return false;

  const recruiter = await recruiterFromWhatsAppPhone(phone);
  if (!recruiter) return false;

  const caps = await getUserCapabilities(recruiter.id);
  if (!caps.can_hire) return false;

  const sb = supabaseAdmin();
  const { data: stateRow } = await sb
    .from("conversation_states")
    .select("current_step, metadata")
    .eq("phone", phone)
    .maybeSingle();

  const step = (stateRow as { current_step?: string } | null)?.current_step;
  const meta = ((stateRow as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}) as Record<
    string,
    unknown
  >;
  const pendingId =
    typeof meta.pendingApplicationId === "string" ? meta.pendingApplicationId : undefined;

  const inReview = step === "APPLICATION_REVIEW" || Boolean(pendingId);
  const explicit = ["approve", "approved", "decline", "declined", "reject", "rejected", "accept"].includes(
    normalizeText(text),
  );
  if (!inReview && !explicit && !["1", "0"].includes(normalizeText(text))) {
    return false;
  }

  const pending = await findPendingApplicationForRecruiter(recruiter.id, pendingId);
  if (!pending) {
    await sendWhatsAppText(
      phone,
      "No pending application to review. Open Applications on Thekedaar or wait for a new apply.",
    );
    return true;
  }

  try {
    const application = await updateApplicationStatus({
      applicationId: pending.id,
      recruiterId: recruiter.id,
      status: decision,
    });
    const jobTitle = application.job.title || "your listing";
    const workerName = application.worker?.name || "the worker";
    if (decision === "approved") {
      await sendWhatsAppText(
        phone,
        `Approved — ${workerName} for *${jobTitle}*.\n\nContact details sent on WhatsApp and in the app.`,
      );
    } else {
      await sendWhatsAppText(phone, `Declined — application for *${jobTitle}*.`);
    }
    const next = await findPendingApplicationForRecruiter(recruiter.id);
    await setConversationState(
      phone,
      "APPLICATION_REVIEW",
      next ? { role: "recruiter", pendingApplicationId: next.id } : { role: "recruiter" },
      { current_flow: "idle", current_mode: "recruiter", last_intent: "application_decision" },
    );
    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not update application";
    await sendWhatsAppText(phone, msg);
    return true;
  }
}

type RecruiterRecord = ContactParty & { id: string; subscription_plan?: string | null };

async function fetchRecruiter(recruiterId: string): Promise<RecruiterRecord | null> {
  const u = await getUserById(recruiterId);
  if (!u) return null;
  return {
    id: u.id,
    phone: u.phone,
    name: u.name?.trim() || `Employer ${u.phone.slice(-4)}`,
    city: u.city,
    sector: u.sector,
    fullAddress: u.full_address ?? null,
    subscription_plan: u.subscription_plan ?? null,
  };
}

function recruiterForJobApi(rec: RecruiterRecord | null) {
  return rec
    ? { phone: rec.phone, name: rec.name, subscription_plan: rec.subscription_plan }
    : { phone: "", name: null, subscription_plan: "free" };
}

function recruiterToContact(rec: ContactParty & { id: string }, workAddress?: string | null): ContactParty {
  return {
    name: rec.name,
    phone: rec.phone,
    city: rec.city,
    sector: rec.sector,
    fullAddress: rec.fullAddress,
    workAddress: workAddress ?? null,
  };
}

async function fetchWorkerProfile(workerId: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("worker_profiles")
    .select(
      "user_id, role, skills, age, experience_years, availability, users!inner(id, name, city, sector, phone, full_address)",
    )
    .eq("user_id", workerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const users = data.users as
    | { id: string; name: string | null; city: string | null; sector: string | null; phone: string; full_address: string | null }
    | { id: string; name: string | null; city: string | null; sector: string | null; phone: string; full_address: string | null }[];
  const u = Array.isArray(users) ? users[0] : users;
  const skills = (data.skills as string[] | null)?.length
    ? (data.skills as string[])
    : data.role
      ? [String(data.role)]
      : [];
  return {
    id: u.id,
    name: u.name?.trim() || `Worker ${u.phone.slice(-4)}`,
    phone: u.phone,
    city: u.city,
    sector: u.sector,
    skills,
    age: data.age as number | null,
    experienceYears: data.experience_years as number | null,
    availability: (data.availability as string | null) ?? null,
    fullAddress: (u as { full_address?: string | null }).full_address ?? null,
  };
}

async function notifyApplicationApprovedWhatsApp(input: {
  jobId: string;
  jobTitle: string;
  recruiter: ContactParty & { id: string };
  worker: NonNullable<Awaited<ReturnType<typeof fetchWorkerProfile>>>;
}) {
  const workAddress = await fetchJobWorkAddress(input.jobId);
  const employerContact = recruiterToContact(input.recruiter, workAddress);
  const workerContact: ContactParty = {
    name: input.worker.name,
    phone: input.worker.phone,
    city: input.worker.city,
    sector: input.worker.sector,
    fullAddress: input.worker.fullAddress,
  };

  const workerPhone = waPhone(input.worker.phone);
  if (workerPhone) {
    const body =
      `Application approved — Thekedaar\n\n` +
      `Your application for *${input.jobTitle}* was approved.\n\n` +
      formatContactBlock(employerContact, "Employer contact");
    try {
      await sendWhatsAppText(workerPhone, body);
    } catch {
      /* non-blocking */
    }
  }

  const recruiterPhone = waPhone(input.recruiter.phone);
  if (recruiterPhone) {
    const body =
      `Application approved — Thekedaar\n\n` +
      `You approved *${input.worker.name}* for *${input.jobTitle}*.\n\n` +
      formatContactBlock(workerContact, "Worker contact");
    try {
      await sendWhatsAppText(recruiterPhone, body);
    } catch {
      /* non-blocking */
    }
  }
}

async function jobRowToApi(job: JobFeedRow, recruiterId: string): Promise<JobFeedApiJob> {
  const rec = await fetchRecruiter(recruiterId);
  return mapJobToFeedApi(
    job,
    recruiterForJobApi(rec),
  );
}

export async function getWorkerApplicationMap(
  workerId: string,
): Promise<Record<string, ApplicationStatus>> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("job_applications")
    .select("job_id, status")
    .eq("worker_id", workerId);
  if (error) throw error;
  const map: Record<string, ApplicationStatus> = {};
  for (const row of data ?? []) {
    const r = row as { job_id: string; status: string };
    if (r.status === "pending" || r.status === "approved" || r.status === "rejected") {
      map[r.job_id] = r.status;
    }
  }
  return map;
}

export async function submitJobApplication(input: {
  workerId: string;
  jobId: string;
}): Promise<{ application: JobApplicationApi; created: boolean }> {
  const job = await getJobById(input.jobId);
  if (!job) throw new Error("Job not found");
  if (job.recruiter_id === input.workerId) {
    throw new Error("You cannot apply to your own listing");
  }

  const worker = await fetchWorkerProfile(input.workerId);
  if (!worker) {
    throw new Error("Complete your worker profile before applying");
  }

  const sb = supabaseAdmin();
  const { data: existing, error: exErr } = await sb
    .from("job_applications")
    .select("id, status, created_at, updated_at")
    .eq("worker_id", input.workerId)
    .eq("job_id", input.jobId)
    .maybeSingle();
  if (exErr) throw exErr;

  let applicationId: string;
  let status: ApplicationStatus;
  let appliedAt: string;
  let updatedAt: string;
  let created = false;

  if (existing) {
    const ex = existing as { id: string; status: string; created_at: string; updated_at: string };
    applicationId = ex.id;
    status = ex.status as ApplicationStatus;
    appliedAt = ex.created_at;
    updatedAt = ex.updated_at;
  } else {
    const { data: inserted, error: insErr } = await sb
      .from("job_applications")
      .insert({
        job_id: input.jobId,
        worker_id: input.workerId,
        status: "pending",
      })
      .select("id, status, created_at, updated_at")
      .single();
    if (insErr) throw insErr;
    const row = inserted as { id: string; status: string; created_at: string; updated_at: string };
    applicationId = row.id;
    status = row.status as ApplicationStatus;
    appliedAt = row.created_at;
    updatedAt = row.updated_at;
    created = true;

    const recruiter = await fetchRecruiter(job.recruiter_id);
    if (recruiter) {
      const recPhone = waPhone(recruiter.phone);
      if (recPhone) {
        const link = `${frontendBaseUrl()}/feed/applications`;
        const body =
          `New application on Thekedaar\n\n` +
          `${worker.name} applied for *${job.title}* (${job.city || "Gurugram"}).\n` +
          `Skills: ${worker.skills.join(", ") || "—"}\n` +
          `Experience: ${worker.experienceYears ?? 0} yrs\n\n` +
          `Reply *1* or *approve* to approve\n` +
          `Reply *0* or *decline* to decline\n\n` +
          `Or review on web: ${link}`;
        try {
          await sendWhatsAppText(recPhone, body);
          await setConversationState(
            recPhone,
            "APPLICATION_REVIEW",
            { role: "recruiter", pendingApplicationId: applicationId },
            { current_flow: "idle", current_mode: "recruiter", last_intent: "application_pending" },
          );
        } catch {
          /* non-blocking */
        }
      }
    }
  }

  const jobApi = await jobRowToApi(job, job.recruiter_id);
  const application: JobApplicationApi = {
    id: applicationId,
    jobId: input.jobId,
    workerId: input.workerId,
    status,
    appliedAt,
    updatedAt,
    job: withoutEmployerContact(jobApi),
  };

  return { application, created };
}

export async function listWorkerApplications(workerId: string): Promise<JobApplicationApi[]> {
  const sb = supabaseAdmin();
  const { data: apps, error } = await sb
    .from("job_applications")
    .select("id, job_id, worker_id, status, created_at, updated_at")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = (apps ?? []) as {
    id: string;
    job_id: string;
    worker_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  }[];
  if (rows.length === 0) return [];

  const jobIds = [...new Set(rows.map((r) => r.job_id))];
  const { data: jobs, error: jErr } = await sb
    .from("jobs")
    .select(
      "id,recruiter_id,title,city,sector,salary,timing,accommodation,urgency,category,description,min_age,max_age,preferred_gender,required_documents,experience_years_required,created_at",
    )
    .in("id", jobIds);
  if (jErr) throw jErr;

  const jobMap = new Map<string, JobFeedRow>();
  for (const j of (jobs ?? []) as JobFeedRow[]) {
    jobMap.set(j.id, j);
  }

  const recruiterIds = [...new Set((jobs ?? []).map((j) => (j as JobFeedRow).recruiter_id))];
  const recruiterMap = new Map<string, Awaited<ReturnType<typeof fetchRecruiter>>>();
  for (const rid of recruiterIds) {
    recruiterMap.set(rid, await fetchRecruiter(rid));
  }

  const workAddressByJobId = new Map<string, string | null>();
  const approvedJobIds = [...new Set(rows.filter((r) => r.status === "approved").map((r) => r.job_id))];
  for (const jobId of approvedJobIds) {
    workAddressByJobId.set(jobId, await fetchJobWorkAddress(jobId));
  }

  const result: JobApplicationApi[] = [];
  for (const r of rows) {
    const jobRow = jobMap.get(r.job_id);
    if (!jobRow) continue;
    const rec = recruiterMap.get(jobRow.recruiter_id);
    const jobApi = mapJobToFeedApi(jobRow, recruiterForJobApi(rec), workerId);
    const status = r.status as ApplicationStatus;
    const item: JobApplicationApi = {
      id: r.id,
      jobId: r.job_id,
      workerId: r.worker_id,
      status,
      appliedAt: r.created_at,
      updatedAt: r.updated_at,
      job: withoutEmployerContact(jobApi),
    };
    if (status === "approved" && rec) {
      const workAddress = workAddressByJobId.get(r.job_id) ?? null;
      item.employerContact = recruiterToContact(rec, workAddress);
      item.job = {
        ...item.job,
        contactWaDigits: rec.phone.replace(/\D/g, ""),
        employerDisplayName: rec.name?.trim() || item.job.employerDisplayName,
      };
    }
    result.push(item);
  }
  return result;
}

export async function listIncomingApplications(recruiterId: string): Promise<JobApplicationApi[]> {
  const sb = supabaseAdmin();
  const { data: myJobs, error: jErr } = await sb.from("jobs").select("id").eq("recruiter_id", recruiterId);
  if (jErr) throw jErr;
  const jobIds = (myJobs ?? []).map((j) => (j as { id: string }).id);
  if (jobIds.length === 0) return [];

  const { data: apps, error } = await sb
    .from("job_applications")
    .select("id, job_id, worker_id, status, created_at, updated_at")
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = (apps ?? []) as {
    id: string;
    job_id: string;
    worker_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  }[];

  const uniqueJobIds = [...new Set(rows.map((r) => r.job_id))];
  const { data: jobs, error: jobsErr } = await sb
    .from("jobs")
    .select(
      "id,recruiter_id,title,city,sector,salary,timing,accommodation,urgency,category,description,min_age,max_age,preferred_gender,required_documents,experience_years_required,created_at",
    )
    .in("id", uniqueJobIds);
  if (jobsErr) throw jobsErr;

  const jobMap = new Map<string, JobFeedRow>();
  for (const j of (jobs ?? []) as JobFeedRow[]) {
    jobMap.set(j.id, j);
  }

  const rec = await fetchRecruiter(recruiterId);

  const result: JobApplicationApi[] = [];
  for (const r of rows) {
    const jobRow = jobMap.get(r.job_id);
    if (!jobRow) continue;
    const worker = await fetchWorkerProfile(r.worker_id);
    if (!worker) continue;
    const jobApi = mapJobToFeedApi(
      jobRow,
      recruiterForJobApi(rec),
      recruiterId,
    );
    const approved = r.status === "approved";
    result.push({
      id: r.id,
      jobId: r.job_id,
      workerId: r.worker_id,
      status: r.status as ApplicationStatus,
      appliedAt: r.created_at,
      updatedAt: r.updated_at,
      job: jobApi,
      worker: {
        id: worker.id,
        name: worker.name,
        phone: approved ? worker.phone : "",
        city: worker.city,
        sector: worker.sector,
        skills: worker.skills,
        age: worker.age,
        experienceYears: worker.experienceYears,
        availability: worker.availability,
        fullAddress: approved ? worker.fullAddress : undefined,
      },
    });
  }
  return result;
}

export async function updateApplicationStatus(input: {
  applicationId: string;
  recruiterId: string;
  status: "approved" | "rejected";
}): Promise<JobApplicationApi> {
  const sb = supabaseAdmin();

  const { data: app, error: aErr } = await sb
    .from("job_applications")
    .select("id, job_id, worker_id, status, created_at, updated_at")
    .eq("id", input.applicationId)
    .maybeSingle();
  if (aErr) throw aErr;
  if (!app) throw new Error("Application not found");

  const row = app as {
    id: string;
    job_id: string;
    worker_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };

  const job = await getJobById(row.job_id);
  if (!job) throw new Error("Job not found");
  if (job.recruiter_id !== input.recruiterId) {
    throw new Error("You can only manage applications for your own listings");
  }

  const { data: updated, error: uErr } = await sb
    .from("job_applications")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.applicationId)
    .select("id, job_id, worker_id, status, created_at, updated_at")
    .single();
  if (uErr) throw uErr;

  const up = updated as typeof row;
  const worker = await fetchWorkerProfile(up.worker_id);
  const recruiter = await fetchRecruiter(job.recruiter_id);

  if (input.status === "approved" && worker && recruiter) {
    try {
      await notifyApplicationApprovedWhatsApp({
        jobId: job.id,
        jobTitle: job.title,
        recruiter,
        worker,
      });
    } catch {
      /* non-blocking */
    }
  }

  const jobApi = mapJobToFeedApi(job, recruiterForJobApi(recruiter), input.recruiterId);

  return {
    id: up.id,
    jobId: up.job_id,
    workerId: up.worker_id,
    status: up.status as ApplicationStatus,
    appliedAt: up.created_at,
    updatedAt: up.updated_at,
    job: jobApi,
    worker: worker
      ? {
          id: worker.id,
          name: worker.name,
          phone: input.status === "approved" ? worker.phone : "",
          city: worker.city,
          sector: worker.sector,
          skills: worker.skills,
          age: worker.age,
          experienceYears: worker.experienceYears,
          availability: worker.availability,
          fullAddress: input.status === "approved" ? worker.fullAddress : undefined,
        }
      : undefined,
    employerContact:
      input.status === "approved" && recruiter
        ? recruiterToContact(recruiter, await fetchJobWorkAddress(job.id))
        : undefined,
  };
}
