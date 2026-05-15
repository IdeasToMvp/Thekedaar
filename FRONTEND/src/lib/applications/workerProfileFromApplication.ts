import type { JobApplication } from "@/lib/jobs/applications";
import type { FeedWorker, HiredWorker } from "@/lib/workers/types";
import { workerOrJobLocation } from "@/lib/location/publicLocation";

type ApplicationWorker = NonNullable<JobApplication["worker"]>;

export function workerProfileFromApplication(
  worker: ApplicationWorker,
  opts: { includeContact: boolean },
): FeedWorker | HiredWorker {
  const skills = worker.skills?.length ? worker.skills : [];
  const displayName = worker.name?.trim() || "Worker";
  const base: FeedWorker = {
    id: worker.id,
    displayName,
    avatarKey: displayName.slice(0, 1).toUpperCase() || "?",
    role: skills[0] ?? "General",
    skills,
    city: worker.city ?? "",
    sector: worker.sector ?? undefined,
    publicLocation: workerOrJobLocation({ city: worker.city, sector: worker.sector }),
    age: worker.age,
    experienceYears: worker.experienceYears,
    availability: worker.availability ?? "",
    expectedSalary: 0,
    listedAt: new Date().toISOString(),
  };

  if (opts.includeContact && worker.phone) {
    const digits = worker.phone.replace(/\D/g, "");
    return {
      ...base,
      phone: worker.phone,
      contactWaDigits: digits,
      hiredAt: new Date().toISOString(),
    };
  }

  return base;
}
