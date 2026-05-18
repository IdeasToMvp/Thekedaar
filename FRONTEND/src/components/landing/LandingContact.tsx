import { LANDING_CONTACT } from "@/lib/landing/content";
import { LandingSection } from "./LandingSection";

const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();

export function LandingContact() {
  return (
    <LandingSection
      id="contact"
      title="Contact"
      description="Questions, feedback, or help with your account — reach us here."
      className="bg-background"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Location</p>
          <p className="mt-2 font-medium text-foreground">{LANDING_CONTACT.city}</p>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-muted">Email</p>
          <a href={`mailto:${LANDING_CONTACT.email}`} className="mt-2 inline-block font-medium text-brand hover:underline">
            {LANDING_CONTACT.email}
          </a>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">WhatsApp</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{LANDING_CONTACT.whatsappHint}</p>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Chat on WhatsApp
            </a>
          ) : (
            <p className="mt-4 text-sm text-muted">WhatsApp link coming soon.</p>
          )}
        </div>
      </div>
    </LandingSection>
  );
}
