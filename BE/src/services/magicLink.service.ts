import crypto from "crypto";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabase.service";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export type SessionClaims = {
  sub: string; // user id
  phone: string;
  role: "worker" | "recruiter";
};

export async function createMagicLinkForUser(input: {
  userId: string;
  phone: string;
  role: "worker" | "recruiter";
  ttlMinutes?: number;
}): Promise<{ token: string; expiresAt: string }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  const ttlMinutes = input.ttlMinutes ?? 60 * 24 * 7; // 7 days
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
    .select("id,phone,role")
    .eq("id", data.user_id)
    .maybeSingle();
  if (userErr) throw userErr;
  if (!user) throw new Error("User not found");

  const { error: updErr } = await sb
    .from("magic_link_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  if (updErr) throw updErr;

  return { sub: user.id, phone: user.phone, role: user.role as any };
}

export function signSessionJwt(claims: SessionClaims): string {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("Missing SESSION_JWT_SECRET");
  return jwt.sign(claims, secret, { algorithm: "HS256", expiresIn: "30d" });
}

export function verifySessionJwt(token: string): SessionClaims {
  const secret = process.env.SESSION_JWT_SECRET;
  if (!secret) throw new Error("Missing SESSION_JWT_SECRET");
  return jwt.verify(token, secret, { algorithms: ["HS256"] }) as SessionClaims;
}

