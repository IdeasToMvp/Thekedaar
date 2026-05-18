"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultReturnAfterAuth, JOBS_HOME_PATH, loginUrl, type LoginQuery } from "@/lib/signIn";

type Props = LoginQuery & {
  className?: string;
  children: React.ReactNode;
};

/** Logged-in users go to jobs home or returnTo; others to /login. */
export function SignInLink({ className, children, returnTo, intent, jobId }: Props) {
  const [href, setHref] = useState(() =>
    loginUrl({ returnTo: returnTo ?? defaultReturnAfterAuth(intent), intent, jobId }),
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.user) {
          const dest =
            returnTo && returnTo.startsWith("/") && !returnTo.startsWith("/login")
              ? returnTo
              : defaultReturnAfterAuth(intent);
          setHref(dest);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [returnTo, intent, jobId]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
