export const LOGIN_PATH = "/login";
/** Public job listings on the marketing home page. */
export const JOBS_HOME_PATH = "/";
/** Signed-in app shell (nav, apply, filters). */
export const APP_FEED_PATH = "/feed";
/** @deprecated Use JOBS_HOME_PATH or APP_FEED_PATH explicitly. */
export const FEED_PATH = APP_FEED_PATH;

/** Where to send users after sign-in when no returnTo is provided. */
export function defaultReturnAfterAuth(intent?: "apply" | "hire"): string {
  if (intent === "hire") return "/feed/my-listings";
  return JOBS_HOME_PATH;
}

/** Normalize return paths from middleware or old links. */
export function normalizeReturnTo(path: string, intent?: "apply" | "hire"): string {
  if (path === APP_FEED_PATH && intent !== "hire") return JOBS_HOME_PATH;
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
