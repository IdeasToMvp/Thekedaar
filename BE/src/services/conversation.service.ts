import { supabaseAdmin } from "./supabase.service";

export type ConversationStep =
  | "START"
  | "CHOOSE_ROLE"
  | "WORKER_NAME"
  | "WORKER_AGE"
  | "WORKER_GENDER"
  | "WORKER_AADHAAR"
  | "WORKER_CITY"
  | "WORKER_SECTOR"
  | "WORKER_FULL_ADDRESS"
  | "WORKER_SKILLS"
  | "WORKER_SKILL_OTHER"
  | "WORKER_SHIFT_PREFERENCE"
  | "WORKER_SHIFT_CUSTOM"
  | "WORKER_EXPECTED_SALARY"
  | "WORKER_EXPERIENCE"
  | "WORKER_AVAILABILITY"
  | "WORKER_AVAILABILITY_CUSTOM"
  | "RECRUITER_JOB_CATEGORY"
  | "RECRUITER_JOB_CATEGORY_OTHER"
  | "RECRUITER_CITY"
  | "RECRUITER_SECTOR"
  | "RECRUITER_FULL_ADDRESS"
  | "RECRUITER_SALARY"
  | "RECRUITER_ACCOMMODATION"
  | "RECRUITER_MIN_AGE"
  | "RECRUITER_MAX_AGE"
  | "RECRUITER_PREFERRED_GENDER"
  | "RECRUITER_AADHAAR_REQUIRED"
  | "RECRUITER_MEAL_FREQUENCY"
  | "RECRUITER_WORK_SHIFT"
  | "RECRUITER_WORK_SHIFT_CUSTOM"
  | "RECRUITER_TIMING"
  | "RECRUITER_URGENCY"
  | "APPLICATION_REVIEW"
  | "ACCOUNT_PAUSED_CHOICE"
  | "ACCOUNT_DELETED_CHOICE"
  | "ACCOUNT_ROLE_LOCKED_CHOICE"
  | "DONE";

export type ConversationFlow =
  | "idle"
  | "worker_onboarding"
  | "recruiter_onboarding"
  | "job_search"
  | "hiring_flow";

export type ConversationState = {
  phone: string;
  current_step: ConversationStep;
  metadata: Record<string, unknown>;
  current_flow: ConversationFlow;
  current_mode: string | null;
  last_intent: string | null;
};

function inferContext(
  step: ConversationStep,
  metadata: Record<string, unknown>,
): { current_flow: ConversationFlow; current_mode: string | null } {
  const role = typeof metadata.role === "string" ? metadata.role : null;
  if (step.startsWith("WORKER_")) {
    return { current_flow: "worker_onboarding", current_mode: role ?? "worker" };
  }
  if (step.startsWith("RECRUITER_")) {
    return { current_flow: "recruiter_onboarding", current_mode: role ?? "recruiter" };
  }
  if (step === "CHOOSE_ROLE") return { current_flow: "idle", current_mode: null };
  if (step === "APPLICATION_REVIEW") return { current_flow: "idle", current_mode: role ?? "recruiter" };
  return { current_flow: "idle", current_mode: role };
}

function rowToState(phone: string, row: Record<string, unknown> | null): ConversationState {
  if (!row) {
    return {
      phone,
      current_step: "START",
      metadata: {},
      current_flow: "idle",
      current_mode: null,
      last_intent: null,
    };
  }
  return {
    phone: (row.phone as string) ?? phone,
    current_step: (row.current_step ?? "START") as ConversationStep,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    current_flow: (row.current_flow as ConversationFlow) ?? "idle",
    current_mode: (row.current_mode as string | null) ?? null,
    last_intent: (row.last_intent as string | null) ?? null,
  };
}

export async function getConversationState(phone: string): Promise<ConversationState> {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("conversation_states")
    .select("phone,current_step,metadata,current_flow,current_mode,last_intent")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;
  return rowToState(phone, data as Record<string, unknown> | null);
}

export async function setConversationState(
  phone: string,
  step: ConversationStep,
  metadata: Record<string, unknown>,
  context?: { current_flow?: ConversationFlow; current_mode?: string | null; last_intent?: string | null },
) {
  const sb = supabaseAdmin();
  const inferred = inferContext(step, metadata);
  const current_flow = context?.current_flow ?? inferred.current_flow;
  const current_mode = context?.current_mode !== undefined ? context.current_mode : inferred.current_mode;

  let last_intent: string | null;
  if (context && "last_intent" in context) {
    last_intent = context.last_intent ?? null;
  } else {
    const prev = await getConversationState(phone);
    last_intent = prev.last_intent;
  }

  const payload: Record<string, unknown> = {
    phone,
    current_step: step,
    metadata,
    current_flow,
    current_mode,
    last_intent,
  };

  const { error } = await sb.from("conversation_states").upsert(payload, { onConflict: "phone" });
  if (error) throw error;
}

export async function clearConversationState(phone: string) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("conversation_states").delete().eq("phone", phone);
  if (error) throw error;
}
