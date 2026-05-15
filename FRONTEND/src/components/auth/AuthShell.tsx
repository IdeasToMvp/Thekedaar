import type { ReactNode } from "react";
import { SiteNavbar } from "@/components/layout/SiteNavbar";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <SiteNavbar hideSignIn />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-lg">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Sign in</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-slate-900/5 sm:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
