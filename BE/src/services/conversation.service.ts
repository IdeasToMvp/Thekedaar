import { supabaseAdmin } from "./supabase.service";

export type ConversationStep =
  | "START"
  | "CHOOSE_ROLE"
  | "WORKER_NAME"
  | "WORKER_CITY"
  | "WORKER_JOB_TYPE"
  | "WORKER_EXPECTED_SALARY"
  | "WORKER_EXPERIENCE"
  | "WORKER_AVAILABILITY"
  | "RECRUITER_JOB_ROLE"
  | "RECRUITER_CITY"
  | "RECRUITER_SALARY"
  | "RECRUITER_ACCOMMODATION"
  | "RECRUITER_TIMING"
  | "RECRUITER_URGENCY"
  | "DONE";

export type ConversationState = {
  phone: string;
  current_step: ConversationStep;
  metadata: Record<string, unknown>;
};

export async function getConversationState(phone: string): Promise<ConversationState> {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("conversation_states")
    .select("phone,current_step,metadata")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { phone, current_step: "START", metadata: {} };
  }

  return {
    phone: data.phone,
    current_step: (data.current_step ?? "START") as ConversationStep,
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
  };
}

export async function setConversationState(
  phone: string,
  step: ConversationStep,
  metadata: Record<string, unknown>,
) {
  const sb = supabaseAdmin();

  const { error } = await sb.from("conversation_states").upsert(
    {
      phone,
      current_step: step,
      metadata,
    },
    { onConflict: "phone" },
  );

  if (error) throw error;
}

export async function clearConversationState(phone: string) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("conversation_states").delete().eq("phone", phone);
  if (error) throw error;
}

