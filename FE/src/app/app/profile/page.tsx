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
  name: string | null;
  city: string | null;
  current_mode: "worker" | "recruiter";
  can_seek: boolean;
  can_hire: boolean;
  subscription?: { plan: string; features?: Record<string, boolean> };
};

export type WorkerProfile = {
  user_id: string;
  role: string | null;
  experience_years: number | null;
  expected_salary: number | null;
  availability: string | null;
} | null;

export type RecruiterProfile = {
  user_id: string;
  business_name: string | null;
  hiring_type: string | null;
  company_name: string | null;
} | null;

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modeSaving, setModeSaving] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [wp, setWp] = useState<WorkerProfile>(null);
  const [rp, setRp] = useState<RecruiterProfile>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availability, setAvailability] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [hiringType, setHiringType] = useState("");
  const [companyName, setCompanyName] = useState("");

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
    setRp(data.recruiter_profile ?? null);
    setName(u.name ?? "");
    setCity(u.city ?? "");
    const w = data.worker_profile as WorkerProfile;
    if (w) {
      setJobRole(w.role ?? "");
      setExperienceYears(w.experience_years != null ? String(w.experience_years) : "");
      setExpectedSalary(w.expected_salary != null ? String(w.expected_salary) : "");
      setAvailability(w.availability ?? "");
    } else {
      setJobRole("");
      setExperienceYears("");
      setExpectedSalary("");
      setAvailability("");
    }
    const r = data.recruiter_profile as RecruiterProfile;
    if (r) {
      setBusinessName(r.business_name ?? "");
      setHiringType(r.hiring_type ?? "");
      setCompanyName(r.company_name ?? "");
    } else {
      setBusinessName("");
      setHiringType("");
      setCompanyName("");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  async function switchAppMode(mode: "worker" | "recruiter") {
    setError(null);
    setModeSaving(true);
    try {
      const resp = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_mode: mode }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not switch mode");
        return;
      }
      if (data.user) setUser(data.user as MeUser);
      if ("worker_profile" in data) setWp(data.worker_profile ?? null);
      if ("recruiter_profile" in data) setRp(data.recruiter_profile ?? null);
    } finally {
      setModeSaving(false);
    }
  }

  async function save() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim() || null,
        city: city.trim() || null,
      };

      const hasWorker =
        !!user?.can_seek ||
        !!jobRole.trim() ||
        !!experienceYears.trim() ||
        !!expectedSalary.trim() ||
        !!availability.trim();
      if (hasWorker) {
        payload.worker = {
          role: jobRole.trim() || null,
          experience_years: experienceYears.trim() ? Number(experienceYears) : null,
          expected_salary: expectedSalary.trim() ? Number(expectedSalary) : null,
          availability: availability.trim() || null,
        };
      }

      const hasRecruiter =
        !!user?.can_hire ||
        !!businessName.trim() ||
        !!hiringType.trim() ||
        !!companyName.trim();
      if (hasRecruiter) {
        payload.recruiter = {
          business_name: businessName.trim() || null,
          hiring_type: hiringType.trim() || null,
          company_name: companyName.trim() || null,
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
      if ("recruiter_profile" in data) setRp(data.recruiter_profile ?? null);
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
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Phone <span className="font-mono font-semibold text-slate-900">{user?.phone}</span> (from WhatsApp — not
            editable here)
          </p>
          <p className="mt-2 text-xs text-slate-500">
            You are not a fixed “worker” or “recruiter” type — keep both profiles if you hire and also look for work.
          </p>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">App view</p>
            <p className="mt-1 text-xs text-slate-500">Switch anytime — no new login.</p>
            <div className="mt-3 flex gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={modeSaving || user?.current_mode === "worker"}
                onClick={() => void switchAppMode("worker")}
                className={`flex-1 rounded-2xl border-2 py-3 text-sm font-semibold transition ${
                  user?.current_mode === "worker"
                    ? "border-teal-500 bg-teal-50 text-teal-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                Looking for job
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={modeSaving || user?.current_mode === "recruiter"}
                onClick={() => void switchAppMode("recruiter")}
                className={`flex-1 rounded-2xl border-2 py-3 text-sm font-semibold transition ${
                  user?.current_mode === "recruiter"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                Hiring
              </motion.button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Seeker profile: {user?.can_seek ? "on" : "off"} · Hirer profile: {user?.can_hire ? "on" : "off"}
            </p>
          </div>

          <div className="mt-8 space-y-6">
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

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 border-t border-slate-200/80 pt-6"
            >
              <h2 className="text-sm font-bold text-slate-900">Looking for work</h2>
              <p className="text-xs text-slate-500">Job role you want (cook, maid, driver…), pay expectation, availability.</p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Role / job type</label>
                <input
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
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

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 border-t border-slate-200/80 pt-6"
            >
              <h2 className="text-sm font-bold text-slate-900">Hiring</h2>
              <p className="text-xs text-slate-500">Household, PG, contractor, company — however you hire.</p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Business / household name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="e.g. Sharma household, PG Rose"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Hiring type</label>
                <input
                  value={hiringType}
                  onChange={(e) => setHiringType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="e.g. household, contractor, retail, PG"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Company name (optional)</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  placeholder="If applicable"
                />
              </div>
            </motion.div>

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
              {saving ? "Saving…" : "Save profiles"}
            </motion.button>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <h2 className="text-sm font-bold text-slate-900">Session</h2>
              <p className="mt-1 text-xs text-slate-500">
                Sign out on this device. Use the Feed link above to go back to listings.
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => void logout()}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50 sm:w-auto sm:min-w-[200px]"
              >
                Logout
              </motion.button>
            </div>
          </div>
        </ElevatedCard>
      </div>
    </PageShell>
  );
}
