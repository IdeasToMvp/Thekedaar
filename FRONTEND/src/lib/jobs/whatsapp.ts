export function buildWhatsAppUrl(digits: string, message: string): string {
  const phone = digits.replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
}

export function applyMessage(jobTitle: string, city: string): string {
  return `Hi, I'm interested in the "${jobTitle}" job${city ? ` in ${city}` : ""} on Thekedaar.`;
}

export function hireMessage(jobTitle: string, city: string): string {
  return `Hi, I'd like to discuss hiring for "${jobTitle}"${city ? ` in ${city}` : ""} via Thekedaar.`;
}
