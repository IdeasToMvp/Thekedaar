import { parseIncomingTextMessage, normalizeText } from "../utils/messageParser";
import { sendWhatsAppText } from "./whatsapp.service";
import {
  clearConversationState,
  getConversationState,
  setConversationState,
  type ConversationStep,
} from "./conversation.service";
import { upsertIdentityByPhone } from "./user.service";
import { upsertWorkerProfile } from "./worker.service";
import { upsertRecruiterProfile } from "./recruiter.service";
import { createJob, findJobsForWorker } from "./jobs.service";
import { createMagicLinkForUser } from "./magicLink.service";
import {
  parseQuickCommand,
  detectHiringIntent,
  detectJobSeekingIntent,
} from "../utils/intentRouter";

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
  if (t === "2" || t.includes("hire") || t.includes("hiring") || t.includes("employee") || t.includes("staff"))
    return "recruiter";
  if (detectJobSeekingIntent(s)) return "worker";
  if (detectHiringIntent(s)) return "recruiter";
  return null;
}

function historyPush(meta: Record<string, unknown>, step: ConversationStep): Record<string, unknown> {
  const prev = Array.isArray((meta as { _history?: unknown })._history)
    ? ((meta as { _history: unknown[] })._history as unknown[])
    : [];
  return { ...meta, _history: [...prev, step] };
}

function historyPop(meta: Record<string, unknown>): { prevStep: ConversationStep | null; nextMeta: Record<string, unknown> } {
  const prev = Array.isArray((meta as { _history?: unknown })._history)
    ? ((meta as { _history: unknown[] })._history as unknown[])
    : [];
  const last = prev.length > 0 ? prev[prev.length - 1] : null;
  const trimmed = prev.length > 0 ? prev.slice(0, -1) : prev;
  return {
    prevStep: typeof last === "string" ? (last as ConversationStep) : null,
    nextMeta: { ...meta, _history: trimmed },
  };
}

function promptForStep(role: FlowRole, step: ConversationStep): string {
  if (step === "CHOOSE_ROLE") {
    return (
      "Hi! Aap abhi kya karna chahte ho?\n\n" +
      "1) Looking for Job\n" +
      "2) Hiring / staff chahiye\n\n" +
      "Reply 1 or 2 — ya bhejo: hire | find jobs | switch | post job | work | apply\n\n" +
      "(back = previous, reset = restart)"
    );
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

async function beginWorkerOnboarding(phone: string, lastIntent: string) {
  const meta = { role: "worker" as FlowRole, _history: ["CHOOSE_ROLE" as const] };
  await setConversationState(phone, "WORKER_NAME", meta, {
    last_intent: lastIntent,
    current_flow: "worker_onboarding",
    current_mode: "worker",
  });
  await sendWhatsAppText(
    phone,
    "Looking for work 👍 Chalo profile banate hain.\n\n" + promptForStep("worker", "WORKER_NAME"),
  );
}

async function beginRecruiterOnboarding(phone: string, lastIntent: string) {
  const meta = { role: "recruiter" as FlowRole, _history: ["CHOOSE_ROLE" as const] };
  await setConversationState(phone, "RECRUITER_JOB_ROLE", meta, {
    last_intent: lastIntent,
    current_flow: "hiring_flow",
    current_mode: "recruiter",
  });
  await sendWhatsAppText(
    phone,
    "Got it 👍 Looks like you want to hire someone now.\n\n" + promptForStep("recruiter", "RECRUITER_JOB_ROLE"),
  );
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
      "Commands:\n" +
        "- hire — start hiring flow\n" +
        "- find jobs / work / apply — looking for work\n" +
        "- switch — pick job vs hiring again\n" +
        "- post job — same as hire\n" +
        "- back — previous question\n" +
        "- reset — start over\n\n" +
        "Send 'Hi' anytime to open the menu. Beech flow me bhi 'hire' / 'need job' likh sakte ho — hum switch kar denge.",
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
    if (state.current_step === "START") {
      await sendWhatsAppText(phone, "You are already at start. Send 'Hi' to begin.");
      return;
    }

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

  const cmd = parseQuickCommand(text);

  if (state.current_step !== "START" && state.current_step !== "CHOOSE_ROLE") {
    const flowRole = state.metadata.role as FlowRole | undefined;
    if (flowRole === "worker" && detectHiringIntent(text)) {
      const meta = { role: "recruiter" as FlowRole, _history: ["CHOOSE_ROLE" as const] };
      await setConversationState(phone, "RECRUITER_JOB_ROLE", meta, {
        last_intent: "hiring_intent_switch",
        current_flow: "hiring_flow",
        current_mode: "recruiter",
      });
      await sendWhatsAppText(
        phone,
        "Got it 👍 Hiring mode on. What kind of worker are you looking for? (e.g. Maid, Cook, Driver)",
      );
      return;
    }
    if (flowRole === "recruiter" && detectJobSeekingIntent(text)) {
      const meta = { role: "worker" as FlowRole, _history: ["CHOOSE_ROLE" as const] };
      await setConversationState(phone, "WORKER_NAME", meta, {
        last_intent: "job_intent_switch",
        current_flow: "worker_onboarding",
        current_mode: "worker",
      });
      await sendWhatsAppText(phone, "Sure — job search mode. Aapka naam?");
      return;
    }
  }

  const quickEntry = state.current_step === "START" || state.current_step === "CHOOSE_ROLE";
  if (quickEntry) {
    if (cmd === "switch") {
      await setConversationState(phone, "CHOOSE_ROLE", {}, { last_intent: "switch", current_flow: "idle" });
      await sendWhatsAppText(phone, promptForStep("worker", "CHOOSE_ROLE"));
      return;
    }

    if (cmd === "find_jobs" || cmd === "work" || cmd === "apply") {
      await beginWorkerOnboarding(phone, cmd ?? "find_jobs");
      return;
    }

    if (cmd === "hire" || cmd === "post_job") {
      await beginRecruiterOnboarding(phone, cmd ?? "hire");
      return;
    }
  }

  if (state.current_step === "START") {
    if (isHi(text)) {
      await setConversationState(phone, "CHOOSE_ROLE", {}, { last_intent: "hi", current_flow: "idle" });
      await sendWhatsAppText(phone, promptForStep("worker", "CHOOSE_ROLE"));
      return;
    }
    if (detectHiringIntent(text)) {
      await beginRecruiterOnboarding(phone, "hiring_intent");
      return;
    }
    if (detectJobSeekingIntent(text)) {
      await beginWorkerOnboarding(phone, "job_intent");
      return;
    }

    await sendWhatsAppText(phone, "Send 'Hi' to start. (help = commands, reset = restart)");
    return;
  }

  if (state.current_step === "CHOOSE_ROLE") {
    const role = roleChoiceFromText(text);
    if (!role) {
      await sendWhatsAppText(phone, "Please reply 1 (Job) or 2 (Hiring) — ya bhejo: hire / find jobs");
      return;
    }

    const nextStep: ConversationStep = role === "worker" ? "WORKER_NAME" : "RECRUITER_JOB_ROLE";
    await setConversationState(phone, nextStep, historyPush({ role }, "CHOOSE_ROLE"), {
      last_intent: "choose_role",
      current_flow: role === "worker" ? "worker_onboarding" : "hiring_flow",
      current_mode: role,
    });

    await sendWhatsAppText(phone, promptForStep(role, nextStep));
    return;
  }

  if (state.metadata.role === "worker") {
    await handleWorkerFlow({ phone, text, step: state.current_step, metadata: state.metadata });
    return;
  }

  if (state.metadata.role === "recruiter") {
    await handleRecruiterFlow({ phone, text, step: state.current_step, metadata: state.metadata });
    return;
  }

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

    const user = await upsertIdentityByPhone({
      phone,
      name: String(meta.name ?? "").trim() || null,
      city: String(meta.city ?? "").trim() || null,
      currentMode: "worker",
    });

    await upsertWorkerProfile({
      userId: user.id,
      role: String(meta.jobType ?? "").trim() || null,
      experienceYears: typeof meta.experienceYears === "number" ? meta.experienceYears : null,
      expectedSalary: typeof meta.expectedSalary === "number" ? meta.expectedSalary : null,
      availability: String(meta.availability ?? "").trim() || null,
    });

    await findJobsForWorker({
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
      });
      loginLine = `https://${webBase.replace(/^https?:\/\//, "").replace(/\/$/, "")}/login/${token}`;
    }

    const msgText =
      "Thanks! We’re finding matching jobs near you 🚀\n\n" +
      "You can switch to hiring anytime on WhatsApp (send hire) or on the website.\n\n" +
      "Open your profile:\n\n" +
      (loginLine || "(link coming soon)") +
      "\n\nWe’ll also notify you on WhatsApp when new matches arrive.";

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

    const user = await upsertIdentityByPhone({
      phone,
      city: String(meta.city ?? "").trim() || null,
      currentMode: "recruiter",
    });

    await upsertRecruiterProfile({
      userId: user.id,
      hiringType: "individual",
      businessName: null,
      companyName: null,
    });

    await createJob({
      recruiterId: user.id,
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
        userId: user.id,
        phone: user.phone,
      });
      loginLine = `https://${webBase.replace(/^https?:\/\//, "").replace(/\/$/, "")}/login/${token}`;
    }

    const msgText =
      "Thanks! Job posted — we’ll find candidates 🚀\n\n" +
      "You can look for work for yourself anytime (send find jobs) or on the website.\n\n" +
      "Manage here:\n\n" +
      (loginLine || "(link coming soon)") +
      "\n\nWe’ll notify you on WhatsApp for new matches.";

    await sendWhatsAppText(phone, msgText);
    return;
  }

  await clearConversationState(phone);
  await sendWhatsAppText(phone, "Send 'Hi' to start again.");
}
