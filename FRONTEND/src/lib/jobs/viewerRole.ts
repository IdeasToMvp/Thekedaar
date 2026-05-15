import type { MeUser } from "@/lib/auth/types";

export type PrimaryJobAction = "apply" | "hire";

/** What the primary CTA should be on job cards for this user. */
export function primaryJobAction(user: MeUser): PrimaryJobAction | null {
  if (user.can_seek && user.can_hire) {
    return user.current_mode === "recruiter" ? "hire" : "apply";
  }
  if (user.can_seek) return "apply";
  if (user.can_hire) return "hire";
  return null;
}

export function isWorkerView(user: MeUser): boolean {
  const action = primaryJobAction(user);
  return action === "apply";
}

export function isRecruiterView(user: MeUser): boolean {
  const action = primaryJobAction(user);
  return action === "hire";
}

export function viewerModeLabel(user: MeUser): string {
  if (user.can_seek && user.can_hire) {
    return user.current_mode === "recruiter" ? "Hiring" : "Looking for work";
  }
  if (user.can_seek) return "Looking for work";
  if (user.can_hire) return "Hiring";
  return "Guest";
}
