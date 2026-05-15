import { formatPhoneDisplay } from "@/lib/workers/formatPhone";
import { formatContactLocationLines } from "@/lib/contact/formatContactLines";

type Props = {
  title: string;
  name: string;
  phone: string;
  city?: string | null;
  sector?: string | null;
  fullAddress?: string | null;
  workAddress?: string | null;
};

export function ContactDetailsCard({ title, name, phone, city, sector, fullAddress, workAddress }: Props) {
  const locationLines = formatContactLocationLines({ city, sector, fullAddress, workAddress });
  const phoneDigits = phone.replace(/\D/g, "");

  return (
    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">{title}</p>
      <p className="mt-1 font-medium text-foreground">{name}</p>
      {phoneDigits.length >= 10 ? (
        <a href={`tel:${phoneDigits}`} className="mt-0.5 inline-block font-semibold text-brand hover:underline">
          {formatPhoneDisplay(phone)}
        </a>
      ) : null}
      {locationLines.length > 0 ? (
        <p className="mt-1 text-xs leading-relaxed text-muted">{locationLines.join(" · ")}</p>
      ) : null}
    </div>
  );
}
