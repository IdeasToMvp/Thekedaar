import { createMagicLinkForUser } from "./magicLink.service";
import { getUserByPhone } from "./user.service";
import { sendWhatsAppText } from "./whatsapp.service";
import { normalizePhoneForWhatsApp } from "../utils/phone";

function webBaseUrl(): string | null {
  const raw = process.env.WEB_BASE_URL?.trim();
  if (!raw) return null;
  const host = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}`;
}

export async function requestLoginLinkViaWhatsApp(rawPhone: string): Promise<void> {
  const normalized = normalizePhoneForWhatsApp(rawPhone);
  if (!normalized) throw new Error("Invalid phone");

  const user = await getUserByPhone(normalized);
  if (!user) return;

  const webBase = webBaseUrl();
  if (!webBase) {
    throw new Error("Missing WEB_BASE_URL");
  }

  const { token } = await createMagicLinkForUser({
    userId: user.id,
    phone: user.phone,
    role: user.role as "worker" | "recruiter",
  });

  const url = `${webBase}/login/${token}`;
  const body =
    "Here is your Thekedaar website link (tap to open — works once):\n\n" +
    url +
    "\n\nIf you didn’t ask for this, ignore this message.";

  await sendWhatsAppText(normalized, body);
}
