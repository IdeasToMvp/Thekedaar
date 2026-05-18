import { LANDING_FAQ } from "@/lib/landing/content";
import { LandingSection } from "./LandingSection";

export function LandingFaq() {
  return (
    <LandingSection
      id="faq"
      title="FAQ"
      description="Common questions about signing in, privacy, and how Thekedaar works."
      className="bg-surface"
    >
      <ul className="divide-y divide-border rounded-2xl border border-border bg-background">
        {LANDING_FAQ.map((item) => (
          <li key={item.q} className="px-5 py-5 sm:px-6">
            <h3 className="font-semibold text-foreground">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
