import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingAbout } from "@/components/landing/LandingAbout";
import { LandingContact } from "@/components/landing/LandingContact";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingPrivacy } from "@/components/landing/LandingPrivacy";
import { SignInCta } from "@/components/landing/SignInCta";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <LandingAbout />
        <LandingFaq />
        <LandingContact />
        <LandingPrivacy />
        <SignInCta />
      </main>
      <SiteFooter />
    </>
  );
}
