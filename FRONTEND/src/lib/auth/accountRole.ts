import type { MeUser } from "./types";

/** Fixed account surface on v1 — no role switching in the UI. */
export type AccountKind = "employer" | "worker";

/**
 * Which experience the user sees. Uses BE flags; if both profiles exist,
 * `current_mode` is respected but cannot be changed from the app.
 */
export function accountKind(user: MeUser): AccountKind | null {
  if (user.can_hire && !user.can_seek) return "employer";
  if (user.can_seek && !user.can_hire) return "worker";
  if (user.can_hire && user.can_seek) {
    return user.current_mode === "recruiter" ? "employer" : "worker";
  }
  return null;
}

export function isEmployerAccount(user: MeUser): boolean {
  return accountKind(user) === "employer";
}

export function isWorkerAccount(user: MeUser): boolean {
  return accountKind(user) === "worker";
}

export function accountKindLabel(kind: AccountKind): string {
  return kind === "employer" ? "Employer" : "Worker";
}
