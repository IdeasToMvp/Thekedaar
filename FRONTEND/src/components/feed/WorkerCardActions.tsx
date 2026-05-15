"use client";

import type { FeedWorker } from "@/lib/workers/types";
import type { MeUser } from "@/lib/auth/types";
import { isEmployerAccount } from "@/lib/auth/accountRole";

type Props = {
  worker: FeedWorker;
  user: MeUser;
};

export function WorkerCardActions({ worker, user }: Props) {
  const employerView = isEmployerAccount(user);
  const isOwn = Boolean(worker.isOwnProfile);

  if (isOwn) {
    return (
      <p className="mt-auto pt-3 text-xs text-muted">This is how employers see your profile (contact hidden).</p>
    );
  }

  if (employerView) {
    return (
      <p className="mt-auto pt-3 text-xs text-muted">
        Phone and full address are hidden. Only city/sector is shown. Contact flows will come in a later release.
      </p>
    );
  }

  return <p className="mt-auto pt-3 text-xs text-muted">Worker profiles are for employer accounts.</p>;
}
