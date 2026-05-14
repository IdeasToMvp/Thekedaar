import { supabaseAdmin } from "./supabase.service";

export async function upsertWorkerProfile(input: {
  userId: string;
  role?: string | null;
  experienceYears?: number | null;
  expectedSalary?: number | null;
  availability?: string | null;
}) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("worker_profiles").upsert(
    {
      user_id: input.userId,
      role: input.role ?? null,
      experience_years: input.experienceYears ?? null,
      expected_salary: input.expectedSalary ?? null,
      availability: input.availability ?? null,
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}
