export const LOGIN_PATH = "/login";
export const FEED_PATH = "/feed";

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
