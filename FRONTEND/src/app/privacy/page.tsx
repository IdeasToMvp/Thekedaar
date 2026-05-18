import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { ThekeCreditsTerms } from "@/components/credits/ThekeCreditsTerms";
import { LANDING_CONTACT, LANDING_PRIVACY_SUMMARY } from "@/lib/landing/content";

export const metadata = {
  title: "Privacy policy — Thekedaar",
  description: "How Thekedaar collects and uses your information.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          ← Back to home
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold text-foreground">Privacy policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {new Date().getFullYear()}</p>

        <div className="prose prose-slate mt-8 max-w-none space-y-6 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {LANDING_PRIVACY_SUMMARY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
            <p className="mt-2">
              Phone number, name, city, sector, profile details (skills, experience, business name), job listings,
              applications, and messages needed to operate WhatsApp sign-in and notifications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
            <p className="mt-2">
              To match workers and employers, show listings, process applications, send login links, and improve the
              service. We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Theke Credits (employers)</h2>
            <p className="mt-2">
              Employers may add prepaid balance called Theke Credits to pay for digital hiring features on the
              platform (for example, posting jobs beyond free quota or unlocking worker contact). Payment partners
              process top-ups; we record your balance and usage in our systems.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-slate-50/80 p-4">
              <ThekeCreditsTerms />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Sharing</h2>
            <p className="mt-2">
              Contact details are shared with the other party only when you apply, approve an application, post a job,
              or use Contact / hire flows as designed in the product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              Questions:{" "}
              <a href={`mailto:${LANDING_CONTACT.email}`} className="font-medium text-brand hover:underline">
                {LANDING_CONTACT.email}
              </a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
