import {
  THEKE_CREDITS_DISCLAIMER,
  THEKE_CREDITS_NAME,
  THEKE_CREDITS_POLICIES,
} from "@/lib/credits/thekeCredits";

type Props = {
  className?: string;
  /** Show short disclaimer paragraph (default true). */
  showDisclaimer?: boolean;
  /** Compact list without per-item detail lines. */
  compact?: boolean;
};

export function ThekeCreditsTerms({ className = "", showDisclaimer = true, compact = false }: Props) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{THEKE_CREDITS_NAME}</p>
      <ul className="mt-2 space-y-2" role="list">
        {THEKE_CREDITS_POLICIES.map((policy) => (
          <li key={policy.id} className="flex gap-2 text-sm text-foreground">
            <span className="shrink-0 text-emerald-600" aria-hidden>
              ✓
            </span>
            <span>
              <span className="font-medium">{policy.label}</span>
              {!compact ? <span className="mt-0.5 block text-xs leading-relaxed text-muted">{policy.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {showDisclaimer ? (
        <p className="mt-3 text-xs leading-relaxed text-muted">{THEKE_CREDITS_DISCLAIMER}</p>
      ) : null}
    </div>
  );
}
