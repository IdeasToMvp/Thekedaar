import { SignInLink } from "@/components/auth/SignInLink";

export function SignInCta() {
  return (
    <section className="border-t border-border/60 bg-surface py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ready to apply or post a job?</h2>
          <p className="mt-1 text-sm text-muted">
            Sign in with the WhatsApp link we send you — no password on the website.
          </p>
        </div>
        <SignInLink className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-dark sm:w-auto">
          Sign in
        </SignInLink>
      </div>
    </section>
  );
}
