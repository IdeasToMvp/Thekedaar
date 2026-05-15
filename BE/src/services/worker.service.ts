import { supabaseAdmin } from "./supabase.service";

export async function upsertWorkerProfile(input: {
  userId: string;
  role?: string | null;
  skills?: string[] | null;
  experienceYears?: number | null;
  expectedSalary?: number | null;
  availability?: string | null;
}) {
  const sb = supabaseAdmin();
  const skills = (input.skills ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  const unique = [...new Set(skills.length > 0 ? skills : input.role?.trim() ? [input.role.trim()] : [])];
  const { error } = await sb.from("worker_profiles").upsert(
    {
      user_id: input.userId,
      role: unique[0] ?? input.role ?? null,
      skills: unique,
      experience_years: input.experienceYears ?? null,
      expected_salary: input.expectedSalary ?? null,
      availability: input.availability ?? null,
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}
