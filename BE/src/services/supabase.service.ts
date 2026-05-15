import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function assertServiceRoleKey(key: string) {
  const parts = key.split(".");
  if (parts.length < 2) return;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      role?: string;
    };
    if (payload.role && payload.role !== "service_role") {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY JWT role is "${payload.role}", not "service_role". ` +
          "In Supabase → Project Settings → API, copy the service_role secret (not anon/publishable).",
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")) throw e;
  }
}

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  assertServiceRoleKey(serviceRoleKey);

  _client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}

