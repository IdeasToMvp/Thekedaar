import type { IncomingTextMessage } from "../types/whatsapp";

/**
 * Normalize WhatsApp webhook payload into a simple text message.
 * MVP: only supports text messages.
 */
export function parseIncomingTextMessage(payload: unknown): IncomingTextMessage | null {
  const body = payload as any;

  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const message = value?.messages?.[0];

  if (!message) return null;
  if (message.type !== "text") return null;

  const from = message.from;
  const text = message.text?.body;
  if (typeof from !== "string" || typeof text !== "string") return null;

  return {
    from,
    text,
    messageId: typeof message.id === "string" ? message.id : undefined,
  };
}

export function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

