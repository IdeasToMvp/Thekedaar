"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MeUser } from "@/lib/auth/types";
import { isWorkerView } from "@/lib/jobs/viewerRole";

type Props = {
  user: MeUser;
  className?: string;
  onNavigate?: () => void;
};

export function FeedNavLinks({ user, className = "", onNavigate }: Props) {
  const pathname = usePathname();
  const worker = isWorkerView(user);

  const linkClass = (active: boolean) =>
    active
      ? "border-b-2 border-brand pb-0.5 text-foreground"
      : "text-muted transition hover:text-foreground";

  return (
    <nav className={className}>
      <Link href="/feed" onClick={onNavigate} className={linkClass(pathname === "/feed")}>
        Find Jobs
      </Link>
      <Link href="/feed/profile" onClick={onNavigate} className={linkClass(pathname === "/feed/profile")}>
        Profile
      </Link>
      {worker ? (
        <span className="cursor-default text-muted" title="Coming soon">
          My Applications
        </span>
      ) : user.can_hire ? (
        <Link
          href="/feed/my-listings"
          onClick={onNavigate}
          className={linkClass(pathname === "/feed/my-listings")}
        >
          My Listings
        </Link>
      ) : null}
      <span className="cursor-default text-muted" title="Coming soon">
        Messages
      </span>
    </nav>
  );
}
