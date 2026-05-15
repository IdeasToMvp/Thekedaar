"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeUser } from "@/lib/auth/types";
import { isEmployerAccount, isWorkerAccount } from "@/lib/auth/accountRole";

type Props = {
  user: MeUser;
  className?: string;
  onNavigate?: () => void;
};

export function FeedNavLinks({ user, className = "", onNavigate }: Props) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    active
      ? "border-b-2 border-brand pb-0.5 text-foreground"
      : "text-muted transition hover:text-foreground";

  const employer = isEmployerAccount(user);
  const workerOnly = isWorkerAccount(user) && !employer;

  return (
    <nav className={className}>
      {workerOnly || isWorkerAccount(user) ? (
        <>
          <Link href="/feed" onClick={onNavigate} className={linkClass(pathname === "/feed")}>
            Find Jobs
          </Link>
          <Link
            href="/feed/applied"
            onClick={onNavigate}
            className={linkClass(pathname === "/feed/applied")}
          >
            Applied
          </Link>
        </>
      ) : null}
      {employer ? (
        <>
          <Link href="/feed" onClick={onNavigate} className={linkClass(pathname === "/feed")}>
            Find Workers
          </Link>
          <Link
            href="/feed/my-listings"
            onClick={onNavigate}
            className={linkClass(pathname === "/feed/my-listings")}
          >
            My Listings
          </Link>
          <Link
            href="/feed/applications"
            onClick={onNavigate}
            className={linkClass(pathname === "/feed/applications")}
          >
            Applications
          </Link>
          <Link
            href="/feed/contacted"
            onClick={onNavigate}
            className={linkClass(pathname === "/feed/contacted")}
          >
            Contacted
          </Link>
        </>
      ) : null}
    </nav>
  );
}
