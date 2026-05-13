import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const beBase = process.env.BE_API_BASE_URL;
  if (!beBase) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const resp = await fetch(`${beBase.replace(/\/$/, "")}/api/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json(data, { status: resp.status });
  }
  return NextResponse.json(data);
}
