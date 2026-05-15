import { NextRequest, NextResponse } from "next/server";
import { beApiUrl } from "@/lib/beApi";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = beApiUrl("jobs/feed");
  if (!url) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  const qs = req.nextUrl.searchParams.toString();
  const target = qs ? `${url}?${qs}` : url;

  try {
    const resp = await fetch(target, { cache: "no-store" });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: resp.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Backend unreachable";
    return NextResponse.json(
      {
        error: msg,
        hint: "Start the backend (BE) and set BE_API_BASE_URL, e.g. http://localhost:5000",
      },
      { status: 502 },
    );
  }
}
