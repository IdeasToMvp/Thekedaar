"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { destinationAfterMagicLink } from "@/lib/signIn";
import type { MeUser } from "@/lib/auth/types";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function LoginTokenClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = typeof params.token === "string" ? params.token : "";
  const intentParam = searchParams.get("intent");
  const intent = intentParam === "apply" || intentParam === "hire" ? intentParam : undefined;
  const returnToParam = searchParams.get("returnTo");

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
        const data = (await resp.json().catch(() => ({}))) as {
          error?: string;
          user?: MeUser | null;
        };
        if (!resp.ok) {
          if (!cancelled) {
            setStatus("error");
            setMessage(typeof data?.error === "string" ? data.error : "Sign-in failed.");
          }
          return;
        }
        const user = data.user;
        if (!user) {
          if (!cancelled) {
            setStatus("error");
            setMessage("Sign-in failed. Please request a new link.");
          }
          return;
        }
        if (!cancelled) {
          setStatus("ok");
          setMessage("Signed in. Redirecting…");
          const dest = destinationAfterMagicLink(user, returnToParam, intent);
          window.location.assign(dest);
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
  }, [token, returnToParam, intent]);

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
          <div className="space-y-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Request a new link
            </Link>
            <p className="text-xs text-muted">
              Links work once. If you already opened this link, request a new one.
            </p>
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
