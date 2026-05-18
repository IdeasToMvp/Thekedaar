import { buildWhatsAppUrl } from "@/lib/jobs/whatsapp";

const DEFAULT_ONBOARDING_TEXT = "Hi";

/** Build wa.me link with pre-filled text from NEXT_PUBLIC_WHATSAPP_URL or raw digits. */
export function whatsAppHiUrl(configuredUrl: string | undefined, text = DEFAULT_ONBOARDING_TEXT): string | null {
  if (!configuredUrl?.trim()) return null;
  const digits = configuredUrl.trim().replace(/\D/g, "");
  if (digits.length < 10) return null;
  return buildWhatsAppUrl(digits, text);
}
