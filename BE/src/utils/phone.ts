/**
 * Normalize to WhatsApp-style digits (no +), matching how `msg.from` is stored in `users.phone`.
 * India-first: bare 10-digit numbers get +91 prefix as country code in the digit string.
 */
export function normalizePhoneForWhatsApp(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return null;
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
