import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

export function supabaseBrowser() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // During Next.js build / prerender, env may be unset. Return null and let the UI
    // render a helpful configuration message on the client instead.
    return null;
  }

  _client = createClient(url, anonKey);
  return _client;
}

