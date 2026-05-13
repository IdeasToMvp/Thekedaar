import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { supabaseAdmin } from "./supabase.service";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export type SessionClaims = {
  sub: string;
  phone: string;
  role: "worker" | "recruiter";
  hiring_enabled: boolean;
  seeking_enabled: boolean;
};

export async function createMagicLinkForUser(input: {
  userId: string;
  phone: string;
  role: "worker" | "recruiter";
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

  const { data: user, error: userErr } = await sb
    .from("users")
    .select("id,phone,role,hiring_enabled,seeking_enabled")
    .eq("id", data.user_id)
    .maybeSingle();
  if (userErr) throw userErr;
  if (!user) throw new Error("User not found");

  const { error: updErr } = await sb
    .from("magic_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  if (updErr) throw updErr;

  const role = (user.role === "recruiter" ? "recruiter" : "worker") as "worker" | "recruiter";
  const hiring =
    typeof (user as { hiring_enabled?: boolean }).hiring_enabled === "boolean"
      ? (user as { hiring_enabled: boolean }).hiring_enabled
      : role === "recruiter";
  const seeking =
    typeof (user as { seeking_enabled?: boolean }).seeking_enabled === "boolean"
      ? (user as { seeking_enabled: boolean }).seeking_enabled
      : role === "worker";

  return {
    sub: user.id,
    phone: user.phone,
    role,
    hiring_enabled: hiring,
    seeking_enabled: seeking,
  };
}

export function signSessionJwt(claims: SessionClaims): string {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("Missing SESSION_JWT_SECRET");
  return jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: "30d" });
}

export function verifySessionJwt(token: string): SessionClaims {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("Missing SESSION_JWT_SECRET");
  const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload & Partial<SessionClaims>;

  const role = (decoded.role === "recruiter" ? "recruiter" : "worker") as "worker" | "recruiter";
  const hiring =
    typeof decoded.hiring_enabled === "boolean" ? decoded.hiring_enabled : role === "recruiter";
  const seeking =
    typeof decoded.seeking_enabled === "boolean" ? decoded.seeking_enabled : role === "worker";

  return {
    sub: String(decoded.sub),
    phone: String(decoded.phone),
    role,
    hiring_enabled: hiring,
    seeking_enabled: seeking,
  };
}

export function sessionClaimsFromUserRow(user: {
  id: string;
  phone: string;
  role: string;
  hiring_enabled?: boolean;
  seeking_enabled?: boolean;
}): SessionClaims {
  const role = (user.role === "recruiter" ? "recruiter" : "worker") as "worker" | "recruiter";
  const hiring =
    typeof user.hiring_enabled === "boolean" ? user.hiring_enabled : role === "recruiter";
  const seeking =
    typeof user.seeking_enabled === "boolean" ? user.seeking_enabled : role === "worker";
  return {
    sub: user.id,
    phone: user.phone,
    role,
    hiring_enabled: hiring,
    seeking_enabled: seeking,
  };
}
