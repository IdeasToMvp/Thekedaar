import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SignInCta } from "@/components/landing/SignInCta";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JobFeed } from "@/components/jobs/JobFeed";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <JobFeed />
        <SignInCta />
      </main>
      <SiteFooter />
    </>
  );
}
