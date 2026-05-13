import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = body?.phone;
  if (typeof phone !== "string" || phone.length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const beBase = process.env.BE_API_BASE_URL;
  if (!beBase) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  const resp = await fetch(`${beBase.replace(/\/$/, "")}/api/auth/request-login-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
    cache: "no-store",
  });

  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}
