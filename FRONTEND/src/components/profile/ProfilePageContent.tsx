"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MeResponse, ProfilePatchBody, WorkerProfile } from "@/lib/auth/types";
import { ACTIVE_MARKET } from "@/lib/launch";
import { roleIdsToSkillLabels, skillLabelsToRoleIds } from "@/lib/launch/skillIds";
import { useFeedUser } from "@/components/feed/FeedUserProvider";
import { AppNavbar } from "@/components/feed/AppNavbar";
import { SkillMultiSelect } from "./SkillMultiSelect";

export function ProfilePageContent() {
  const { user, userLoading, cityId, setCityId, refreshUser } = useFeedUser();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [currentMode, setCurrentMode] = useState<"worker" | "recruiter">("worker");
  const [skillRoleIds, setSkillRoleIds] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availability, setAvailability] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hiringType, setHiringType] = useState("individual");
  const [enableWorker, setEnableWorker] = useState(false);
  const [enableRecruiter, setEnableRecruiter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: MeResponse) => {
        if (cancelled) return;
        setMe(data);
        if (data?.user) {
          setName(data.user.name ?? "");
          setCity(data.user.city ?? ACTIVE_MARKET.displayName);
          setCurrentMode(data.user.current_mode);
        }
        const wp = data.worker_profile as WorkerProfile | null | undefined;
        if (wp) {
          setEnableWorker(true);
          setSkillRoleIds(skillLabelsToRoleIds(wp.skills?.length ? wp.skills : wp.role ? [wp.role] : []));
          setExperienceYears(wp.experience_years != null ? String(wp.experience_years) : "");
          setExpectedSalary(wp.expected_salary != null ? String(wp.expected_salary) : "");
          setAvailability(wp.availability ?? "");
        }
        if (data.recruiter_profile) {
          setEnableRecruiter(true);
          setBusinessName(data.recruiter_profile.business_name ?? "");
          setCompanyName(data.recruiter_profile.company_name ?? "");
          setHiringType(data.recruiter_profile.hiring_type ?? "individual");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const body: ProfilePatchBody = {
      name: name.trim() || null,
      city: city.trim() || null,
      current_mode: currentMode,
    };

    if (enableWorker) {
      if (skillRoleIds.length === 0) {
        setError("Select at least one skill for your worker profile.");
        return;
      }
      const skills = roleIdsToSkillLabels(skillRoleIds);
      const exp = experienceYears.trim() ? Number(experienceYears) : null;
      const sal = expectedSalary.trim() ? Number(expectedSalary) : null;
      body.worker = {
        skills,
        role: skills[0] ?? null,
        experience_years: Number.isFinite(exp) ? exp : null,
        expected_salary: Number.isFinite(sal) ? sal : null,
        availability: availability.trim() || null,
      };
    }

    if (enableRecruiter) {
      body.recruiter = {
        business_name: businessName.trim() || null,
        company_name: companyName.trim() || null,
        hiring_type: hiringType.trim() || "individual",
      };
    }

    setSaving(true);
    try {
      const resp = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await resp.json()) as MeResponse & { error?: string };
      if (!resp.ok) throw new Error(data.error || "Could not save profile");
      setMe(data);
      await refreshUser();
      setSuccess("Profile saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading && !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-16 sm:px-6">
        <Link href="/feed" className="text-sm font-medium text-brand hover:underline">
          ← Back to feed
        </Link>

        <header className="mt-4">
          <h1 className="font-serif text-2xl font-bold text-foreground">Your profile</h1>
          <p className="mt-1 text-sm text-muted">Update how you appear to employers and workers on Thekedaar.</p>
        </header>

        {loading ? (
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-slate-200/60" />
        ) : (
          <form onSubmit={handleSave} className="mt-8 space-y-8">
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-base font-bold text-foreground">Account</h2>
              <p className="mt-0.5 text-xs text-muted">Phone: {user.phone}</p>

              <label className="mt-4 block text-sm font-medium text-foreground">
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  placeholder="Your name"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-foreground">
                City
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  placeholder={ACTIVE_MARKET.displayName}
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-foreground">
                Default view
                <select
                  value={currentMode}
                  onChange={(e) => setCurrentMode(e.target.value as "worker" | "recruiter")}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="worker">Looking for work</option>
                  <option value="recruiter">Hiring</option>
                </select>
              </label>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">Worker profile</h2>
                  <p className="mt-0.5 text-xs text-muted">Shown on the Workers tab when you are looking for work.</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enableWorker}
                    onChange={(e) => setEnableWorker(e.target.checked)}
                    className="accent-brand"
                  />
                  Active
                </label>
              </div>

              {enableWorker ? (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  <SkillMultiSelect selectedRoleIds={skillRoleIds} onChange={setSkillRoleIds} />
                  <label className="block text-sm font-medium text-foreground">
                    Experience (years)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Expected salary / month (₹)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Availability
                    <input
                      type="text"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="e.g. Immediate"
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </label>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">Employer profile</h2>
                  <p className="mt-0.5 text-xs text-muted">Required to post jobs and manage listings.</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enableRecruiter}
                    onChange={(e) => setEnableRecruiter(e.target.checked)}
                    className="accent-brand"
                  />
                  Active
                </label>
              </div>

              {enableRecruiter ? (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  <label className="block text-sm font-medium text-foreground">
                    Business / display name
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Company name <span className="font-normal text-muted">(optional)</span>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Hiring as
                    <select
                      value={hiringType}
                      onChange={(e) => setHiringType(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="individual">Individual / household</option>
                      <option value="business">Business</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </section>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
            ) : null}
            {success ? (
              <p className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand-dark">{success}</p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-12 rounded-full bg-brand-dark text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
