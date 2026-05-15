"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AccountKind } from "@/lib/auth/accountRole";
import { accountKind } from "@/lib/auth/accountRole";
import { useFeedUser } from "./FeedUserProvider";

type Props = {
  allow: AccountKind;
  children: React.ReactNode;
};

/** Redirect if signed-in user is not the expected account kind. */
export function AccountGate({ allow, children }: Props) {
  const router = useRouter();
  const { user, userLoading } = useFeedUser();

  useEffect(() => {
    if (userLoading || !user) return;
    const kind = accountKind(user);
    if (!kind) {
      router.replace("/feed/profile");
      return;
    }
    if (kind !== allow) {
      router.replace(kind === "employer" ? "/feed/my-listings" : "/feed");
    }
  }, [user, userLoading, allow, router]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (accountKind(user) !== allow) return null;

  return <>{children}</>;
}
