import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const beBase = process.env.BE_API_BASE_URL;
  if (!beBase) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const resp = await fetch(`${beBase.replace(/\/$/, "")}/api/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json(data, { status: resp.status });
  }

  const sessionToken = data?.sessionToken;
  const res = NextResponse.json({
    user: data.user,
    worker_profile: data.worker_profile,
  });

  if (typeof sessionToken === "string" && sessionToken.length > 20) {
    res.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}
