import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { supabaseAdmin } from "./supabase.service";
import { assertUserCanAuthenticate } from "./accountLifecycle.service";
import { getUserCapabilities, getUserWithProfiles } from "./user.service";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** JWT reflects current UI mode + which profiles exist (not a permanent account type). */
export type SessionClaims = {
  sub: string;
  phone: string;
  current_mode: "worker" | "recruiter";
  can_seek: boolean;
  can_hire: boolean;
};

export async function createMagicLinkForUser(input: {
  userId: string;
  phone?: string;
  ttlMinutes?: number;
}): Promise<{ token: string; expiresAt: string }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  const ttlMinutes = input.ttlMinutes ?? 60 * 24 * 7;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

  const sb = supabaseAdmin();
  const { error } = await sb.from("magic_link_tokens").insert({
    user_id: input.userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw error;

  return { token: rawToken, expiresAt };
}

export async function sessionClaimsForUserId(userId: string): Promise<SessionClaims> {
  const full = await getUserWithProfiles(userId);
  if (!full) throw new Error("User not found");
  const caps = await getUserCapabilities(userId);
  const mode = full.user.current_mode === "recruiter" ? "recruiter" : "worker";
  return {
    sub: full.user.id,
    phone: full.user.phone,
    current_mode: mode,
    can_seek: caps.can_seek,
    can_hire: caps.can_hire,
  };
}

export async function exchangeMagicLinkToken(rawToken: string): Promise<SessionClaims> {
  const sb = supabaseAdmin();
  const tokenHash = sha256Hex(rawToken);

  const { data, error } = await sb
    .from("magic_link_tokens")
    .select("id,user_id,expires_at,used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Invalid token");

  if (data.used_at) throw new Error("Token already used");
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error("Token expired");

  const { error: updErr } = await sb
    .from("magic_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  if (updErr) throw updErr;

  await assertUserCanAuthenticate(data.user_id);
  return sessionClaimsForUserId(data.user_id);
}

export function signSessionJwt(claims: SessionClaims): string {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("Missing SESSION_JWT_SECRET");
  return jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: "30d" });
}

export function verifySessionJwt(token: string): SessionClaims {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("Missing SESSION_JWT_SECRET");
  const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload &
    Partial<SessionClaims> & {
      hiring_enabled?: boolean;
      seeking_enabled?: boolean;
      role?: string;
    };

  if (
    typeof decoded.can_seek === "boolean" &&
    typeof decoded.can_hire === "boolean" &&
    typeof decoded.current_mode === "string"
  ) {
    return {
      sub: String(decoded.sub),
      phone: String(decoded.phone),
      current_mode: decoded.current_mode === "recruiter" ? "recruiter" : "worker",
      can_seek: decoded.can_seek,
      can_hire: decoded.can_hire,
    };
  }

  const role = decoded.role === "recruiter" ? "recruiter" : "worker";
  const hiring =
    typeof decoded.hiring_enabled === "boolean" ? decoded.hiring_enabled : role === "recruiter";
  const seeking =
    typeof decoded.seeking_enabled === "boolean" ? decoded.seeking_enabled : role === "worker";

  return {
    sub: String(decoded.sub),
    phone: String(decoded.phone),
    current_mode: hiring && !seeking ? "recruiter" : "worker",
    can_seek: seeking,
    can_hire: hiring,
  };
}
