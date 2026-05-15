import type { MeUser } from "@/lib/auth/types";
import { accountKind, isEmployerAccount, isWorkerAccount } from "@/lib/auth/accountRole";

export type PrimaryJobAction = "apply" | "hire";

/** Workers apply; employers use hire-style actions on job cards (rare on v1 feed). */
export function primaryJobAction(user: MeUser): PrimaryJobAction | null {
  if (isWorkerAccount(user)) return "apply";
  if (isEmployerAccount(user)) return "hire";
  return null;
}

export function isWorkerView(user: MeUser): boolean {
  return isWorkerAccount(user);
}

export function isRecruiterView(user: MeUser): boolean {
  return isEmployerAccount(user);
}

export function viewerModeLabel(user: MeUser): string {
  const kind = accountKind(user);
  if (kind === "employer") return "Employer";
  if (kind === "worker") return "Worker";
  return "Guest";
}
