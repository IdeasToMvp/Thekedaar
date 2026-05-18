"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { defaultReturnAfterAuth, JOBS_HOME_PATH, normalizeReturnTo } from "@/lib/signIn";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function LoginTokenClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = typeof params.token === "string" ? params.token : "";
  const intentParam = searchParams.get("intent");
  const intent = intentParam === "apply" || intentParam === "hire" ? intentParam : undefined;
  const returnToParam = searchParams.get("returnTo");
  const returnTo =
    returnToParam && returnToParam.startsWith("/") && !returnToParam.startsWith("/login")
      ? normalizeReturnTo(returnToParam, intent)
      : defaultReturnAfterAuth(intent);

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    if (!token || token.length < 40) {
      setStatus("error");
      setMessage("This sign-in link is invalid.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const resp = await fetch("/api/auth/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          if (!cancelled) {
            setStatus("error");
            setMessage(typeof data?.error === "string" ? data.error : "Sign-in failed.");
          }
          return;
        }
        if (!cancelled) {
          setStatus("ok");
          setMessage("Signed in. Redirecting…");
          const dest = returnTo.startsWith("/") ? returnTo : JOBS_HOME_PATH;
          router.replace(dest);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Could not reach the server. Try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, returnTo, router]);

  return (
    <AuthShell title="Completing sign-in" subtitle="Please wait while we verify your link.">
      <div className="space-y-4 text-center">
        {status === "loading" ? (
          <div
            className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent"
            aria-hidden
          />
        ) : null}
        <p
          className={`text-sm font-medium ${status === "error" ? "text-red-800" : "text-foreground"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
        {status === "error" ? (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Request a new link
          </Link>
        ) : null}
      </div>
    </AuthShell>
  );
}
