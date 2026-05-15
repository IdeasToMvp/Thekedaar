import type { ApplicationStatus } from "@/lib/jobs/types";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
        Not selected
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
      Pending
    </span>
  );
}
