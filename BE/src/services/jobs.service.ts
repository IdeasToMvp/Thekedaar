import { supabaseAdmin } from "./supabase.service";

export async function createJob(input: {
  recruiterId: string;
  title: string;
  city?: string | null;
  salary?: number | null;
  timing?: string | null;
  accommodation?: boolean | null;
  urgency?: string | null;
}) {
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
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function findJobsForWorker(input: { city?: string | null; jobType?: string | null }) {
  const sb = supabaseAdmin();
  let q = sb.from("jobs").select("id,title,city,salary,timing,accommodation,created_at").order("created_at", { ascending: false }).limit(5);

  if (input.city) q = q.eq("city", input.city);
  if (input.jobType) q = q.ilike("title", `%${input.jobType}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as any[];
}

