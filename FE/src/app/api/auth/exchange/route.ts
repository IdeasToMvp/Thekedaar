import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== "string" || token.length < 10) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const beBase = process.env.BE_API_BASE_URL;
  if (!beBase) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";

  const resp = await fetch(`${beBase.replace(/\/$/, "")}/api/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json(data, { status: resp.status });
  }

  const sessionToken = data?.sessionToken;
  if (typeof sessionToken !== "string" || sessionToken.length < 20) {
    return NextResponse.json({ error: "Bad response from BE" }, { status: 502 });
  }

  const res = NextResponse.json({ ok: true, user: data.user ?? null });
  res.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

