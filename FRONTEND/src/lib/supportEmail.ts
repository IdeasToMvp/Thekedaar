/** Default support inbox when NEXT_PUBLIC_SUPPORT_EMAIL is unset. */
const DEFAULT_SUPPORT_EMAIL = "laddi0399@gmail.com";

/** Support contact for employers and workers (landing, privacy, errors). */
export function getSupportEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  if (fromEnv && fromEnv.includes("@")) return fromEnv;
  return DEFAULT_SUPPORT_EMAIL;
}

export const SUPPORT_EMAIL = getSupportEmail();
