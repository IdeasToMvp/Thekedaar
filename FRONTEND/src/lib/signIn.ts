export const LOGIN_PATH = "/login";
/** Marketing home page. */
export const JOBS_HOME_PATH = "/";
/** Signed-in app shell (nav, apply, filters). */
export const APP_FEED_PATH = "/feed";
/** @deprecated Use JOBS_HOME_PATH or APP_FEED_PATH explicitly. */
export const FEED_PATH = APP_FEED_PATH;

/** Landing-only paths — after magic-link sign-in, send users to the app instead. */
export function isPublicJobsReturnPath(path: string): boolean {
  const p = path.split("?")[0] ?? path;
  return p === JOBS_HOME_PATH || p === "/#jobs";
}

/** Signed-in app destination (feed or employer listings). */
export function signedInAppPath(opts?: {
  intent?: "apply" | "hire";
  canHire?: boolean;
  canSeek?: boolean;
}): string {
  if (opts?.intent === "hire" || (opts?.canHire && !opts?.canSeek)) {
    return "/feed/my-listings";
  }
  return APP_FEED_PATH;
}

/** Default returnTo for /login when none specified. */
export function defaultReturnAfterAuth(intent?: "apply" | "hire"): string {
  return signedInAppPath({ intent });
}

/** After magic link: honor deep links; map old landing returnTo to app routes. */
export function destinationAfterMagicLink(
  user: { can_hire?: boolean; can_seek?: boolean },
  returnToParam: string | null | undefined,
  intent?: "apply" | "hire",
): string {
  if (
    returnToParam &&
    returnToParam.startsWith("/") &&
    !returnToParam.startsWith("/login") &&
    !isPublicJobsReturnPath(returnToParam)
  ) {
    return returnToParam;
  }
  return signedInAppPath({
    intent,
    canHire: user.can_hire,
    canSeek: user.can_seek,
  });
}

/** Normalize return paths on /login page (guest flow). */
export function normalizeReturnTo(path: string, intent?: "apply" | "hire"): string {
  if (isPublicJobsReturnPath(path)) return defaultReturnAfterAuth(intent);
  return path;
}

export type LoginQuery = {
  returnTo?: string;
  intent?: "apply" | "hire";
  jobId?: string;
};

/** Build `/login` URL with optional return path and job context. */
export function loginUrl(query: LoginQuery = {}): string {
  const params = new URLSearchParams();
  if (query.returnTo) params.set("returnTo", query.returnTo);
  if (query.intent) params.set("intent", query.intent);
  if (query.jobId) params.set("jobId", query.jobId);
  const qs = params.toString();
  return qs ? `${LOGIN_PATH}?${qs}` : LOGIN_PATH;
}

export const signInHref = LOGIN_PATH;
