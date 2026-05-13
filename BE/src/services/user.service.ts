import { supabaseAdmin } from "./supabase.service";

export type UserRole = "worker" | "recruiter";

export async function upsertUserByPhone(input: {
  phone: string;
  role: UserRole;
  name?: string | null;
  city?: string | null;
}) {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("users")
    .upsert(
      {
        phone: input.phone,
        role: input.role,
        name: input.name ?? null,
        city: input.city ?? null,
      },
      { onConflict: "phone" },
    )
    .select("id,phone,role,name,city")
    .single();

  if (error) throw error;
  return data as { id: string; phone: string; role: UserRole; name: string | null; city: string | null };
}

export async function getUserByPhone(phone: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("users").select("*").eq("phone", phone).maybeSingle();
  if (error) throw error;
  return data as any | null;
}

