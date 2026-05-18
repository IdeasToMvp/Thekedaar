import { createMagicLinkForUser } from "./magicLink.service";
import { getUserByPhone } from "./user.service";
import { sendWhatsAppText } from "./whatsapp.service";
import { normalizePhoneForWhatsApp } from "../utils/phone";

export type RequestLoginLinkResult =
  | { sent: true; messageId?: string; devLoginUrl?: string }
  | { sent: false; reason: "not_registered" };

function webBaseUrl(): string | null {
  const raw = process.env.WEB_BASE_URL?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, "");
  }
  const host = raw.replace(/\/$/, "");
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  return `${isLocal ? "http" : "https"}://${host}`;
}

function devLoginLinkExposeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.EXPOSE_LOGIN_LINK_IN_DEV === "true";
}

export async function requestLoginLinkViaWhatsApp(rawPhone: string): Promise<RequestLoginLinkResult> {
  const normalized = normalizePhoneForWhatsApp(rawPhone);
  if (!normalized) throw new Error("Invalid phone");

  const user = await getUserByPhone(normalized);
  if (!user) {
    console.info(`request-login-link: no user for phone ${normalized.slice(0, 4)}***`);
    return { sent: false, reason: "not_registered" };
  }

  const webBase = webBaseUrl();
  if (!webBase) {
    throw new Error("Missing WEB_BASE_URL");
  }

  const { token } = await createMagicLinkForUser({
    userId: user.id,
    phone: user.phone,
  });

  const url = `${webBase}/login/${token}?returnTo=${encodeURIComponent("/#jobs")}`;
  const body =
    "Here is your Thekedaar website link (tap to open — works once):\n\n" +
    url +
    "\n\nIf you didn’t ask for this, ignore this message.";

  try {
    const { messageId } = await sendWhatsAppText(normalized, body);
    console.info(`request-login-link: sent to ${normalized.slice(0, 4)}*** messageId=${messageId ?? "?"}`);
    return { sent: true, messageId };
  } catch (e: unknown) {
    if (devLoginLinkExposeEnabled()) {
      console.warn("request-login-link: WhatsApp send failed; exposing dev login URL:", url);
      console.warn(e);
      return { sent: true, devLoginUrl: url };
    }
    throw e;
  }
}
