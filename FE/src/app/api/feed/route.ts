import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { beApiUrl } from "@/lib/beApi";

export const dynamic = "force-dynamic";

const FEED_PATHS = ["auth/feed", "jobs/feed"] as const;

export async function GET(req: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qs = req.nextUrl.searchParams.toString();
  const suffix = qs ? `?${qs}` : "";
  const headers = { Authorization: `Bearer ${token}` };

  let lastStatus = 502;
  let lastData: Record<string, unknown> = { error: "Backend unavailable" };

  for (const segment of FEED_PATHS) {
    const base = beApiUrl(segment);
    if (!base) {
      return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
    }

    let resp: Response;
    try {
      resp = await fetch(`${base}${suffix}`, { headers, cache: "no-store" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Backend unreachable";
      return NextResponse.json(
        { error: msg, hint: "Start the backend (BE) and set BE_API_BASE_URL to its origin, e.g. http://localhost:5000" },
        { status: 502 },
      );
    }

    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (resp.ok) {
      return NextResponse.json(data, {
        status: resp.status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    lastStatus = resp.status;
    lastData = data;
    if (resp.status !== 404) break;
  }

  return NextResponse.json(lastData, {
    status: lastStatus,
    headers: { "Cache-Control": "no-store" },
  });
}
