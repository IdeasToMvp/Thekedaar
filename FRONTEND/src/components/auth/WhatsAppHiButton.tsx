import { whatsAppHiUrl } from "@/lib/whatsappLinks";

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.67.297-.118 1.758-.867 2.03-.967.273-.099.471-.148.67.15.297.119 1.758.867 2.03.967.297.099.471.148.67-.15.298-.119 1.758-.867 2.03-.967.273-.099.471-.148.67-.15-.297-.119-1.758-.867-2.03-.967-.271.099-.471.148-.67-.15-.298-.119-1.758-.867-2.03-.967-.297-.099-.471-.148-.67.15z" />
      <path d="M12.004 2a9.99 9.99 0 0 0-8.616 14.906L2 22l5.23-1.368A9.958 9.958 0 1 0 12.004 2zm0 18a7.96 7.96 0 0 1-4.061-1.113l-.291-.087-3.066.804.818-3.015-.189-.303A7.96 7.96 0 1 1 12.004 20z" />
    </svg>
  );
}

type Props = {
  className?: string;
  label?: string;
};

export function WhatsAppHiButton({ className = "", label = "Send Hi on WhatsApp" }: Props) {
  const url = whatsAppHiUrl(process.env.NEXT_PUBLIC_WHATSAPP_URL);

  if (!url) {
    return (
      <p className="text-sm text-muted">
        WhatsApp is not configured yet. Please try again later or contact support.
      </p>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white shadow-md shadow-[#25D366]/30 transition hover:bg-[#20bd5a] ${className}`}
    >
      <WhatsAppIcon />
      {label}
    </a>
  );
}
