import { parseIncomingTextMessage, normalizeText } from "../utils/messageParser";
import { sendWhatsAppText } from "./whatsapp.service";
import {
  clearConversationState,
  getConversationState,
  setConversationState,
  type ConversationStep,
} from "./conversation.service";
import { upsertUserByPhone } from "./user.service";
import { upsertWorkerProfile } from "./worker.service";
import { createJob, findJobsForWorker } from "./jobs.service";
import { createMagicLinkForUser } from "./magicLink.service";

type FlowRole = "worker" | "recruiter";

function isHelpCommand(s: string): boolean {
  const t = normalizeText(s);
  return ["help", "menu", "options", "commands"].includes(t);
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(/[,₹\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function isBackCommand(s: string): boolean {
  const t = normalizeText(s);
  return ["back", "prev", "previous", "pichhe", "peeche", "पीछे"].includes(t);
}

function parseYesNo(s: string): boolean | null {
  const t = normalizeText(s);
  if (["yes", "y", "haan", "ha", "ok", "available"].includes(t)) return true;
  if (["no", "n", "nahi", "nahin"].includes(t)) return false;
  return null;
}

function isHi(s: string): boolean {
  const t = normalizeText(s);
  return ["hi", "hii", "hello", "hey", "start"].includes(t);
}

function roleChoiceFromText(s: string): "worker" | "recruiter" | null {
  const t = normalizeText(s);
  if (t === "1" || t.includes("job") || t.includes("work") || t.includes("naukri")) return "worker";
  if (t === "2" || t.includes("hire") || t.includes("hiring") || t.includes("employee") || t.includes("staff")) return "recruiter";
  return null;
}

function historyPush(meta: Record<string, unknown>, step: ConversationStep): Record<string, unknown> {
  const prev = Array.isArray((meta as any)._history) ? ((meta as any)._history as unknown[]) : [];
  return { ...meta, _history: [...prev, step] };
}

function historyPop(meta: Record<string, unknown>): { prevStep: ConversationStep | null; nextMeta: Record<string, unknown> } {
  const prev = Array.isArray((meta as any)._history) ? ((meta as any)._history as unknown[]) : [];
  const last = prev.length > 0 ? prev[prev.length - 1] : null;
  const trimmed = prev.length > 0 ? prev.slice(0, -1) : prev;
  return {
    prevStep: typeof last === "string" ? (last as ConversationStep) : null,
    nextMeta: { ...meta, _history: trimmed },
  };
}

function promptForStep(role: FlowRole, step: ConversationStep): string {
  if (step === "CHOOSE_ROLE") {
    return "Hi! Aap kya karna chahte ho?\n\n1) Looking for Job\n2) Hiring Employee\n\nReply 1 or 2\n\n(back = previous, reset = restart)";
  }

  if (role === "worker") {
    switch (step) {
      case "WORKER_NAME":
        return "Aapka naam? (Type 'back' to go previous step)";
      case "WORKER_CITY":
        return "City kahan hai? (e.g. Mumbai, Pune, Delhi)\n(Type 'back' to go previous step)";
      case "WORKER_JOB_TYPE":
        return "Kaunsa kaam chahiye? (e.g. Cook, Maid, Driver, Delivery)\n(Type 'back' to go previous step)";
      case "WORKER_EXPECTED_SALARY":
        return "Expected salary per month? (number only, e.g. 15000)\n(Type 'back' to go previous step)";
      case "WORKER_EXPERIENCE":
        return "Experience kitne years? (e.g. 2)\n(Type 'back' to go previous step)";
      case "WORKER_AVAILABILITY":
        return "Availability? (e.g. Immediate / 1 week / Weekend only)\n(Type 'back' to go previous step)";
      default:
        return "Send your reply. (Type 'back' to go previous step)";
    }
  }

  // recruiter
  switch (step) {
    case "RECRUITER_JOB_ROLE":
      return "Aapko kis role ke liye staff chahiye? (e.g. Cook, Maid, Driver)\n(Type 'back' to go previous step)";
    case "RECRUITER_CITY":
      return "Job city/location? (e.g. Mumbai)\n(Type 'back' to go previous step)";
    case "RECRUITER_SALARY":
      return "Salary per month? (number only, e.g. 18000)\n(Type 'back' to go previous step)";
    case "RECRUITER_ACCOMMODATION":
      return "Accommodation available? Reply yes/no\n(Type 'back' to go previous step)";
    case "RECRUITER_TIMING":
      return "Timing? (e.g. 9am-7pm)\n(Type 'back' to go previous step)";
    case "RECRUITER_URGENCY":
      return "Urgency? (Immediate / 1 week / Flexible)\n(Type 'back' to go previous step)";
    default:
      return "Send your reply. (Type 'back' to go previous step)";
  }
}

export async function handleIncomingWhatsAppMessage(payload: unknown) {
  const msg = parseIncomingTextMessage(payload);
  if (!msg) return;

  const phone = msg.from;
  const text = msg.text;
  const norm = normalizeText(text);

  if (isHelpCommand(text)) {
    await sendWhatsAppText(
      phone,
      "Commands:\n- back (previous question)\n- reset (start over)\n\nSend 'Hi' to start.",
    );
    return;
  }

  if (norm === "reset") {
    await clearConversationState(phone);
    await sendWhatsAppText(phone, "Reset done. Send 'Hi' to start again.");
    return;
  }

  const state = await getConversationState(phone);

  if (isBackCommand(text)) {
    // Move to previous step (best-effort) without losing already captured metadata
    if (state.current_step === "START") {
      await sendWhatsAppText(phone, "You are already at start. Send 'Hi' to begin.");
      return;
    }

    // If no history stored yet, just go back to START.
    const { prevStep, nextMeta } = historyPop(state.metadata);
    const stepToGo: ConversationStep = prevStep ?? "START";

    if (stepToGo === "START") {
      await clearConversationState(phone);
      await sendWhatsAppText(phone, "Okay. Send 'Hi' to start again.");
      return;
    }

    await setConversationState(phone, stepToGo, nextMeta);
    const role = (nextMeta.role as FlowRole | undefined) ?? "worker";
    await sendWhatsAppText(phone, promptForStep(role, stepToGo));
    return;
  }

  // Global entry
  if (state.current_step === "START") {
    if (isHi(text)) {
      await setConversationState(phone, "CHOOSE_ROLE", {});
      await sendWhatsAppText(
        phone,
        promptForStep("worker", "CHOOSE_ROLE"),
      );
      return;
    }

    await sendWhatsAppText(phone, "Send 'Hi' to start. (help = commands, reset = restart)");
    return;
  }

  if (state.current_step === "CHOOSE_ROLE") {
    const role = roleChoiceFromText(text);
    if (!role) {
      await sendWhatsAppText(phone, "Please reply 1 (Job) or 2 (Hiring).");
      return;
    }

    const nextStep: ConversationStep = role === "worker" ? "WORKER_NAME" : "RECRUITER_JOB_ROLE";
    await setConversationState(phone, nextStep, historyPush({ role }, "CHOOSE_ROLE"));

    await sendWhatsAppText(
      phone,
      promptForStep(role, nextStep),
    );
    return;
  }

  // WORKER FLOW
  if (state.metadata.role === "worker") {
    await handleWorkerFlow({ phone, text, step: state.current_step, metadata: state.metadata });
    return;
  }

  // RECRUITER FLOW
  if (state.metadata.role === "recruiter") {
    await handleRecruiterFlow({ phone, text, step: state.current_step, metadata: state.metadata });
    return;
  }

  // Fallback
  await clearConversationState(phone);
  await sendWhatsAppText(phone, "Something went wrong. Send 'Hi' to start again.");
}

async function handleWorkerFlow(input: {
  phone: string;
  text: string;
  step: ConversationStep;
  metadata: Record<string, unknown>;
}) {
  const { phone, text, step } = input;
  const meta = { ...input.metadata };

  if (step === "WORKER_NAME") {
    meta.name = text.trim();
    await setConversationState(phone, "WORKER_CITY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_CITY"));
    return;
  }

  if (step === "WORKER_CITY") {
    meta.city = text.trim();
    await setConversationState(phone, "WORKER_JOB_TYPE", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_JOB_TYPE"));
    return;
  }

  if (step === "WORKER_JOB_TYPE") {
    meta.jobType = text.trim();
    await setConversationState(phone, "WORKER_EXPECTED_SALARY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_EXPECTED_SALARY"));
    return;
  }

  if (step === "WORKER_EXPECTED_SALARY") {
    const n = parseNumber(text);
    if (n === null) {
      await sendWhatsAppText(phone, "Please send salary as a number (e.g. 15000).");
      return;
    }
    meta.expectedSalary = n;
    await setConversationState(phone, "WORKER_EXPERIENCE", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_EXPERIENCE"));
    return;
  }

  if (step === "WORKER_EXPERIENCE") {
    const n = parseNumber(text);
    if (n === null) {
      await sendWhatsAppText(phone, "Please send experience as a number (e.g. 2).");
      return;
    }
    meta.experienceYears = n;
    await setConversationState(phone, "WORKER_AVAILABILITY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_AVAILABILITY"));
    return;
  }

  if (step === "WORKER_AVAILABILITY") {
    meta.availability = text.trim();

    const user = await upsertUserByPhone({
      phone,
      role: "worker",
      name: String(meta.name ?? "").trim() || null,
      city: String(meta.city ?? "").trim() || null,
    });

    await upsertWorkerProfile({
      userId: user.id,
      jobType: String(meta.jobType ?? "").trim() || null,
      expectedSalary: typeof meta.expectedSalary === "number" ? meta.expectedSalary : null,
      experienceYears: typeof meta.experienceYears === "number" ? meta.experienceYears : null,
      availability: String(meta.availability ?? "").trim() || null,
    });

    // quick match (best-effort)
    const jobs = await findJobsForWorker({
      city: (meta.city as string | undefined) ?? null,
      jobType: (meta.jobType as string | undefined) ?? null,
    });

    await clearConversationState(phone);

    const webBase = process.env.WEB_BASE_URL;
    let loginLine = "";
    if (webBase) {
      const { token } = await createMagicLinkForUser({
        userId: user.id,
        phone: user.phone,
        role: "worker",
      });
      loginLine = `https://${webBase.replace(/^https?:\/\//, "").replace(/\/$/, "")}/login/${token}`;
    }

    const msgText =
      "Thanks! We’re finding matching jobs/profiles near you 🚀\n\n" +
      "Meanwhile, you can explore jobs and manage your profile here:\n\n" +
      (loginLine || "(link coming soon)") +
      "\n\nWe’ll also notify you directly on WhatsApp when new matches arrive.";

    await sendWhatsAppText(phone, msgText);
    return;
  }

  await clearConversationState(phone);
  await sendWhatsAppText(phone, "Send 'Hi' to start again.");
}

async function handleRecruiterFlow(input: {
  phone: string;
  text: string;
  step: ConversationStep;
  metadata: Record<string, unknown>;
}) {
  const { phone, text, step } = input;
  const meta = { ...input.metadata };

  if (step === "RECRUITER_JOB_ROLE") {
    meta.jobTitle = text.trim();
    await setConversationState(phone, "RECRUITER_CITY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_CITY"));
    return;
  }

  if (step === "RECRUITER_CITY") {
    meta.city = text.trim();
    await setConversationState(phone, "RECRUITER_SALARY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_SALARY"));
    return;
  }

  if (step === "RECRUITER_SALARY") {
    const n = parseNumber(text);
    if (n === null) {
      await sendWhatsAppText(phone, "Please send salary as a number (e.g. 18000).");
      return;
    }
    meta.salary = n;
    await setConversationState(phone, "RECRUITER_ACCOMMODATION", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_ACCOMMODATION"));
    return;
  }

  if (step === "RECRUITER_ACCOMMODATION") {
    const yn = parseYesNo(text);
    if (yn === null) {
      await sendWhatsAppText(phone, "Please reply yes or no (haan/nahi also ok).");
      return;
    }
    meta.accommodation = yn;
    await setConversationState(phone, "RECRUITER_TIMING", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_TIMING"));
    return;
  }

  if (step === "RECRUITER_TIMING") {
    meta.timing = text.trim();
    await setConversationState(phone, "RECRUITER_URGENCY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_URGENCY"));
    return;
  }

  if (step === "RECRUITER_URGENCY") {
    meta.urgency = text.trim();

    const recruiter = await upsertUserByPhone({
      phone,
      role: "recruiter",
      name: null,
      city: String(meta.city ?? "").trim() || null,
    });

    await createJob({
      recruiterId: recruiter.id,
      title: String(meta.jobTitle ?? "").trim() || "Job",
      city: String(meta.city ?? "").trim() || null,
      salary: typeof meta.salary === "number" ? meta.salary : null,
      timing: String(meta.timing ?? "").trim() || null,
      accommodation: typeof meta.accommodation === "boolean" ? meta.accommodation : null,
      urgency: String(meta.urgency ?? "").trim() || null,
    });

    await clearConversationState(phone);

    const webBase = process.env.WEB_BASE_URL;
    let loginLine = "";
    if (webBase) {
      const { token } = await createMagicLinkForUser({
        userId: recruiter.id,
        phone: recruiter.phone,
        role: "recruiter",
      });
      loginLine = `https://${webBase.replace(/^https?:\/\//, "").replace(/\/$/, "")}/login/${token}`;
    }

    const msgText =
      "Thanks! We’re finding matching candidates near you 🚀\n\n" +
      "Meanwhile, you can manage your job posting and candidates here:\n\n" +
      (loginLine || "(link coming soon)") +
      "\n\nWe’ll also notify you directly on WhatsApp when new matches arrive.";

    await sendWhatsAppText(phone, msgText);
    return;
  }

  await clearConversationState(phone);
  await sendWhatsAppText(phone, "Send 'Hi' to start again.");
}

