import { supabaseAdmin } from "./supabase.service";

export type WorkerFeedRow = {
  user_id: string;
  role: string | null;
  experience_years: number | null;
  expected_salary: number | null;
  availability: string | null;
  users: {
    id: string;
    name: string | null;
    city: string | null;
    phone: string;
    created_at: string;
  };
};

export type WorkerFeedApiWorker = {
  id: string;
  displayName: string;
  avatarKey: string;
  role: string;
  city: string;
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

type UsersJoin = WorkerFeedRow["users"] | WorkerFeedRow["users"][];

export function mapWorkerToFeedApi(row: WorkerFeedRow, viewerId?: string): WorkerFeedApiWorker {
  const raw = row.users as UsersJoin;
  const u = Array.isArray(raw) ? raw[0] : raw;
  if (!u) {
    throw new Error("Worker user row missing");
  }
  const phone = u.phone ?? "";
  return {
    id: u.id,
    displayName: u.name?.trim() || `Worker ${phone.slice(-4)}`,
    avatarKey: avatarKey(u.name, phone),
    role: row.role?.trim() || "General",
    city: u.city?.trim() || "",
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
  let q = sb.from("worker_profiles").select("user_id, users!inner(id)", { count: "exact", head: true });
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
  let q = sb.from("worker_profiles").select(
    "user_id, role, experience_years, expected_salary, availability, users!inner(id, name, city, phone, created_at)",
  );

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

  const rows = (data ?? []) as WorkerFeedRow[];
  return {
    workers: rows.map((row) => mapWorkerToFeedApi(row, input.viewerId)),
  };
}
