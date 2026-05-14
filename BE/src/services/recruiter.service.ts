import { supabaseAdmin } from "./supabase.service";

export type RecruiterProfileRow = {
  user_id: string;
  business_name: string | null;
  hiring_type: string | null;
  company_name: string | null;
};

export async function upsertRecruiterProfile(input: {
  userId: string;
  businessName?: string | null;
  hiringType?: string | null;
  companyName?: string | null;
}) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("recruiter_profiles").upsert(
    {
      user_id: input.userId,
      business_name: input.businessName ?? null,
      hiring_type: input.hiringType ?? null,
      company_name: input.companyName ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
