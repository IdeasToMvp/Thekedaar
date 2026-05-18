import { LANDING_ABOUT } from "@/lib/landing/content";
import { LandingSection } from "./LandingSection";

export function LandingAbout() {
  return (
    <LandingSection id="about" title={LANDING_ABOUT.title} className="bg-background">
      <div className="max-w-3xl space-y-4 text-sm leading-relaxed sm:text-base">
        {LANDING_ABOUT.paragraphs.map((p) => (
          <p key={p.slice(0, 24)} className="text-foreground/90">
            {p}
          </p>
        ))}
      </div>
    </LandingSection>
  );
}
