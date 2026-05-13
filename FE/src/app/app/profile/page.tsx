"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ElevatedCard, PageShell } from "@/components/PageShell";

export type MeUser = {
  id: string;
  sub: string;
  phone: string;
  role: string;
  hiring_enabled: boolean;
  seeking_enabled: boolean;
  name: string | null;
  city: string | null;
  subscription?: { plan: string; features?: Record<string, boolean> };
};

export type WorkerProfile = {
  user_id: string;
  job_type: string | null;
  experience_years: number | null;
  expected_salary: number | null;
  availability: string | null;
} | null;

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [wp, setWp] = useState<WorkerProfile>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [hiring, setHiring] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [jobType, setJobType] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availability, setAvailability] = useState("");

  const load = useCallback(async () => {
    const resp = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.user) {
      router.replace("/login");
      return;
    }
    const u = data.user as MeUser;
    setUser(u);
    setWp(data.worker_profile ?? null);
    setName(u.name ?? "");
    setCity(u.city ?? "");
    setHiring(!!u.hiring_enabled);
    setSeeking(!!u.seeking_enabled);
    const w = data.worker_profile as WorkerProfile;
    if (w) {
      setJobType(w.job_type ?? "");
      setExperienceYears(w.experience_years != null ? String(w.experience_years) : "");
      setExpectedSalary(w.expected_salary != null ? String(w.expected_salary) : "");
      setAvailability(w.availability ?? "");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setError(null);
    setSaved(false);
    if (!hiring && !seeking) {
      setError("Turn on at least one: Hiring or Looking for work.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim() || null,
        city: city.trim() || null,
        hiring_enabled: hiring,
        seeking_enabled: seeking,
      };
      if (seeking) {
        payload.worker = {
          job_type: jobType.trim() || null,
          experience_years: experienceYears.trim() ? Number(experienceYears) : null,
          expected_salary: expectedSalary.trim() ? Number(expectedSalary) : null,
          availability: availability.trim() || null,
        };
      }
      const resp = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not save");
        return;
      }
      if (data.user) setUser(data.user as MeUser);
      if ("worker_profile" in data) setWp(data.worker_profile ?? null);
      setSaved(true);
      void load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-emerald-200 border-t-emerald-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm font-medium text-slate-600">Loading profile…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="pb-24 sm:pb-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/app"
            className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
          >
            ← Feed
          </Link>
        </div>

        <ElevatedCard size="lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Profile</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your details</h1>
          <p className="mt-2 text-sm text-slate-600">
            Phone <span className="font-mono font-semibold text-slate-900">{user?.phone}</span> (from WhatsApp — not
            editable here)
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">What do you want to do on Thekedaar?</h2>
              <p className="mt-1 text-xs text-slate-500">You can turn on both — post jobs and look for work.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/50">
                  <input
                    type="checkbox"
                    checked={hiring}
                    onChange={(e) => setHiring(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Hiring / recruiter</span>
                    <span className="mt-0.5 block text-xs text-slate-600">Post jobs and manage candidates</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
                  <input
                    type="checkbox"
                    checked={seeking}
                    onChange={(e) => setSeeking(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">Looking for work</span>
                    <span className="mt-0.5 block text-xs text-slate-600">Get matched to local jobs</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Delhi"
                />
              </div>
            </div>

            {seeking ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 border-t border-slate-200/80 pt-6"
              >
                <h2 className="text-sm font-bold text-slate-900">Job seeker details</h2>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Job type</label>
                  <input
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    placeholder="Maid, cook, driver…"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">Experience (years)</label>
                    <input
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      inputMode="numeric"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      placeholder="e.g. 2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">Expected salary / month</label>
                    <input
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      inputMode="numeric"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      placeholder="e.g. 15000"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">Availability</label>
                  <input
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    placeholder="Immediate, 1 week…"
                  />
                </div>
              </motion.div>
            ) : null}

            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            {saved ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900" role="status">
                Saved. Your session was refreshed.
              </p>
            ) : null}

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => void save()}
              disabled={saving}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
            >
              {saving ? "Saving…" : "Save changes"}
            </motion.button>
          </div>
        </ElevatedCard>
      </div>
    </PageShell>
  );
}
