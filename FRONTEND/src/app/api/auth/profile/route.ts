import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { beApiUrl } from "@/lib/beApi";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = beApiUrl("auth/profile");
  if (!url) {
    return NextResponse.json({ error: "Missing BE_API_BASE_URL" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await resp.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: resp.status });
  if (resp.ok && typeof data.sessionToken === "string") {
    res.cookies.set(cookieName, data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
