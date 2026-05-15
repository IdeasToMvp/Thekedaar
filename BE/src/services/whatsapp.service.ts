import axios, { isAxiosError } from "axios";

export type WhatsAppSendResult = {
  messageId?: string;
};

export async function sendWhatsAppText(to: string, body: string): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  try {
    const { data } = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    const messageId =
      typeof data?.messages?.[0]?.id === "string" ? data.messages[0].id : undefined;
    return { messageId };
  } catch (e: unknown) {
    if (isAxiosError(e)) {
      const meta = e.response?.data as { error?: { message?: string; code?: number } } | undefined;
      const code = meta?.error?.code;
      const detail = meta?.error?.message ?? e.message;

      if (code === 131047 || detail.toLowerCase().includes("re-engagement")) {
        throw new Error(
          "WhatsApp requires you to message Thekedaar first (within 24h) before we can send a login link. Open WhatsApp, send Hi, then request the link again.",
        );
      }

      if (code === 190 || detail.toLowerCase().includes("authentication error")) {
        throw new Error(
          "WhatsApp access token is invalid or expired (error 190). In Meta Developer Console, generate a new token for your app with whatsapp_business_messaging, and update BE .env WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
        );
      }

      throw new Error(`WhatsApp API error${code != null ? ` (${code})` : ""}: ${detail}`);
    }
    throw e;
  }
}
