"use client";

import { useEffect } from "react";
import type { FeedWorker, HiredWorker } from "@/lib/workers/types";
import { formatRelativeTime, formatSalary } from "@/lib/formatRelativeTime";
import { workerOrJobLocation } from "@/lib/location/publicLocation";
import { formatPhoneDisplay } from "@/lib/workers/formatPhone";
import { buildWhatsAppUrl, workerContactMessage } from "@/lib/workers/whatsapp";
import { WorkerListingMeta } from "./WorkerListingMeta";

type Mode = "view" | "hire";

type Props = {
  open: boolean;
  mode: Mode;
  worker: FeedWorker | HiredWorker | null;
  onClose: () => void;
};

function roleEmoji(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("cook")) return "👨‍🍳";
  if (r.includes("maid") || r.includes("house")) return "🧹";
  if (r.includes("shop")) return "🛒";
  return "💼";
}

function isHiredWorker(w: FeedWorker | HiredWorker): w is HiredWorker {
  return "phone" in w && typeof (w as HiredWorker).phone === "string";
}

export function WorkerProfileModal({ open, mode, worker, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !worker) return null;

  const skills = worker.skills?.length ? worker.skills : worker.role ? [worker.role] : [];
  const location = workerOrJobLocation({
    publicLocation: worker.publicLocation,
    city: worker.city,
    sector: worker.sector,
  });
  const hired = mode === "hire" && isHiredWorker(worker);
  const waDigits = hired ? worker.contactWaDigits?.replace(/\D/g, "") ?? "" : "";
  const canWhatsApp = waDigits.length >= 10;
  const primarySkill = skills[0] ?? worker.role ?? "Worker";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worker-profile-title"
    >
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl">
        <div className="shrink-0 border-b border-border bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-white text-xl font-bold text-brand-dark shadow-sm"
              aria-hidden
            >
              {worker.avatarKey}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="worker-profile-title" className="font-serif text-xl font-bold text-foreground">
                {worker.displayName}
              </h2>
              {location && location !== "Location not set" ? (
                <p className="mt-0.5 text-sm text-muted">{location}</p>
              ) : null}
              {skills.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {skills.map((skill) => (
                    <li
                      key={skill}
                      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-white px-2 py-0.5 text-xs font-semibold text-foreground"
                    >
                      <span aria-hidden>{roleEmoji(skill)}</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-muted hover:bg-white/80 hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-lg font-bold text-brand">
            {worker.expectedSalary > 0 ? `${formatSalary(worker.expectedSalary)}/mo expected` : "Salary not set"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <WorkerListingMeta worker={worker} />

          {hired ? (
            <section className="mt-5 rounded-xl border border-brand/25 bg-brand/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">Contact</p>
              <p className="mt-1 text-base font-semibold text-foreground">{formatPhoneDisplay(worker.phone)}</p>
              {canWhatsApp ? (
                <a
                  href={buildWhatsAppUrl(
                    waDigits,
                    workerContactMessage(primarySkill, worker.city || location || ""),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-[#25D366] bg-white text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10"
                >
                  WhatsApp
                </a>
              ) : (
                <p className="mt-2 text-xs text-muted">WhatsApp number not available.</p>
              )}
            </section>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-slate-50/80 px-3 py-2.5 text-xs leading-relaxed text-muted">
              Phone and full address stay hidden until you tap <span className="font-semibold text-foreground">Hire</span> on
              the worker card.
            </p>
          )}

          <p className="mt-4 text-[11px] text-muted">
            Listed {formatRelativeTime(worker.listedAt)}
            {hired && worker.hiredAt ? ` · Contacted ${formatRelativeTime(worker.hiredAt)}` : ""}
          </p>
        </div>

        <div className="shrink-0 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-full border border-border bg-background text-sm font-semibold text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
