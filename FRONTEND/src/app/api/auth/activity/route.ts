import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { beApiUrl } from "@/lib/beApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = beApiUrl("auth/activity");
  if (!url) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}
