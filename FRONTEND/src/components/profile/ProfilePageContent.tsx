"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MeResponse, ProfilePatchBody, WorkerProfile } from "@/lib/auth/types";
import {
  accountKind,
  accountKindLabel,
  isEmployerAccount,
  isWorkerAccount,
  type AccountKind,
} from "@/lib/auth/accountRole";
import { ACTIVE_MARKET } from "@/lib/launch";
import { roleIdsToSkillLabels, skillLabelsToRoleIds } from "@/lib/launch/skillIds";
import { formatPhoneDisplay } from "@/lib/workers/formatPhone";
import { useFeedUser } from "@/components/feed/FeedUserProvider";
import { AppNavbar } from "@/components/feed/AppNavbar";
import { LocalitySelect } from "@/components/feed/LocalitySelect";
import { SkillMultiSelect } from "./SkillMultiSelect";
import { ProfileAccountSettings } from "./ProfileAccountSettings";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

function avatarInitial(name: string, phone: string): string {
  const n = (name || phone || "?").trim();
  return n.slice(0, 1).toUpperCase();
}

function ProfileSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm shadow-slate-900/5">
      <div className="flex items-start gap-3 border-b border-border bg-slate-50/80 px-5 py-4">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white bg-white text-lg shadow-sm"
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p> : null}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ProfileField({
  label,
  hint,
  optional,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-foreground">
        {label}
        {optional ? <span className="font-normal text-muted"> (optional)</span> : null}
      </span>
      {children}
      {hint ? <p className="mt-1 text-[11px] leading-relaxed text-muted">{hint}</p> : null}
    </label>
  );
}

function kindSubtitle(kind: AccountKind): string {
  if (kind === "employer") {
    return "Manage how you appear when posting jobs and reviewing applications.";
  }
  return "Manage how employers see you on Find Workers. Phone is shared only after approval or contact.";
}

function kindIcon(kind: AccountKind): string {
  return kind === "employer" ? "🏢" : "👤";
}

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
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <header className="h-14 shrink-0 animate-pulse border-b border-border bg-surface" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted">Loading…</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const kind = accountKind(user);
  const backHref = kind === "employer" ? "/feed/my-listings" : "/feed";
  const displayName = name.trim() || user.name?.trim() || "Your account";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar user={user} cityId={cityId} onCityChange={setCityId} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 pb-28 sm:px-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            ← Back to feed
          </Link>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-50 via-teal-50/90 to-slate-50 shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-white font-serif text-2xl font-bold text-brand-dark shadow-md">
                  {avatarInitial(displayName, user.phone)}
                </span>
                <div>
                  {kind ? (
                    <span className="inline-flex rounded-full border border-brand/25 bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
                      {accountKindLabel(kind)}
                    </span>
                  ) : null}
                  <h1 className="mt-1.5 font-serif text-2xl font-bold text-foreground sm:text-3xl">Your profile</h1>
                  <p className="mt-1 max-w-xl text-sm text-muted">
                    {kind ? kindSubtitle(kind) : "Complete your profile to use Thekedaar."}
                  </p>
                </div>
              </div>
              <dl className="grid shrink-0 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Phone</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">{formatPhoneDisplay(user.phone)}</dd>
                </div>
                <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Market</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">{ACTIVE_MARKET.displayName}</dd>
                </div>
              </dl>
            </div>
          </div>

          {!kind ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
              Finish onboarding on WhatsApp, then return here to complete your profile.
            </p>
          ) : loading ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-12">
              <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60 lg:col-span-4" />
              <div className="h-96 animate-pulse rounded-2xl bg-slate-200/60 lg:col-span-8" />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-start">
              <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-0">
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground">At a glance</h3>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    <li className="flex justify-between gap-2 border-b border-border/80 pb-2">
                      <span className="text-muted">Name</span>
                      <span className="font-medium text-foreground">{displayName}</span>
                    </li>
                    <li className="flex justify-between gap-2 border-b border-border/80 pb-2">
                      <span className="text-muted">Area</span>
                      <span className="text-right font-medium text-foreground">{sector || "—"}</span>
                    </li>
                    {isWorkerAccount(user) ? (
                      <li className="flex justify-between gap-2">
                        <span className="text-muted">Skills</span>
                        <span className="text-right font-medium text-foreground">
                          {skillRoleIds.length > 0 ? roleIdsToSkillLabels(skillRoleIds).join(", ") : "—"}
                        </span>
                      </li>
                    ) : null}
                    {isEmployerAccount(user) ? (
                      <li className="flex justify-between gap-2">
                        <span className="text-muted">Business</span>
                        <span className="text-right font-medium text-foreground">{businessName || "—"}</span>
                      </li>
                    ) : null}
                  </ul>
                </div>

                {isEmployerAccount(user) ? (
                  <Link
                    href="/feed/wallet"
                    className="block rounded-2xl border border-brand/25 bg-brand/5 p-4 text-sm transition hover:bg-brand/10"
                  >
                    <p className="font-bold text-foreground">Theke Credits</p>
                    <p className="mt-1 text-xs text-muted">Manage balance for job posts and worker unlocks.</p>
                    <span className="mt-2 inline-block text-xs font-semibold text-brand">Open wallet →</span>
                  </Link>
                ) : null}

                <div className="rounded-2xl border border-border bg-slate-50/80 p-4 text-xs leading-relaxed text-muted">
                  {kind === "employer" ? (
                    <>
                      <p className="font-semibold text-foreground">Privacy</p>
                      <p className="mt-1">
                        Your phone is shared with workers only after you approve their application or contact them
                        from Find Workers.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-foreground">Privacy</p>
                      <p className="mt-1">
                        Employers see your skills and area on the feed. Phone and full address unlock only after they
                        approve your job application.
                      </p>
                    </>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground">Session</h3>
                  <p className="mt-1 text-xs text-muted">Sign out of Thekedaar on this device.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      router.push("/");
                      router.refresh();
                    }}
                    className="mt-4 w-full min-h-10 rounded-full border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </div>
              </aside>

              <form onSubmit={handleSave} className="space-y-6 lg:col-span-8">
                <ProfileSection
                  title="Account"
                  description="Basic details used across Thekedaar. Phone is verified via WhatsApp login."
                  icon="📱"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField label="Full name" className="sm:col-span-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                        autoComplete="name"
                      />
                    </ProfileField>
                    <ProfileField label="City" hint="More cities coming soon.">
                      <select
                        disabled
                        value={ACTIVE_MARKET.cities[0]?.id ?? "gurugram"}
                        className={`${inputClass} cursor-default opacity-90`}
                      >
                        {ACTIVE_MARKET.cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </ProfileField>
                    <LocalitySelect
                      className="sm:col-span-2"
                      value={sector}
                      onChange={setSector}
                      required={isWorkerAccount(user)}
                    />
                  </div>
                </ProfileSection>

                {isWorkerAccount(user) ? (
                  <ProfileSection
                    title="Worker profile"
                    description="Shown on Find Workers. Employers contact you after approving an application."
                    icon="🧹"
                  >
                    <div className="space-y-6">
                      <SkillMultiSelect selectedRoleIds={skillRoleIds} onChange={setSkillRoleIds} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ProfileField label="Age">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. 28"
                          />
                        </ProfileField>
                        <ProfileField label="Gender">
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value as typeof gender)}
                            className={inputClass}
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </ProfileField>
                        <ProfileField label="Experience (years)">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. 5"
                          />
                        </ProfileField>
                        <ProfileField label="Expected salary / month (₹)">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={expectedSalary}
                            onChange={(e) => setExpectedSalary(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. 18000"
                          />
                        </ProfileField>
                        <ProfileField label="Availability" className="sm:col-span-2">
                          <input
                            type="text"
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                            className={inputClass}
                            placeholder="e.g. Immediate, part-time weekends"
                          />
                        </ProfileField>
                      </div>
                      <fieldset>
                        <legend className="text-sm font-medium text-foreground">Aadhaar card</legend>
                        <p className="mt-0.5 text-[11px] text-muted">Some employers prefer verified ID.</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {(
                            [
                              { v: true, label: "Yes, I have it" },
                              { v: false, label: "No" },
                            ] as const
                          ).map(({ v, label }) => (
                            <label
                              key={String(v)}
                              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                                hasAadhaar === v
                                  ? "border-brand bg-brand/10 text-brand-dark"
                                  : "border-border bg-background text-foreground hover:border-brand/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="has_aadhaar"
                                checked={hasAadhaar === v}
                                onChange={() => setHasAadhaar(v)}
                                className="sr-only"
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </ProfileSection>
                ) : null}

                {isEmployerAccount(user) ? (
                  <ProfileSection
                    title="Employer profile"
                    description="Shown on your job listings and when workers view approved applications."
                    icon={kindIcon("employer")}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ProfileField label="Business / display name" className="sm:col-span-2">
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. Sharma household, ABC Retail"
                        />
                      </ProfileField>
                      <ProfileField label="Company name" optional>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className={inputClass}
                        />
                      </ProfileField>
                      <ProfileField label="Hiring as">
                        <select
                          value={hiringType}
                          onChange={(e) => setHiringType(e.target.value)}
                          className={inputClass}
                        >
                          <option value="individual">Individual / household</option>
                          <option value="business">Business</option>
                        </select>
                      </ProfileField>
                    </div>
                  </ProfileSection>
                ) : null}

                {user ? (
                  <ProfileAccountSettings user={user} onStatusChange={() => refreshUser()} />
                ) : null}

                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                    {error}
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand-dark">
                    {success}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-12 w-full rounded-full bg-brand-dark px-8 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
                  >
                    {saving ? "Saving…" : "Save profile"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
