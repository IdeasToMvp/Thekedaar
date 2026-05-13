import { supabaseAdmin } from "./supabase.service";

export type UserRole = "worker" | "recruiter";

export type UserRow = {
  id: string;
  phone: string;
  role: UserRole;
  name: string | null;
  city: string | null;
  hiring_enabled: boolean;
  seeking_enabled: boolean;
};

export type WorkerProfileRow = {
  user_id: string;
  job_type: string | null;
  experience_years: number | null;
  expected_salary: number | null;
  availability: string | null;
};

export async function upsertUserByPhone(input: {
  phone: string;
  role: UserRole;
  name?: string | null;
  city?: string | null;
  enableHiring?: boolean;
  enableSeeking?: boolean;
}) {
  const sb = supabaseAdmin();
  const existing = await getUserByPhone(input.phone);

  let hiring = existing?.hiring_enabled ?? false;
  let seeking = existing?.seeking_enabled ?? false;
  if (input.enableHiring) hiring = true;
  if (input.enableSeeking) seeking = true;

  if (!existing) {
    hiring = !!input.enableHiring;
    seeking = !!input.enableSeeking;
  }

  if (!hiring && !seeking) {
    if (input.role === "recruiter") hiring = true;
    else seeking = true;
  }

  const { data, error } = await sb
    .from("users")
    .upsert(
      {
        phone: input.phone,
        role: input.role,
        name: input.name ?? existing?.name ?? null,
        city: input.city ?? existing?.city ?? null,
        hiring_enabled: hiring,
        seeking_enabled: seeking,
      },
      { onConflict: "phone" },
    )
    .select("id,phone,role,name,city,hiring_enabled,seeking_enabled")
    .single();

  if (error) throw error;
  return data as UserRow;
}

export async function getUserByPhone(phone: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("users").select("*").eq("phone", phone).maybeSingle();
  if (error) throw error;
  return data as UserRow | null;
}

export async function getUserById(id: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as UserRow | null;
}

export async function getUserWithWorkerProfile(userId: string) {
  const sb = supabaseAdmin();
  const { data: user, error: uErr } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
  if (uErr) throw uErr;
  if (!user) return null;

  const { data: wp, error: wErr } = await sb.from("worker_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (wErr) throw wErr;

  return { user: user as UserRow, worker_profile: (wp as WorkerProfileRow | null) ?? null };
}

export async function updateUserProfile(input: {
  userId: string;
  name?: string | null;
  city?: string | null;
  hiring_enabled?: boolean;
  seeking_enabled?: boolean;
  worker?: {
    job_type?: string | null;
    experience_years?: number | null;
    expected_salary?: number | null;
    availability?: string | null;
  };
}) {
  const sb = supabaseAdmin();

  const existing = await getUserById(input.userId);
  if (!existing) throw new Error("User not found");

  const hiring = input.hiring_enabled ?? existing.hiring_enabled;
  const seeking = input.seeking_enabled ?? existing.seeking_enabled;
  if (!hiring && !seeking) {
    throw new Error("Choose at least one: hiring or looking for work");
  }

  const role: UserRole = hiring && !seeking ? "recruiter" : seeking && !hiring ? "worker" : existing.role;

  const { data: wpRow, error: wpReadErr } = await sb
    .from("worker_profiles")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (wpReadErr) throw wpReadErr;
  const prevWp = (wpRow as WorkerProfileRow | null) ?? null;

  const { error: uErr } = await sb
    .from("users")
    .update({
      name: input.name !== undefined ? input.name : existing.name,
      city: input.city !== undefined ? input.city : existing.city,
      hiring_enabled: hiring,
      seeking_enabled: seeking,
      role,
    })
    .eq("id", input.userId)
    .select("*")
    .single();
  if (uErr) throw uErr;

  if (input.worker !== undefined && seeking) {
    const { error: wErr } = await sb.from("worker_profiles").upsert(
      {
        user_id: input.userId,
        job_type: input.worker.job_type !== undefined ? input.worker.job_type : prevWp?.job_type ?? null,
        experience_years:
          input.worker.experience_years !== undefined
            ? input.worker.experience_years
            : prevWp?.experience_years ?? null,
        expected_salary:
          input.worker.expected_salary !== undefined ? input.worker.expected_salary : prevWp?.expected_salary ?? null,
        availability:
          input.worker.availability !== undefined ? input.worker.availability : prevWp?.availability ?? null,
      },
      { onConflict: "user_id" },
    );
    if (wErr) throw wErr;
  }

  return getUserWithWorkerProfile(input.userId);
}
