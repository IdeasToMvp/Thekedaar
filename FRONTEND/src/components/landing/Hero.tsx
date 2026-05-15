import Image from "next/image";
import Link from "next/link";
import { SignInLink } from "@/components/auth/SignInLink";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-[70%_center] sm:object-right"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#faf6eb] via-[#faf6eb]/92 to-[#faf6eb]/25 sm:via-[#faf6eb]/75 sm:to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent sm:hidden"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Gurugram &amp; NCR</p>
        <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:max-w-2xl sm:text-5xl">
          Find kaam. Post naukri.{" "}
          <span className="text-brand">All on WhatsApp — browse jobs here first.</span>
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted sm:max-w-xl">
          Thekedaar connects workers and employers for daily wage, site, factory, and household jobs. No password
          needed to browse — sign in when you want to apply or post.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#jobs"
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
          >
            See open jobs
          </a>
          <SignInLink className="inline-flex h-12 items-center justify-center rounded-full border-2 border-border/80 bg-white/90 px-6 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm transition hover:bg-white">
            Sign in
          </SignInLink>
        </div>
        <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border/60 pt-8 sm:mt-12">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">For workers</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">Find nearby kaam</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">For employers</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">Post in minutes</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">On WhatsApp</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">Hindi + English</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
