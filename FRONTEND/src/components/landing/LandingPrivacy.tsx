import Link from "next/link";
import { LANDING_PRIVACY_SUMMARY } from "@/lib/landing/content";
import { LandingSection } from "./LandingSection";

export function LandingPrivacy() {
  return (
    <LandingSection
      id="privacy"
      title="Privacy"
      description="How we handle your data on Thekedaar."
      className="bg-surface"
    >
      <ul className="max-w-3xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted">
        {LANDING_PRIVACY_SUMMARY.map((line) => (
          <li key={line.slice(0, 30)}>{line}</li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">
        <Link href="/privacy" className="font-semibold text-brand hover:underline">
          Read full privacy policy
        </Link>
      </p>
    </LandingSection>
  );
}
