import Link from "next/link";
import { signInHref } from "@/lib/signIn";

const jobsLinkClass =
  "inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-slate-50";

const signInLinkClass =
  "inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark";

type Props = {
  /** Login / auth pages: show Open jobs on the right instead of Sign in. */
  hideSignIn?: boolean;
};

export function SiteNavbar({ hideSignIn = false }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm text-white">
            Tk
          </span>
          <span>Thekedaar</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium text-muted sm:flex">
          <Link href="/#how-it-works" className="transition hover:text-foreground">
            How it works
          </Link>
          {!hideSignIn ? (
            <Link href="/#jobs" className="transition hover:text-foreground">
              Open jobs
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
          {hideSignIn ? (
            <Link href="/#jobs" className={jobsLinkClass}>
              Open jobs
            </Link>
          ) : (
            <Link href={signInHref} className={signInLinkClass}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
