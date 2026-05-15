import { NextResponse } from "next/server";
import { beApiUrl } from "@/lib/beApi";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = body?.phone;
  if (typeof phone !== "string" || phone.trim().length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const url = beApiUrl("auth/request-login-link");
  if (!url) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() }),
      cache: "no-store",
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Backend unreachable";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
