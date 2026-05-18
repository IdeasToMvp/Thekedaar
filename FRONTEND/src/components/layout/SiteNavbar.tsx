import Link from "next/link";
import { ThekedaarLogo } from "@/components/brand/ThekedaarLogo";
import { SignInLink } from "@/components/auth/SignInLink";

const navLinkClass = "transition hover:text-foreground";

const signInLinkClass =
  "inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark";

const homeLinkClass =
  "inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-slate-50";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
] as const;

type Props = {
  /** Login pages: show Home instead of Sign in. */
  hideSignIn?: boolean;
};

export function SiteNavbar({ hideSignIn = false }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <ThekedaarLogo variant="lockup" href="/" priority />

        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-muted md:gap-8 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={navLinkClass}>
              {label}
            </Link>
          ))}
          <Link href="/#privacy" className={navLinkClass}>
            Privacy
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {hideSignIn ? (
            <Link href="/" className={homeLinkClass}>
              Home
            </Link>
          ) : (
            <SignInLink className={signInLinkClass}>Sign in</SignInLink>
          )}
        </div>
      </div>
    </header>
  );
}
