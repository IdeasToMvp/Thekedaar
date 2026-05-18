type Props = {
  label: string;
  amountInr: number;
  className?: string;
  hint?: string;
};

/** Inline note that a feature costs Theke Credits. */
export function PaidFeatureNote({ label, amountInr, className = "", hint }: Props) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      <span className="font-medium text-brand-dark">₹{amountInr}</span> Theke Credits — {label}
      {hint ? <span className="block mt-0.5">{hint}</span> : null}
    </p>
  );
}
