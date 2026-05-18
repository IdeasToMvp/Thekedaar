import { supabaseAdmin } from "./supabase.service";

export type AppMode = "worker" | "recruiter";

export type AccountStatus = "active" | "paused" | "deleted" | "banned";

export type UserRow = {
  id: string;
  phone: string;
  name: string | null;
  city: string | null;
  sector: string | null;
  full_address?: string | null;
  current_mode: AppMode;
  subscription_plan?: string | null;
  account_status?: AccountStatus;
  paused_at?: string | null;
  deleted_at?: string | null;
};

export type WorkerProfileRow = {
  user_id: string;
  role: string | null;
  skills?: string[] | null;
  age: number | null;
  gender: string | null;
  has_aadhaar: boolean | null;
  experience_years: number | null;
  expected_salary: number | null;
  availability: string | null;
};

function normalizeSkills(skills: string[] | null | undefined, fallbackRole?: string | null): string[] {
  const fromSkills = (skills ?? []).map((s) => s.trim()).filter(Boolean);
  if (fromSkills.length > 0) return [...new Set(fromSkills)];
  const role = fallbackRole?.trim();
  return role ? [role] : [];
}

export type RecruiterProfileRow = {
  user_id: string;
  business_name: string | null;
  hiring_type: string | null;
  company_name: string | null;
};

/** Create or update identity by phone (no permanent “account type”). */
export async function upsertIdentityByPhone(input: {
  phone: string;
  name?: string | null;
  city?: string | null;
  sector?: string | null;
  fullAddress?: string | null;
  currentMode?: AppMode;
}) {
  const sb = supabaseAdmin();
  const existing = await getUserByPhone(input.phone);

  const { data, error } = await sb
    .from("users")
    .upsert(
      {
        phone: input.phone,
        name: input.name ?? existing?.name ?? null,
        city: input.city ?? existing?.city ?? null,
        sector: input.sector !== undefined ? input.sector : (existing?.sector ?? null),
        full_address: input.fullAddress !== undefined ? input.fullAddress : (existing?.full_address ?? null),
        current_mode: input.currentMode ?? existing?.current_mode ?? "worker",
      },
      { onConflict: "phone" },
    )
    .select("id,phone,name,city,sector,current_mode,subscription_plan")
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

export async function hasWorkerProfile(userId: string): Promise<boolean> {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("worker_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function hasRecruiterProfile(userId: string): Promise<boolean> {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("recruiter_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function getUserCapabilities(userId: string): Promise<{ can_seek: boolean; can_hire: boolean }> {
  const [can_seek, can_hire] = await Promise.all([hasWorkerProfile(userId), hasRecruiterProfile(userId)]);
  return { can_seek, can_hire };
}

export async function getUserWithProfiles(userId: string) {
  const sb = supabaseAdmin();
  const { data: user, error: uErr } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
  if (uErr) throw uErr;
  if (!user) return null;

  const { data: wp, error: wErr } = await sb.from("worker_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (wErr) throw wErr;

  const { data: rp, error: rErr } = await sb.from("recruiter_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (rErr) throw rErr;

  return {
    user: user as UserRow,
    worker_profile: (wp as WorkerProfileRow | null) ?? null,
    recruiter_profile: (rp as RecruiterProfileRow | null) ?? null,
  };
}

export async function updateUserProfile(input: {
  userId: string;
  name?: string | null;
  city?: string | null;
  sector?: string | null;
  current_mode?: AppMode;
  worker?: {
    role?: string | null;
    skills?: string[] | null;
    age?: number | null;
    gender?: string | null;
    has_aadhaar?: boolean | null;
    experience_years?: number | null;
    expected_salary?: number | null;
    availability?: string | null;
  };
  recruiter?: {
    business_name?: string | null;
    hiring_type?: string | null;
    company_name?: string | null;
  };
}) {
  const sb = supabaseAdmin();

  const existing = await getUserById(input.userId);
  if (!existing) throw new Error("User not found");

  const { error: uErr } = await sb
    .from("users")
    .update({
      name: input.name !== undefined ? input.name : existing.name,
      city: input.city !== undefined ? input.city : existing.city,
      sector: input.sector !== undefined ? input.sector : existing.sector,
      current_mode: input.current_mode ?? existing.current_mode,
    })
    .eq("id", input.userId);
  if (uErr) throw uErr;

  if (input.worker !== undefined) {
    const { data: wpRow, error: wpReadErr } = await sb
      .from("worker_profiles")
      .select("*")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (wpReadErr) throw wpReadErr;
    const prev = (wpRow as WorkerProfileRow | null) ?? null;
    const w = input.worker;
    const skills = normalizeSkills(
      w.skills !== undefined ? w.skills : prev?.skills,
      w.role !== undefined ? w.role : prev?.role,
    );
    const { error: wErr } = await sb.from("worker_profiles").upsert(
      {
        user_id: input.userId,
        role: skills[0] ?? null,
        skills,
        age: w.age !== undefined ? w.age : prev?.age ?? null,
        gender: w.gender !== undefined ? w.gender : prev?.gender ?? null,
        has_aadhaar: w.has_aadhaar !== undefined ? w.has_aadhaar : prev?.has_aadhaar ?? null,
        experience_years:
          w.experience_years !== undefined ? w.experience_years : prev?.experience_years ?? null,
        expected_salary: w.expected_salary !== undefined ? w.expected_salary : prev?.expected_salary ?? null,
        availability: w.availability !== undefined ? w.availability : prev?.availability ?? null,
      },
      { onConflict: "user_id" },
    );
    if (wErr) throw wErr;
  }

  if (input.recruiter !== undefined) {
    const { data: rpRow, error: rpReadErr } = await sb
      .from("recruiter_profiles")
      .select("*")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (rpReadErr) throw rpReadErr;
    const prev = (rpRow as RecruiterProfileRow | null) ?? null;
    const r = input.recruiter;
    const { error: rErr } = await sb.from("recruiter_profiles").upsert(
      {
        user_id: input.userId,
        business_name: r.business_name !== undefined ? r.business_name : prev?.business_name ?? null,
        hiring_type: r.hiring_type !== undefined ? r.hiring_type : prev?.hiring_type ?? null,
        company_name: r.company_name !== undefined ? r.company_name : prev?.company_name ?? null,
      },
      { onConflict: "user_id" },
    );
    if (rErr) throw rErr;
  }

  return getUserWithProfiles(input.userId);
}
