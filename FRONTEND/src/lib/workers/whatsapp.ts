import { buildWhatsAppUrl } from "@/lib/jobs/whatsapp";

export function workerContactMessage(role: string, city: string): string {
  return `Hi, I saw your profile as ${role}${city ? ` in ${city}` : ""} on Thekedaar and would like to connect about work.`;
}

export { buildWhatsAppUrl };
