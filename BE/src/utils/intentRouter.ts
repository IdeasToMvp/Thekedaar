import { normalizeText } from "./messageParser";

export type QuickCommand =
  | "hire"
  | "find_jobs"
  | "switch"
  | "post_job"
  | "work"
  | "apply"
  | null;

/** Slash-free commands users may send on WhatsApp */
export function parseQuickCommand(text: string): QuickCommand {
  const t = normalizeText(text);
  const compact = t.replace(/\s+/g, " ").trim();

  if (["hire", "hiring", "post job", "postjob", "post_job"].includes(compact)) return "hire";
  if (["find jobs", "findjobs", "find_job", "jobs", "naukri", "kaam"].includes(compact)) return "find_jobs";
  if (compact === "switch" || compact === "mode") return "switch";
  if (compact === "work" || compact === "apply") return compact === "apply" ? "apply" : "work";

  return null;
}

/** Hiring intent from natural language (Hinglish-friendly). */
export function detectHiringIntent(text: string): boolean {
  const t = normalizeText(text);
  if (t.length > 120) return false;
  const patterns = [
    /\bhire\b/,
    /\bhiring\b/,
    /\bneed\s+(a\s+)?(worker|staff|maid|cook|driver|helper|bande|aadmi|ladka|ladki)\b/,
    /\blooking\s+for\s+(a\s+)?(maid|cook|driver|helper|worker|staff)\b/,
    /\bwant\s+to\s+hire\b/,
    /\bstaff\s+chah/,
    /\bkaam\s+karw/,
    /\bnaukri\s+dena\b/,
    /chahiye.*(maid|cook|driver|helper)/,
  ];
  return patterns.some((p) => p.test(t));
}

/** Job-seeking intent from natural language. */
export function detectJobSeekingIntent(text: string): boolean {
  const t = normalizeText(text);
  if (t.length > 120) return false;
  const patterns = [
    /\bneed\s+job\b/,
    /\bneed\s+a\s+job\b/,
    /\blooking\s+for\s+work\b/,
    /\blooking\s+for\s+a\s+job\b/,
    /\bfind\s+(me\s+)?a\s+job\b/,
    /\bjob\s+chah/,
    /\bkaam\s+dhund/,
    /\bmujhe\s+kaam\b/,
    /\bnaukri\s+chah/,
  ];
  return patterns.some((p) => p.test(t));
}

export function flowLabelForStep(step: string): string {
  if (step.startsWith("WORKER_")) return "worker_onboarding";
  if (step.startsWith("RECRUITER_")) return "recruiter_onboarding";
  if (step === "CHOOSE_ROLE") return "idle";
  return "idle";
}
