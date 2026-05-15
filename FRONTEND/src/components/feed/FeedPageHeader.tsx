"use client";

import { useRouter } from "next/navigation";

export function FeedPageHeader() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="border-b border-border/60 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <p className="text-sm text-muted">
          You are signed in. Browse jobs and use <span className="font-medium text-foreground">Apply</span> or{" "}
          <span className="font-medium text-foreground">Hire</span> based on your profile.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
