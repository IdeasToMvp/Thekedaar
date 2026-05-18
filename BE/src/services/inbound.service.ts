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
import { handleApplicationReplyFromWhatsApp } from "./applications.service";
import { createJob, findJobsForWorker } from "./jobs.service";
import { createMagicLinkForUser } from "./magicLink.service";
import {
  parseQuickCommand,
  detectHiringIntent,
  detectJobSeekingIntent,
} from "../utils/intentRouter";
import {
  aadhaarPrompt,
  agePrompt,
  availabilityMenuPrompt,
  buildJobDescription,
  buildJobTiming,
  DOCUMENT_AADHAAR,
  genderMenuPrompt,
  genderLabel,
  isMaidOrCookCategory,
  jobAadhaarRequiredPrompt,
  jobCategoryMenuPrompt,
  jobGenderPreferencePrompt,
  jobMaxAgePrompt,
  jobMinAgePrompt,
  mealFrequencyPrompt,
  parseAadhaarYesNo,
  parseAge,
  parseGender,
  parseJobGenderPreference,
  parseMaxAge,
  parseMealFrequency,
  parseMenuOrFreeText,
  parseSingleCategoryChoice,
  parseSkillSelection,
  parseWorkShift,
  shopTimingPrompt,
  skillsMenuPrompt,
  urgencyMenuPrompt,
  workShiftPrompt,
  cityMenuPrompt,
  fullAddressPrompt,
  WA_AVAILABILITY_OPTIONS,
  WA_URGENCY_OPTIONS,
} from "../utils/whatsappFlow";
import {
  GURUGRAM_CITY_LABEL,
  gurugramCityAccepted,
  localityMenuPrompt,
} from "../data/gurugramLocalities";
import { formatPublicLocation, resolveLocationFromInputs } from "../utils/publicLocation";

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

function isMoreCommand(s: string): boolean {
  const t = normalizeText(s);
  return ["more", "aur", "next", "aage"].includes(t);
}

function localityPage(meta: Record<string, unknown>): number {
  const p = meta.localityPage;
  return typeof p === "number" && Number.isFinite(p) && p >= 0 ? Math.floor(p) : 0;
}

function storeResolvedLocation(meta: Record<string, unknown>, areaRaw: string, fullAddressInput: string) {
  const resolved = resolveLocationFromInputs({
    cityInput: GURUGRAM_CITY_LABEL,
    areaInput: areaRaw,
    fullAddressInput,
  });
  meta.city = resolved.city;
  meta.sector = resolved.displaySector;
  meta.fullAddress = resolved.fullAddress;
}

function parseYesNo(s: string): boolean | null {
  const t = normalizeText(s);
  if (["yes", "y", "haan", "ha", "ok", "available", "1"].includes(t)) return true;
  if (["no", "n", "nahi", "nahin", "2"].includes(t)) return false;
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

function workerHasMaidOrCook(meta: Record<string, unknown>): boolean {
  const skills = meta.skills;
  if (!Array.isArray(skills)) return false;
  return skills.some((s) => typeof s === "string" && isMaidOrCookCategory(s));
}

function promptForStep(role: FlowRole, step: ConversationStep, meta: Record<string, unknown> = {}): string {
  if (step === "CHOOSE_ROLE") {
    return (
      "Hi! Aap abhi kya karna chahte ho?\n\n" +
      "1) Looking for Job\n" +
      "2) Hiring / staff chahiye\n\n" +
      "Reply 1 or 2 — ya bhejo: hire | find jobs | switch | post job\n\n" +
      "(back = previous, reset = restart)"
    );
  }

  if (role === "worker") {
    switch (step) {
      case "WORKER_NAME":
        return "Aapka naam? (back = previous)";
      case "WORKER_AGE":
        return agePrompt();
      case "WORKER_GENDER":
        return genderMenuPrompt();
      case "WORKER_AADHAAR":
        return aadhaarPrompt();
      case "WORKER_CITY":
        return cityMenuPrompt();
      case "WORKER_SECTOR":
        return localityMenuPrompt(localityPage(meta));
      case "WORKER_FULL_ADDRESS":
        return fullAddressPrompt();
      case "WORKER_SKILLS":
        return skillsMenuPrompt();
      case "WORKER_SKILL_OTHER":
        return "Other skill — kya kaam karte ho? (e.g. Driver, Security)\n(back = previous)";
      case "WORKER_SHIFT_PREFERENCE":
        return mealFrequencyPrompt();
      case "WORKER_SHIFT_CUSTOM":
        return workShiftPrompt();
      case "WORKER_EXPECTED_SALARY":
        return "Expected salary per month? (number only, e.g. 15000)\n(back = previous)";
      case "WORKER_EXPERIENCE":
        return "Experience kitne saal? (number, e.g. 2)\n(back = previous)";
      case "WORKER_AVAILABILITY":
        return availabilityMenuPrompt();
      case "WORKER_AVAILABILITY_CUSTOM":
        return "Kab se available ho? (apna likho)\n(back = previous)";
      default:
        return "Send your reply. (back = previous)";
    }
  }

  switch (step) {
    case "RECRUITER_JOB_CATEGORY":
      return jobCategoryMenuPrompt();
    case "RECRUITER_JOB_CATEGORY_OTHER":
      return "Job category — kya role hai? (e.g. Driver, Guard)\n(back = previous)";
    case "RECRUITER_CITY":
      return cityMenuPrompt();
    case "RECRUITER_SECTOR":
      return localityMenuPrompt(localityPage(meta));
    case "RECRUITER_FULL_ADDRESS":
      return fullAddressPrompt();
    case "RECRUITER_SALARY":
      return "Salary per month? (number only, e.g. 18000)\n(back = previous)";
    case "RECRUITER_ACCOMMODATION":
      return "Accommodation milega? Reply *yes* / *no*\n(back = previous)";
    case "RECRUITER_MIN_AGE":
      return jobMinAgePrompt();
    case "RECRUITER_MAX_AGE":
      return jobMaxAgePrompt();
    case "RECRUITER_PREFERRED_GENDER":
      return jobGenderPreferencePrompt();
    case "RECRUITER_AADHAAR_REQUIRED":
      return jobAadhaarRequiredPrompt();
    case "RECRUITER_MEAL_FREQUENCY":
      return mealFrequencyPrompt();
    case "RECRUITER_WORK_SHIFT":
      return workShiftPrompt();
    case "RECRUITER_WORK_SHIFT_CUSTOM":
      return "Apna time likho (e.g. 9am-2pm, 6pm-9pm)\n(back = previous)";
    case "RECRUITER_TIMING":
      return shopTimingPrompt();
    case "RECRUITER_URGENCY":
      return urgencyMenuPrompt();
    default:
      return "Send your reply. (back = previous)";
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
  await setConversationState(phone, "RECRUITER_JOB_CATEGORY", meta, {
    last_intent: lastIntent,
    current_flow: "hiring_flow",
    current_mode: "recruiter",
  });
  await sendWhatsAppText(
    phone,
    "Hiring mode 👍 Job post karte hain.\n\n" + promptForStep("recruiter", "RECRUITER_JOB_CATEGORY"),
  );
}

function magicLoginUrl(userId: string, phone: string): Promise<string> {
  const webBase = process.env.WEB_BASE_URL;
  if (!webBase) return Promise.resolve("");
  return createMagicLinkForUser({ userId, phone }).then(({ token }) => {
    const host = webBase.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}/login/${token}?returnTo=${encodeURIComponent("/")}`;
  });
}

async function afterWorkerSkills(meta: Record<string, unknown>, phone: string, fromStep: ConversationStep) {
  if (workerHasMaidOrCook(meta)) {
    await setConversationState(phone, "WORKER_SHIFT_PREFERENCE", historyPush(meta, fromStep));
    await sendWhatsAppText(
      phone,
      "Cook / Maid ke liye — kitni baar kaam kar sakte ho?\n\n" + mealFrequencyPrompt(),
    );
    return;
  }
  await setConversationState(phone, "WORKER_EXPECTED_SALARY", historyPush(meta, fromStep));
  await sendWhatsAppText(phone, promptForStep("worker", "WORKER_EXPECTED_SALARY"));
}

async function afterRecruiterRequirements(meta: Record<string, unknown>, phone: string, fromStep: ConversationStep) {
  const category = String(meta.jobCategory ?? "");
  if (isMaidOrCookCategory(category)) {
    await setConversationState(phone, "RECRUITER_MEAL_FREQUENCY", historyPush(meta, fromStep));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_MEAL_FREQUENCY"));
    return;
  }
  await setConversationState(phone, "RECRUITER_TIMING", historyPush(meta, fromStep));
  await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_TIMING"));
}

async function afterRecruiterAccommodation(meta: Record<string, unknown>, phone: string, fromStep: ConversationStep) {
  await setConversationState(phone, "RECRUITER_MIN_AGE", historyPush(meta, fromStep));
  await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_MIN_AGE"));
}

export async function handleIncomingWhatsAppMessage(payload: unknown) {
  const msg = parseIncomingTextMessage(payload);
  if (!msg) return;

  const phone = msg.from;
  const text = msg.text;
  const norm = normalizeText(text);

  if (await handleApplicationReplyFromWhatsApp(phone, text)) {
    return;
  }

  if (isHelpCommand(text)) {
    await sendWhatsAppText(
      phone,
      "Commands:\n" +
        "- hire / post job — hiring flow\n" +
        "- find jobs / work / apply — job seeker\n" +
        "- switch — job vs hiring menu\n" +
        "- back — previous question\n" +
        "- reset — start over\n\n" +
        "Application: reply 1/approve or 0/decline after a new apply alert.\n" +
        "Skills: reply 1,2,3 (Cook, Maid, Shop helper) comma se.\n" +
        "Send Hi anytime.",
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
      await setConversationState(phone, "RECRUITER_JOB_CATEGORY", meta, {
        last_intent: "hiring_intent_switch",
        current_flow: "hiring_flow",
        current_mode: "recruiter",
      });
      await sendWhatsAppText(phone, "Hiring mode on.\n\n" + jobCategoryMenuPrompt());
      return;
    }
    if (flowRole === "recruiter" && detectJobSeekingIntent(text)) {
      const meta = { role: "worker" as FlowRole, _history: ["CHOOSE_ROLE" as const] };
      await setConversationState(phone, "WORKER_NAME", meta, {
        last_intent: "job_intent_switch",
        current_flow: "worker_onboarding",
        current_mode: "worker",
      });
      await sendWhatsAppText(phone, "Job search mode.\n\n" + promptForStep("worker", "WORKER_NAME"));
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

    const nextStep: ConversationStep = role === "worker" ? "WORKER_NAME" : "RECRUITER_JOB_CATEGORY";
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
    await setConversationState(phone, "WORKER_AGE", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_AGE"));
    return;
  }

  if (step === "WORKER_AGE") {
    const age = parseAge(text);
    if (age === null) {
      await sendWhatsAppText(phone, "Umar 16–80 ke beech number mein bhejo (e.g. 28).");
      return;
    }
    meta.age = age;
    await setConversationState(phone, "WORKER_GENDER", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_GENDER"));
    return;
  }

  if (step === "WORKER_GENDER") {
    const gender = parseGender(text);
    if (!gender) {
      await sendWhatsAppText(phone, "Reply 1–4.\n\n" + genderMenuPrompt());
      return;
    }
    meta.gender = gender;
    await setConversationState(phone, "WORKER_AADHAAR", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_AADHAAR"));
    return;
  }

  if (step === "WORKER_AADHAAR") {
    const hasAadhaar = parseAadhaarYesNo(text);
    if (hasAadhaar === null) {
      await sendWhatsAppText(phone, "Reply yes ya no.\n\n" + aadhaarPrompt());
      return;
    }
    meta.hasAadhaar = hasAadhaar;
    await setConversationState(phone, "WORKER_CITY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_CITY"));
    return;
  }

  if (step === "WORKER_CITY") {
    if (!gurugramCityAccepted(text)) {
      await sendWhatsAppText(phone, "Abhi sirf Gurugram. Reply *1*.\n\n" + cityMenuPrompt());
      return;
    }
    meta.city = GURUGRAM_CITY_LABEL;
    meta.localityPage = 0;
    await setConversationState(phone, "WORKER_SECTOR", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_SECTOR", meta));
    return;
  }

  if (step === "WORKER_SECTOR") {
    if (isMoreCommand(text)) {
      meta.localityPage = localityPage(meta) + 1;
      await setConversationState(phone, "WORKER_SECTOR", meta);
      await sendWhatsAppText(phone, localityMenuPrompt(localityPage(meta)));
      return;
    }
    const areaRaw = text.trim();
    if (areaRaw.length < 2) {
      await sendWhatsAppText(phone, "Area chuniye (number) ya naam likho.\n\n" + localityMenuPrompt(localityPage(meta)));
      return;
    }
    meta.areaRaw = areaRaw;
    await setConversationState(phone, "WORKER_FULL_ADDRESS", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_FULL_ADDRESS"));
    return;
  }

  if (step === "WORKER_FULL_ADDRESS") {
    const full = text.trim();
    if (full.length < 8) {
      await sendWhatsAppText(phone, "Poora address likho (kam se kam 8 characters).\n\n" + fullAddressPrompt());
      return;
    }
    const areaRaw = String(meta.areaRaw ?? "").trim() || full;
    storeResolvedLocation(meta, areaRaw, full);
    await setConversationState(phone, "WORKER_SKILLS", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_SKILLS"));
    return;
  }

  if (step === "WORKER_SKILLS") {
    const parsed = parseSkillSelection(text);
    if (!parsed || (parsed.skills.length === 0 && !parsed.needsOtherInput)) {
      await sendWhatsAppText(phone, "Samajh nahi aaya. Reply jaise: 1,2 ya Cook, Maid\n\n" + skillsMenuPrompt());
      return;
    }
    meta.skills = parsed.skills;
    if (parsed.needsOtherInput) {
      await setConversationState(phone, "WORKER_SKILL_OTHER", historyPush(meta, step));
      await sendWhatsAppText(phone, promptForStep("worker", "WORKER_SKILL_OTHER"));
      return;
    }
    await afterWorkerSkills(meta, phone, step);
    return;
  }

  if (step === "WORKER_SKILL_OTHER") {
    const other = text.trim();
    if (other.length < 2) {
      await sendWhatsAppText(phone, "Please skill likho (e.g. Driver).");
      return;
    }
    const existing = Array.isArray(meta.skills) ? (meta.skills as string[]) : [];
    meta.skills = [...new Set([...existing, other])];
    await afterWorkerSkills(meta, phone, step);
    return;
  }

  if (step === "WORKER_SHIFT_PREFERENCE") {
    const freq = parseMealFrequency(text);
    if (!freq) {
      await sendWhatsAppText(phone, "Reply 1–4 ya apna likho.\n\n" + mealFrequencyPrompt());
      return;
    }
    meta.shiftFrequency = freq;
    await setConversationState(phone, "WORKER_SHIFT_CUSTOM", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_SHIFT_CUSTOM"));
    return;
  }

  if (step === "WORKER_SHIFT_CUSTOM") {
    const awaitingCustom = meta._awaitingCustomShift === true;
    let shiftLabel: string | null = null;
    if (awaitingCustom) {
      shiftLabel = text.trim();
      if (shiftLabel.length < 3) {
        await sendWhatsAppText(phone, "Time likho, e.g. 9am-2pm, 6pm-9pm");
        return;
      }
    } else {
      const shift = parseWorkShift(text);
      if (!shift) {
        await sendWhatsAppText(phone, "Reply 1–4 ya time likho (e.g. 9am-3pm).\n\n" + workShiftPrompt());
        return;
      }
      if (shift.needsCustom) {
        meta._awaitingCustomShift = true;
        await setConversationState(phone, "WORKER_SHIFT_CUSTOM", historyPush(meta, step));
        await sendWhatsAppText(phone, "Apna time likho (e.g. 9am-2pm, 6pm-9pm)");
        return;
      }
      shiftLabel = shift.label;
    }
    meta.shiftHours = shiftLabel;
    meta.availability = buildJobTiming({
      category: "worker",
      mealFrequency: String(meta.shiftFrequency ?? ""),
      workShift: shiftLabel,
    });
    await setConversationState(phone, "WORKER_EXPECTED_SALARY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_EXPECTED_SALARY"));
    return;
  }

  if (step === "WORKER_EXPECTED_SALARY") {
    const n = parseNumber(text);
    if (n === null) {
      await sendWhatsAppText(phone, "Salary number mein bhejo (e.g. 15000).");
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
      await sendWhatsAppText(phone, "Experience number mein bhejo (e.g. 2).");
      return;
    }
    meta.experienceYears = n;
    await setConversationState(phone, "WORKER_AVAILABILITY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("worker", "WORKER_AVAILABILITY"));
    return;
  }

  if (step === "WORKER_AVAILABILITY") {
    const choice = parseMenuOrFreeText(text, WA_AVAILABILITY_OPTIONS);
    if (!choice) {
      await sendWhatsAppText(phone, "Reply 1–4.\n\n" + availabilityMenuPrompt());
      return;
    }
    if (choice === WA_AVAILABILITY_OPTIONS[3]?.label) {
      await setConversationState(phone, "WORKER_AVAILABILITY_CUSTOM", historyPush({ ...meta, availabilityDraft: choice }, step));
      await sendWhatsAppText(phone, promptForStep("worker", "WORKER_AVAILABILITY_CUSTOM"));
      return;
    }
    meta.availability = meta.availability ?? choice;
    await finishWorkerOnboarding(phone, meta);
    return;
  }

  if (step === "WORKER_AVAILABILITY_CUSTOM") {
    meta.availability = text.trim() || String(meta.availabilityDraft ?? "Flexible");
    await finishWorkerOnboarding(phone, meta);
    return;
  }

  await clearConversationState(phone);
  await sendWhatsAppText(phone, "Send 'Hi' to start again.");
}

async function finishWorkerOnboarding(phone: string, meta: Record<string, unknown>) {
  const skills = Array.isArray(meta.skills) ? (meta.skills as string[]).map((s) => String(s).trim()).filter(Boolean) : [];
  const primaryRole = skills[0] ?? null;

  const user = await upsertIdentityByPhone({
    phone,
    name: String(meta.name ?? "").trim() || null,
    city: String(meta.city ?? GURUGRAM_CITY_LABEL).trim() || GURUGRAM_CITY_LABEL,
    sector: typeof meta.sector === "string" ? meta.sector : null,
    fullAddress: typeof meta.fullAddress === "string" ? meta.fullAddress : null,
    currentMode: "worker",
  });

  await upsertWorkerProfile({
    userId: user.id,
    role: primaryRole,
    skills,
    age: typeof meta.age === "number" ? meta.age : null,
    gender: typeof meta.gender === "string" ? meta.gender : null,
    hasAadhaar: typeof meta.hasAadhaar === "boolean" ? meta.hasAadhaar : null,
    experienceYears: typeof meta.experienceYears === "number" ? meta.experienceYears : null,
    expectedSalary: typeof meta.expectedSalary === "number" ? meta.expectedSalary : null,
    availability: String(meta.availability ?? "").trim() || null,
  });

  const matches = await findJobsForWorker({
    city: (meta.city as string | undefined) ?? null,
    skills,
  });

  await clearConversationState(phone);

  const loginLine = await magicLoginUrl(user.id, user.phone);
  const skillLine = skills.length > 0 ? skills.join(", ") : "your skills";
  const matchLine =
    matches.length > 0
      ? `Abhi ${matches.length} job${matches.length > 1 ? "s" : ""} match ho rahi hain (${skillLine}).`
      : "Nayi jobs aate hi WhatsApp pe batayenge.";

  const age = typeof meta.age === "number" ? meta.age : null;
  const gender = typeof meta.gender === "string" ? genderLabel(meta.gender) : "";
  const aadhaar =
    typeof meta.hasAadhaar === "boolean" ? (meta.hasAadhaar ? "Aadhaar: yes" : "Aadhaar: no") : "";
  const area = formatPublicLocation(String(meta.city ?? GURUGRAM_CITY_LABEL), typeof meta.sector === "string" ? meta.sector : null);

  await sendWhatsAppText(
    phone,
    `Profile ready ✅ (${skillLine})\n` +
      (area ? `Area: ${area}\n` : "") +
      (age != null ? `Age: ${age}\n` : "") +
      (gender ? `Gender: ${gender}\n` : "") +
      (aadhaar ? `${aadhaar}\n` : "") +
      `\n${matchLine}\n\n` +
      "Website par jobs dekho:\n" +
      (loginLine || "(link coming soon)") +
      "\n\nHiring ke liye kabhi bhi *hire* likho.",
  );
}

async function handleRecruiterFlow(input: {
  phone: string;
  text: string;
  step: ConversationStep;
  metadata: Record<string, unknown>;
}) {
  const { phone, text, step } = input;
  const meta = { ...input.metadata };

  if (step === "RECRUITER_JOB_CATEGORY") {
    const parsed = parseSingleCategoryChoice(text);
    if (!parsed) {
      await sendWhatsAppText(phone, "Reply 1, 2, 3 ya 4.\n\n" + jobCategoryMenuPrompt());
      return;
    }
    if (parsed.needsOtherInput) {
      await setConversationState(phone, "RECRUITER_JOB_CATEGORY_OTHER", historyPush(meta, step));
      await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_JOB_CATEGORY_OTHER"));
      return;
    }
    meta.jobCategory = parsed.category;
    meta.jobTitle = parsed.title;
    await setConversationState(phone, "RECRUITER_CITY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_CITY"));
    return;
  }

  if (step === "RECRUITER_JOB_CATEGORY_OTHER") {
    const custom = text.trim();
    if (custom.length < 2) {
      await sendWhatsAppText(phone, "Please role/category likho.");
      return;
    }
    meta.jobCategory = custom;
    meta.jobTitle = custom;
    await setConversationState(phone, "RECRUITER_CITY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_CITY"));
    return;
  }

  if (step === "RECRUITER_CITY") {
    if (!gurugramCityAccepted(text)) {
      await sendWhatsAppText(phone, "Abhi sirf Gurugram. Reply *1*.\n\n" + cityMenuPrompt());
      return;
    }
    meta.city = GURUGRAM_CITY_LABEL;
    meta.localityPage = 0;
    await setConversationState(phone, "RECRUITER_SECTOR", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_SECTOR", meta));
    return;
  }

  if (step === "RECRUITER_SECTOR") {
    if (isMoreCommand(text)) {
      meta.localityPage = localityPage(meta) + 1;
      await setConversationState(phone, "RECRUITER_SECTOR", meta);
      await sendWhatsAppText(phone, localityMenuPrompt(localityPage(meta)));
      return;
    }
    const areaRaw = text.trim();
    if (areaRaw.length < 2) {
      await sendWhatsAppText(phone, "Area chuniye (number) ya naam likho.\n\n" + localityMenuPrompt(localityPage(meta)));
      return;
    }
    meta.areaRaw = areaRaw;
    await setConversationState(phone, "RECRUITER_FULL_ADDRESS", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_FULL_ADDRESS"));
    return;
  }

  if (step === "RECRUITER_FULL_ADDRESS") {
    const full = text.trim();
    if (full.length < 8) {
      await sendWhatsAppText(phone, "Poora address likho (kam se kam 8 characters).\n\n" + fullAddressPrompt());
      return;
    }
    const areaRaw = String(meta.areaRaw ?? "").trim() || full;
    storeResolvedLocation(meta, areaRaw, full);
    await setConversationState(phone, "RECRUITER_SALARY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_SALARY"));
    return;
  }

  if (step === "RECRUITER_SALARY") {
    const n = parseNumber(text);
    if (n === null) {
      await sendWhatsAppText(phone, "Salary number mein bhejo (e.g. 18000).");
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
      await sendWhatsAppText(phone, "Reply yes ya no (haan/nahi bhi chalega).");
      return;
    }
    meta.accommodation = yn;
    await afterRecruiterAccommodation(meta, phone, step);
    return;
  }

  if (step === "RECRUITER_MIN_AGE") {
    const minAge = parseAge(text);
    if (minAge === null) {
      await sendWhatsAppText(phone, "Minimum age number mein bhejo (16–80, e.g. 20).");
      return;
    }
    meta.minAge = minAge;
    await setConversationState(phone, "RECRUITER_MAX_AGE", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_MAX_AGE"));
    return;
  }

  if (step === "RECRUITER_MAX_AGE") {
    const maxAge = parseMaxAge(text);
    if (text.trim() && maxAge === null && !["0", "skip", "none"].includes(normalizeText(text))) {
      await sendWhatsAppText(phone, "Max age 16–80, ya *0* / *skip* agar limit nahi.");
      return;
    }
    const minAge = typeof meta.minAge === "number" ? meta.minAge : null;
    if (maxAge != null && minAge != null && maxAge < minAge) {
      await sendWhatsAppText(phone, "Max age minimum se kam nahi ho sakti. Dobara max age bhejo.");
      return;
    }
    meta.maxAge = maxAge;
    await setConversationState(phone, "RECRUITER_PREFERRED_GENDER", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_PREFERRED_GENDER"));
    return;
  }

  if (step === "RECRUITER_PREFERRED_GENDER") {
    const pref = parseJobGenderPreference(text);
    if (!pref) {
      await sendWhatsAppText(phone, "Reply 1–3.\n\n" + jobGenderPreferencePrompt());
      return;
    }
    meta.preferredGender = pref;
    await setConversationState(phone, "RECRUITER_AADHAAR_REQUIRED", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_AADHAAR_REQUIRED"));
    return;
  }

  if (step === "RECRUITER_AADHAAR_REQUIRED") {
    const required = parseAadhaarYesNo(text);
    if (required === null) {
      await sendWhatsAppText(phone, "Reply yes ya no.\n\n" + jobAadhaarRequiredPrompt());
      return;
    }
    meta.requiredDocuments = required ? [DOCUMENT_AADHAAR] : [];
    await afterRecruiterRequirements(meta, phone, step);
    return;
  }

  if (step === "RECRUITER_MEAL_FREQUENCY") {
    const freq = parseMealFrequency(text);
    if (!freq) {
      await sendWhatsAppText(phone, "Reply 1–4.\n\n" + mealFrequencyPrompt());
      return;
    }
    meta.mealFrequency = freq;
    await setConversationState(phone, "RECRUITER_WORK_SHIFT", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_WORK_SHIFT"));
    return;
  }

  if (step === "RECRUITER_WORK_SHIFT") {
    const shift = parseWorkShift(text);
    if (!shift) {
      await sendWhatsAppText(phone, "Reply 1–4.\n\n" + workShiftPrompt());
      return;
    }
    if (shift.needsCustom) {
      await setConversationState(phone, "RECRUITER_WORK_SHIFT_CUSTOM", historyPush(meta, step));
      await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_WORK_SHIFT_CUSTOM"));
      return;
    }
    meta.workShift = shift.label;
    await setConversationState(phone, "RECRUITER_URGENCY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_URGENCY"));
    return;
  }

  if (step === "RECRUITER_WORK_SHIFT_CUSTOM") {
    const custom = text.trim();
    if (custom.length < 3) {
      await sendWhatsAppText(phone, "Time likho, e.g. 9am-2pm, 6pm-9pm");
      return;
    }
    meta.workShiftCustom = custom;
    await setConversationState(phone, "RECRUITER_URGENCY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_URGENCY"));
    return;
  }

  if (step === "RECRUITER_TIMING") {
    meta.shopTiming = text.trim();
    await setConversationState(phone, "RECRUITER_URGENCY", historyPush(meta, step));
    await sendWhatsAppText(phone, promptForStep("recruiter", "RECRUITER_URGENCY"));
    return;
  }

  if (step === "RECRUITER_URGENCY") {
    const urgency =
      parseMenuOrFreeText(text, WA_URGENCY_OPTIONS) ?? (text.trim() || "Flexible");
    meta.urgency = urgency;

    const category = String(meta.jobCategory ?? "Job");
    const city = String(meta.city ?? "").trim();
    const timing = isMaidOrCookCategory(category)
      ? buildJobTiming({
          category,
          mealFrequency: String(meta.mealFrequency ?? ""),
          workShift: String(meta.workShift ?? ""),
          customShift: String(meta.workShiftCustom ?? ""),
        })
      : String(meta.shopTiming ?? "").trim() || null;

    const jobSector = typeof meta.sector === "string" ? meta.sector : null;
    const jobFullAddress = typeof meta.fullAddress === "string" ? meta.fullAddress : null;

    const user = await upsertIdentityByPhone({
      phone,
      city: city || GURUGRAM_CITY_LABEL,
      sector: jobSector,
      fullAddress: jobFullAddress,
      currentMode: "recruiter",
    });

    await upsertRecruiterProfile({
      userId: user.id,
      hiringType: "individual",
      businessName: null,
      companyName: null,
    });

    const minAge = typeof meta.minAge === "number" ? meta.minAge : null;
    const maxAge = typeof meta.maxAge === "number" ? meta.maxAge : null;
    const preferredGender = typeof meta.preferredGender === "string" ? meta.preferredGender : "any";
    const requiredDocuments = Array.isArray(meta.requiredDocuments) ? (meta.requiredDocuments as string[]) : [];

    await createJob({
      recruiterId: user.id,
      title: String(meta.jobTitle ?? category).trim() || category,
      city: city || GURUGRAM_CITY_LABEL,
      sector: jobSector,
      fullAddress: jobFullAddress,
      salary: typeof meta.salary === "number" ? meta.salary : null,
      timing,
      accommodation: typeof meta.accommodation === "boolean" ? meta.accommodation : null,
      urgency,
      category,
      minAge,
      maxAge,
      preferredGender,
      requiredDocuments,
      description: buildJobDescription({
        category,
        city,
        mealFrequency: String(meta.mealFrequency ?? ""),
        timing,
        minAge,
        maxAge,
        preferredGender,
        requiredDocuments,
      }),
    });

    await clearConversationState(phone);

    const loginLine = await magicLoginUrl(user.id, user.phone);
    const reqBits: string[] = [];
    if (minAge != null || maxAge != null) {
      reqBits.push(minAge != null && maxAge != null ? `Age ${minAge}–${maxAge}` : minAge != null ? `Age ${minAge}+` : `Age ≤${maxAge}`);
    }
    if (preferredGender && preferredGender !== "any") reqBits.push(genderLabel(preferredGender));
    if (requiredDocuments.includes(DOCUMENT_AADHAAR)) reqBits.push("Aadhaar required");

    await sendWhatsAppText(
      phone,
      `Job posted ✅ — ${category} in ${formatPublicLocation(city, jobSector) || city || "your city"}\n` +
        (timing ? `Timing: ${timing}\n` : "") +
        (reqBits.length ? `Requirements: ${reqBits.join(" · ")}\n` : "") +
        "\nManage / edit on website:\n" +
        (loginLine || "(link coming soon)") +
        "\n\nWorkers ko dikh jayegi. *find jobs* se aap bhi kaam dhoondh sakte ho.",
    );
    return;
  }

  await clearConversationState(phone);
  await sendWhatsAppText(phone, "Send 'Hi' to start again.");
}
