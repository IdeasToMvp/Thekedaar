import { cookies } from "next/headers";
import { beApiUrl } from "@/lib/beApi";
import type { MeUser } from "@/lib/auth/types";

export async function getSessionUser(): Promise<MeUser | null> {
  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  const url = beApiUrl("auth/me");
  if (!url) return null;

  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { user?: MeUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}
