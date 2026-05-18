"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { accountKind } from "@/lib/auth/accountRole";
import type { MeUser } from "@/lib/auth/types";
import { loginUrl, signedInAppPath, type LoginQuery } from "@/lib/signIn";

type Props = LoginQuery & {
  className?: string;
  children: React.ReactNode;
};

function destinationForLoggedInUser(user: MeUser, returnTo?: string, intent?: LoginQuery["intent"]): string {
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("/login")) {
    return returnTo;
  }
  const kind = accountKind(user);
  if (kind === "employer") return "/feed/my-listings";
  if (kind === "worker") return signedInAppPath({ intent });
  return signedInAppPath({ intent });
}

/** Guests → /login; signed-in users → /feed (or returnTo). */
export function SignInLink({ className, children, returnTo, intent, jobId }: Props) {
  const router = useRouter();
  const [href, setHref] = useState(() => loginUrl({ returnTo, intent, jobId }));
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.user) return;
        setLoggedIn(true);
        setHref(destinationForLoggedInUser(data.user as MeUser, returnTo, intent));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [returnTo, intent, jobId]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!loggedIn) return;
      e.preventDefault();
      router.push(href);
    },
    [loggedIn, href, router],
  );

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
