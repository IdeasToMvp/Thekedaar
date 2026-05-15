/** Shared menus and parsers for WhatsApp onboarding (BE-only). */

export const WA_SKILL_OPTIONS = [
  { id: "1", category: "Cook", label: "Cook" },
  { id: "2", category: "Maid", label: "Maid / House help" },
  { id: "3", category: "Shop helper", label: "Shop helper" },
  { id: "4", category: null, label: "Other (apna likho)" },
] as const;

export const WA_MEAL_FREQUENCY_OPTIONS = [
  { id: "1", label: "Once a day" },
  { id: "2", label: "Twice a day" },
  { id: "3", label: "Thrice a day" },
  { id: "4", label: "Full day (live-in)" },
] as const;

export const WA_WORK_SHIFT_OPTIONS = [
  { id: "1", label: "Morning (6am – 12pm)" },
  { id: "2", label: "Afternoon (12pm – 5pm)" },
  { id: "3", label: "Evening (5pm – 10pm)" },
  { id: "4", label: "Custom time (niche likho)" },
] as const;

export const WA_URGENCY_OPTIONS = [
  { id: "1", label: "Immediate" },
  { id: "2", label: "Within 1 week" },
  { id: "3", label: "Flexible" },
] as const;

export const WA_AVAILABILITY_OPTIONS = [
  { id: "1", label: "Immediate" },
  { id: "2", label: "Within 1 week" },
  { id: "3", label: "Weekends only" },
  { id: "4", label: "Custom (apna likho)" },
] as const;

export const WA_GENDER_OPTIONS = [
  { id: "1", value: "male" as const, label: "Male" },
  { id: "2", value: "female" as const, label: "Female" },
  { id: "3", value: "other" as const, label: "Other" },
  { id: "4", value: "prefer_not_to_say" as const, label: "Prefer not to say" },
] as const;

export const WA_JOB_GENDER_OPTIONS = [
  { id: "1", value: "any" as const, label: "Any gender" },
  { id: "2", value: "male" as const, label: "Male only" },
  { id: "3", value: "female" as const, label: "Female only" },
] as const;

export const DOCUMENT_AADHAAR = "aadhaar";

export type GenderValue = (typeof WA_GENDER_OPTIONS)[number]["value"];
export type JobGenderPreference = (typeof WA_JOB_GENDER_OPTIONS)[number]["value"];

export function skillsMenuPrompt(): string {
  return (
    "Kaunse kaam kar sakte ho? *Ek se zyada* chun sakte ho:\n\n" +
    WA_SKILL_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply numbers comma se, e.g. *1,2* ya *2,3*\n(back = previous)"
  );
}

export function jobCategoryMenuPrompt(): string {
  return (
    "Kis category ki job post karni hai?\n\n" +
    WA_SKILL_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply *1*, *2*, *3* ya *4*\n(back = previous)"
  );
}

export function mealFrequencyPrompt(): string {
  return (
    "Kitni baar chahiye? (khana / ghar kaam)\n\n" +
    WA_MEAL_FREQUENCY_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply 1–4\n(back = previous)"
  );
}

export function workShiftPrompt(): string {
  return (
    "Kaunse time pe chahiye?\n\n" +
    WA_WORK_SHIFT_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply 1–4 (4 = apna time likho, e.g. 9am-3pm)\n(back = previous)"
  );
}

export function shopTimingPrompt(): string {
  return "Shop timing? (e.g. 10am – 8pm)\n(back = previous)";
}

export function urgencyMenuPrompt(): string {
  return (
    "Kab se chahiye?\n\n" +
    WA_URGENCY_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply 1–3 ya apna likho\n(back = previous)"
  );
}

export function availabilityMenuPrompt(): string {
  return (
    "Kab se kaam shuru kar sakte ho?\n\n" +
    WA_AVAILABILITY_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply 1–4\n(back = previous)"
  );
}

export function cityPrompt(): string {
  return "City? (e.g. Gurugram, Delhi — *sirf sheher*, poora address nahi)\n(back = previous)";
}

export function sectorPrompt(): string {
  return (
    "Area / sector name? (e.g. Sector 56, DLF Phase 2, Sikanderpur)\n" +
    "*Poora ghar ka address mat likho*\n(back = previous)"
  );
}

export function agePrompt(): string {
  return "Aapki umar? (number only, e.g. 28)\n(back = previous)";
}

export function genderMenuPrompt(): string {
  return (
    "Gender?\n\n" +
    WA_GENDER_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply 1–4\n(back = previous)"
  );
}

export function aadhaarPrompt(): string {
  return (
    "Kya aapke paas *Aadhaar card* hai?\n\n" +
    "Reply *yes* / *no* (haan / nahi bhi chalega)\n(back = previous)"
  );
}

export function jobMinAgePrompt(): string {
  return "Candidate ki *minimum* umar? (number, e.g. 20)\n(back = previous)";
}

export function jobMaxAgePrompt(): string {
  return (
    "Candidate ki *maximum* umar? (number, e.g. 45)\n" +
    "Agar koi limit nahi — *0* ya *skip* likho\n(back = previous)"
  );
}

export function jobGenderPreferencePrompt(): string {
  return (
    "Kaunse gender ke liye hai?\n\n" +
    WA_JOB_GENDER_OPTIONS.map((o) => `${o.id}) ${o.label}`).join("\n") +
    "\n\nReply 1–3\n(back = previous)"
  );
}

export function jobAadhaarRequiredPrompt(): string {
  return (
    "Kya candidate se *Aadhaar card* chahiye?\n\n" +
    "Reply *yes* / *no*\n(back = previous)"
  );
}

export function parseAge(text: string): number | null {
  const n = Number(text.replace(/[^\d]/g, ""));
  if (!Number.isInteger(n) || n < 16 || n > 80) return null;
  return n;
}

export function parseGender(text: string): GenderValue | null {
  const ids = parseChoiceIds(text, 4);
  if (ids.length === 1) return WA_GENDER_OPTIONS[ids[0] - 1]?.value ?? null;
  const t = normalizeGenderText(text);
  if (t === "male" || t === "female" || t === "other" || t === "prefer_not_to_say") return t;
  return null;
}

function normalizeGenderText(text: string): string {
  const t = text.trim().toLowerCase();
  if (["m", "male", "man", "ladka"].includes(t)) return "male";
  if (["f", "female", "woman", "ladki", "mahila"].includes(t)) return "female";
  if (t.includes("prefer") || t.includes("na bat")) return "prefer_not_to_say";
  if (t === "other" || t === "trans") return "other";
  return t;
}

export function parseJobGenderPreference(text: string): JobGenderPreference | null {
  const ids = parseChoiceIds(text, 3);
  if (ids.length === 1) return WA_JOB_GENDER_OPTIONS[ids[0] - 1]?.value ?? null;
  const t = text.trim().toLowerCase();
  if (t.includes("any") || t.includes("koi")) return "any";
  if (t.includes("male") && !t.includes("female")) return "male";
  if (t.includes("female")) return "female";
  return null;
}

export function parseAadhaarYesNo(text: string): boolean | null {
  const t = text.trim().toLowerCase();
  if (["yes", "y", "haan", "ha", "1", "hai", "available"].includes(t)) return true;
  if (["no", "n", "nahi", "nahin", "2", "nahi hai"].includes(t)) return false;
  return null;
}

export function parseMaxAge(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (["0", "skip", "none", "no", "nahi", "na"].includes(t)) return null;
  return parseAge(text);
}

export function genderLabel(value: string | null | undefined): string {
  switch (value) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "other":
      return "Other";
    case "prefer_not_to_say":
      return "Prefer not to say";
    case "any":
      return "Any gender";
    default:
      return value?.trim() || "";
  }
}

function parseChoiceIds(text: string, maxId: number): number[] {
  const ids = new Set<number>();
  const parts = text.split(/[,/&\s]+/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const n = Number(part.replace(/\D/g, ""));
    if (Number.isInteger(n) && n >= 1 && n <= maxId) ids.add(n);
  }
  return [...ids].sort((a, b) => a - b);
}

export type ParsedSkillSelection = {
  skills: string[];
  needsOtherInput: boolean;
};

/** Parse worker multi-skill reply (numbers or category names). */
export function parseSkillSelection(text: string): ParsedSkillSelection | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const byNumber = parseChoiceIds(trimmed, 4);
  if (byNumber.length > 0) {
    const skills: string[] = [];
    let needsOtherInput = false;
    for (const id of byNumber) {
      const opt = WA_SKILL_OPTIONS[id - 1];
      if (!opt) continue;
      if (id === 4) {
        needsOtherInput = true;
      } else if (opt.category) {
        skills.push(opt.category);
      }
    }
    return { skills: [...new Set(skills)], needsOtherInput };
  }

  const lower = trimmed.toLowerCase();
  const skills: string[] = [];
  let needsOtherInput = false;
  if (/\bother\b/.test(lower) || /\bdusra\b/.test(lower) || /\banya\b/.test(lower)) {
    needsOtherInput = true;
  }
  for (const opt of WA_SKILL_OPTIONS) {
    if (!opt.category) continue;
    const key = opt.category.toLowerCase();
    if (lower.includes(key) || (key === "maid" && /maid|house\s*help/.test(lower))) {
      skills.push(opt.category);
    }
  }
  if (skills.length === 0 && !needsOtherInput) {
    const tokens = trimmed.split(/[,/&+]+/).map((t) => t.trim()).filter((t) => t.length > 1);
    if (tokens.length > 0) return { skills: [...new Set(tokens)], needsOtherInput: false };
    return null;
  }
  return { skills: [...new Set(skills)], needsOtherInput };
}

export type ParsedCategoryChoice = {
  category: string;
  title: string;
  needsOtherInput: boolean;
};

export function parseSingleCategoryChoice(text: string): ParsedCategoryChoice | null {
  const t = text.trim();
  const n = Number(t.replace(/\D/g, ""));
  if (Number.isInteger(n) && n >= 1 && n <= 4) {
    const opt = WA_SKILL_OPTIONS[n - 1];
    if (n === 4) return { category: "", title: "", needsOtherInput: true };
    if (opt.category) return { category: opt.category, title: opt.category, needsOtherInput: false };
  }
  const lower = t.toLowerCase();
  for (const opt of WA_SKILL_OPTIONS) {
    if (!opt.category) continue;
    if (lower.includes(opt.category.toLowerCase()) || (opt.id === "2" && /maid|house/.test(lower))) {
      return { category: opt.category, title: opt.category, needsOtherInput: false };
    }
  }
  if (/\bother\b/.test(lower)) return { category: "", title: "", needsOtherInput: true };
  if (t.length >= 2) return { category: t, title: t, needsOtherInput: false };
  return null;
}

export function isMaidOrCookCategory(category: string): boolean {
  const c = category.trim().toLowerCase();
  return c === "cook" || c === "maid" || c.includes("house help");
}

export function parseMealFrequency(text: string): string | null {
  const ids = parseChoiceIds(text, 4);
  if (ids.length === 1) return WA_MEAL_FREQUENCY_OPTIONS[ids[0] - 1]?.label ?? null;
  const t = text.trim();
  if (t.length >= 3) return t;
  return null;
}

export function parseWorkShift(text: string): { label: string; needsCustom: boolean } | null {
  const ids = parseChoiceIds(text, 4);
  if (ids.length === 1) {
    const opt = WA_WORK_SHIFT_OPTIONS[ids[0] - 1];
    if (!opt) return null;
    return { label: opt.label, needsCustom: ids[0] === 4 };
  }
  const t = text.trim();
  if (t.length >= 3) return { label: t, needsCustom: false };
  return null;
}

export function parseMenuOrFreeText(
  text: string,
  options: readonly { id: string; label: string }[],
): string | null {
  const ids = parseChoiceIds(text, options.length);
  if (ids.length === 1) return options[ids[0] - 1]?.label ?? null;
  const t = text.trim();
  if (t.length >= 2) return t;
  return null;
}

export function buildJobTiming(input: {
  category: string;
  mealFrequency?: string | null;
  workShift?: string | null;
  customShift?: string | null;
}): string {
  const parts: string[] = [];
  if (input.mealFrequency) parts.push(input.mealFrequency);
  const shift = input.customShift?.trim() || input.workShift?.trim();
  if (shift) parts.push(shift);
  if (parts.length > 0) return parts.join(" · ");
  return "As discussed";
}

export function buildJobDescription(input: {
  category: string;
  city: string;
  mealFrequency?: string | null;
  timing?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  preferredGender?: string | null;
  requiredDocuments?: string[] | null;
}): string {
  const bits = [`${input.category} role in ${input.city || "Gurugram"}.`];
  if (input.mealFrequency) bits.push(`Frequency: ${input.mealFrequency}.`);
  if (input.timing) bits.push(`Timing: ${input.timing}.`);
  if (input.minAge != null || input.maxAge != null) {
    if (input.minAge != null && input.maxAge != null) bits.push(`Age: ${input.minAge}–${input.maxAge}.`);
    else if (input.minAge != null) bits.push(`Age: ${input.minAge}+.`);
    else if (input.maxAge != null) bits.push(`Age: up to ${input.maxAge}.`);
  }
  if (input.preferredGender && input.preferredGender !== "any") {
    bits.push(`Gender: ${genderLabel(input.preferredGender)}.`);
  }
  if (input.requiredDocuments?.includes(DOCUMENT_AADHAAR)) {
    bits.push("Aadhaar card required.");
  }
  return bits.join(" ");
}
