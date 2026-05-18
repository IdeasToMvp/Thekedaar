import { createMagicLinkForUser } from "./magicLink.service";
import { accountStatusOf, getUserByPhoneForLifecycle } from "./accountLifecycle.service";
import { getUserCapabilities } from "./user.service";
import type { UserRow } from "./user.service";
import { sendWhatsAppText } from "./whatsapp.service";
import {
  clearConversationState,
  getConversationState,
  setConversationState,
  type ConversationStep,
} from "./conversation.service";
import { detectHiringIntent, detectJobSeekingIntent } from "../utils/intentRouter";

export type LockedAccountRole = "employer" | "worker";

function isGreeting(norm: string): boolean {
  return ["hi", "hii", "hello", "hey", "start"].includes(norm);
}

function roleChoiceFromText(s: string): "worker" | "recruiter" | null {
  const t = s.trim().toLowerCase();
  if (t === "1" || t.includes("job") || t.includes("work") || t.includes("naukri")) return "worker";
  if (t === "2" || t.includes("hire") || t.includes("hiring") || t.includes("employee") || t.includes("staff"))
    return "recruiter";
  if (detectJobSeekingIntent(s)) return "worker";
  if (detectHiringIntent(s)) return "recruiter";
  return null;
}

/** One role only: employer (recruiter profile) or worker — not both. */
export async function getSingleRegisteredRole(userId: string): Promise<LockedAccountRole | null> {
  const caps = await getUserCapabilities(userId);
  if (caps.can_hire && !caps.can_seek) return "employer";
  if (caps.can_seek && !caps.can_hire) return "worker";
  return null;
}

export function roleLockedPrompt(role: LockedAccountRole): string {
  if (role === "employer") {
    return (
      "Your current Thekedaar account is registered as an Employer.\n\n" +
      "At the moment, one mobile number can only have one role.\n\n" +
      "Would you like to:\n\n" +
      "1. Continue as Employer\n" +
      "2. Create Worker Account with Another Number"
    );
  }
  return (
    "Your current Thekedaar account is registered as a Worker.\n\n" +
    "At the moment, one mobile number can only have one role.\n\n" +
    "Would you like to:\n\n" +
    "1. Continue as Worker\n" +
    "2. Create Employer Account with Another Number"
  );
}

export function parseRoleLockedChoice(text: string): "continue" | "other_number" | null {
  const t = text.trim().toLowerCase();
  if (t === "1" || t.includes("continue")) return "continue";
  if (t === "2" || t.includes("another") || t.includes("other number") || t.includes("different number"))
    return "other_number";
  return null;
}

function otherNumberMessage(role: LockedAccountRole): string {
  if (role === "employer") {
    return (
      "To join as a Worker, use a different WhatsApp number.\n\n" +
      "Send Hi from that number on Thekedaar to create a worker profile.\n\n" +
      "This number stays registered as Employer only."
    );
  }
  return (
    "To hire on Thekedaar as an Employer, use a different WhatsApp number.\n\n" +
    "Send Hi from that number to post jobs and find workers.\n\n" +
    "This number stays registered as Worker only."
  );
}

async function buildMagicLoginUrl(userId: string, phone: string): Promise<string> {
  const webBase = process.env.WEB_BASE_URL?.trim();
  if (!webBase) return "";
  const { token } = await createMagicLinkForUser({ userId, phone });
  const host = webBase.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  const base = `${isLocal ? "http" : "https"}://${host}`;
  return `${base}/login/${token}?returnTo=${encodeURIComponent("/feed")}`;
}

async function sendContinueAsRole(phone: string, user: UserRow, role: LockedAccountRole): Promise<void> {
  const label = role === "employer" ? "Employer" : "Worker";
  const url = await buildMagicLoginUrl(user.id, user.phone);
  let body = `Continuing as ${label} on Thekedaar ✅\n\n`;
  if (url) {
    body += "Open the app here (one-time link):\n" + url + "\n\n";
  }
  body += "Send Hi anytime if you need this menu again.";
  await sendWhatsAppText(phone, body);
  await clearConversationState(phone);
}

async function promptRoleLocked(phone: string, userId: string, role: LockedAccountRole): Promise<void> {
  await setConversationState(phone, "ACCOUNT_ROLE_LOCKED_CHOICE" as ConversationStep, { lockedRole: role, userId }, {
    last_intent: "role_locked",
    current_flow: "idle",
  });
  await sendWhatsAppText(phone, roleLockedPrompt(role));
}

function pickedConflictsWithLockedRole(locked: LockedAccountRole, picked: "worker" | "recruiter"): boolean {
  if (locked === "employer" && picked === "worker") return true;
  if (locked === "worker" && picked === "recruiter") return true;
  return false;
}

/**
 * Blocks role switching for single-role accounts. Returns true if message was handled.
 */
export async function handleAccountRoleLockedWhatsApp(
  phone: string,
  text: string,
  norm: string,
): Promise<boolean> {
  const user = await getUserByPhoneForLifecycle(phone);
  if (!user || accountStatusOf(user) !== "active") return false;

  const locked = await getSingleRegisteredRole(user.id);
  if (!locked) return false;

  const state = await getConversationState(phone);

  if (state.current_step === "ACCOUNT_ROLE_LOCKED_CHOICE") {
    const metaRole = state.metadata.lockedRole as LockedAccountRole | undefined;
    const role = metaRole === "employer" || metaRole === "worker" ? metaRole : locked;
    const choice = parseRoleLockedChoice(text);
    if (!choice) {
      await sendWhatsAppText(phone, "Please reply 1 (Continue) or 2 (Use another number).");
      return true;
    }
    if (choice === "continue") {
      await sendContinueAsRole(phone, user, role);
      return true;
    }
    await sendWhatsAppText(phone, otherNumberMessage(role));
    await clearConversationState(phone);
    return true;
  }

  const picked = roleChoiceFromText(text);

  if (state.current_step === "CHOOSE_ROLE" && picked && !pickedConflictsWithLockedRole(locked, picked)) {
    await sendContinueAsRole(phone, user, locked);
    return true;
  }

  const wantsWrongRole =
    (locked === "employer" && (picked === "worker" || detectJobSeekingIntent(text))) ||
    (locked === "worker" && (picked === "recruiter" || detectHiringIntent(text)));

  const atRoleEntry =
    state.current_step === "START" ||
    state.current_step === "CHOOSE_ROLE" ||
    isGreeting(norm) ||
    norm === "switch" ||
    wantsWrongRole;

  if (!atRoleEntry) return false;

  if (wantsWrongRole || isGreeting(norm) || state.current_step === "CHOOSE_ROLE" || norm === "switch") {
    await promptRoleLocked(phone, user.id, locked);
    return true;
  }

  return false;
}

/** Call before starting worker/recruiter onboarding from quick commands. */
export async function blockOnboardingIfSingleRoleLocked(
  phone: string,
  intent: "worker" | "recruiter",
): Promise<boolean> {
  const user = await getUserByPhoneForLifecycle(phone);
  if (!user || accountStatusOf(user) !== "active") return false;
  const locked = await getSingleRegisteredRole(user.id);
  if (!locked) return false;
  if (locked === "employer" && intent === "worker") {
    await promptRoleLocked(phone, user.id, locked);
    return true;
  }
  if (locked === "worker" && intent === "recruiter") {
    await promptRoleLocked(phone, user.id, locked);
    return true;
  }
  return false;
}
