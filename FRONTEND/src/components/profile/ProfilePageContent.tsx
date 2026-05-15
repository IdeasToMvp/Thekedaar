"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MeResponse, ProfilePatchBody, WorkerProfile } from "@/lib/auth/types";
import { accountKind, accountKindLabel, isEmployerAccount, isWorkerAccount } from "@/lib/auth/accountRole";
import { ACTIVE_MARKET } from "@/lib/launch";
import { roleIdsToSkillLabels, skillLabelsToRoleIds } from "@/lib/launch/skillIds";
import { useFeedUser } from "@/components/feed/FeedUserProvider";
import { AppNavbar } from "@/components/feed/AppNavbar";
import { LocalitySelect } from "@/components/feed/LocalitySelect";
import { SkillMultiSelect } from "./SkillMultiSelect";

export function ProfilePageContent() {
  const router = useRouter();
  const { user, userLoading, cityId, setCityId, refreshUser } = useFeedUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [skillRoleIds, setSkillRoleIds] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "prefer_not_to_say" | "">("");
  const [hasAadhaar, setHasAadhaar] = useState<boolean | null>(null);
  const [experienceYears, setExperienceYears] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availability, setAvailability] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hiringType, setHiringType] = useState("individual");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: MeResponse) => {
        if (cancelled) return;
        if (data?.user) {
          setName(data.user.name ?? "");
          setSector(data.user.sector ?? "");
        }
        const wp = data.worker_profile as WorkerProfile | null | undefined;
        if (wp) {
          setSkillRoleIds(skillLabelsToRoleIds(wp.skills?.length ? wp.skills : wp.role ? [wp.role] : []));
          setAge(wp.age != null ? String(wp.age) : "");
          setGender(
            wp.gender === "male" || wp.gender === "female" || wp.gender === "other" || wp.gender === "prefer_not_to_say"
              ? wp.gender
              : "",
          );
          setHasAadhaar(wp.has_aadhaar ?? null);
          setExperienceYears(wp.experience_years != null ? String(wp.experience_years) : "");
          setExpectedSalary(wp.expected_salary != null ? String(wp.expected_salary) : "");
          setAvailability(wp.availability ?? "");
        }
        if (data.recruiter_profile) {
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
    if (!user) return;
    setError(null);
    setSuccess(null);

    const body: ProfilePatchBody = {
      name: name.trim() || null,
      city: ACTIVE_MARKET.displayName,
      sector: sector.trim() || null,
    };

    if (isWorkerAccount(user) && !sector.trim()) {
      setError("Select your area / sector in Gurugram.");
      return;
    }

    if (isWorkerAccount(user)) {
      if (skillRoleIds.length === 0) {
        setError("Select at least one skill.");
        return;
      }
      const skills = roleIdsToSkillLabels(skillRoleIds);
      const ageNum = age.trim() ? Number(age) : null;
      if (ageNum != null && (!Number.isInteger(ageNum) || ageNum < 16 || ageNum > 80)) {
        setError("Age must be between 16 and 80.");
        return;
      }
      const exp = experienceYears.trim() ? Number(experienceYears) : null;
      const sal = expectedSalary.trim() ? Number(expectedSalary) : null;
      body.worker = {
        skills,
        role: skills[0] ?? null,
        age: Number.isFinite(ageNum) ? ageNum : null,
        gender: gender || null,
        has_aadhaar: hasAadhaar,
        experience_years: Number.isFinite(exp) ? exp : null,
        expected_salary: Number.isFinite(sal) ? sal : null,
        availability: availability.trim() || null,
      };
    }

    if (isEmployerAccount(user)) {
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

  const kind = accountKind(user);
  const backHref = kind === "employer" ? "/feed/my-listings" : "/feed";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-16 sm:px-6">
        <Link href={backHref} className="text-sm font-medium text-brand hover:underline">
          ← Back
        </Link>

        <header className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">{kind ? accountKindLabel(kind) : "Account"}</p>
          <h1 className="font-serif text-2xl font-bold text-foreground">Your profile</h1>
          <p className="mt-1 text-sm text-muted">
            {kind === "employer"
              ? "Manage your employer details. Role switching is not available in this version."
              : kind === "worker"
                ? "Manage how you appear to employers. Contact details are shared only after a future contact flow."
                : "Complete your profile to use Thekedaar."}
          </p>
        </header>

        {!kind ? (
          <p className="mt-8 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Finish onboarding on WhatsApp, then return here to complete your profile.
          </p>
        ) : loading ? (
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
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-foreground">
                City
                <select
                  disabled
                  value={ACTIVE_MARKET.cities[0]?.id ?? "gurugram"}
                  className="mt-1.5 w-full cursor-default rounded-xl border border-border bg-background px-3 py-2.5 text-sm opacity-90"
                >
                  {ACTIVE_MARKET.cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <LocalitySelect className="mt-4" value={sector} onChange={setSector} required />
            </section>

            {isWorkerAccount(user) ? (
              <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <h2 className="text-base font-bold text-foreground">Worker profile</h2>
                <p className="mt-0.5 text-xs text-muted">Visible on Find Workers for employers (without your phone).</p>
                <div className="mt-4 space-y-4">
                  <SkillMultiSelect selectedRoleIds={skillRoleIds} onChange={setSkillRoleIds} />
                  <label className="block text-sm font-medium text-foreground">
                    Age
                    <input
                      type="text"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Gender
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as typeof gender)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </label>
                  <fieldset>
                    <legend className="text-sm font-medium text-foreground">Aadhaar card</legend>
                    <div className="mt-2 flex gap-4">
                      {(
                        [
                          { v: true, label: "Yes, I have it" },
                          { v: false, label: "No" },
                        ] as const
                      ).map(({ v, label }) => (
                        <label key={String(v)} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="has_aadhaar"
                            checked={hasAadhaar === v}
                            onChange={() => setHasAadhaar(v)}
                            className="accent-brand"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
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
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </label>
                </div>
              </section>
            ) : null}

            {isEmployerAccount(user) ? (
              <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <h2 className="text-base font-bold text-foreground">Employer profile</h2>
                <p className="mt-0.5 text-xs text-muted">Used when you post and manage job listings.</p>
                <div className="mt-4 space-y-4">
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
              </section>
            ) : null}

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

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-sm font-semibold text-foreground">Session</h2>
          <p className="mt-1 text-xs text-muted">Sign out of Thekedaar on this device.</p>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
            className="mt-4 w-full min-h-11 rounded-full border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
