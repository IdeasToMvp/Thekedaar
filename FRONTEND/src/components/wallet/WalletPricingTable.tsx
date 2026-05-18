import type { RecruiterBilling } from "@/lib/credits/types";
import { ONBOARDING_CREDITS_INR } from "@/lib/credits/pricing";

type Props = {
  billing: RecruiterBilling;
};

export function WalletPricingTable({ billing }: Props) {
  const { pricing } = billing;

  const rows = [
    {
      action: "Post a job",
      cost: `₹${pricing.listingInr}`,
      note: "Deducted when you publish a listing",
    },
    {
      action: "Unlock worker contact",
      cost: `₹${pricing.unlockInr}`,
      note: "Deducted when you contact a worker from Find Workers",
    },
    {
      action: "Urgent badge (Immediate)",
      cost: `₹${pricing.urgentInr}`,
      note: "Added when you choose Immediate urgency on a new post",
    },
    {
      action: "Browse Find Workers",
      cost: "Free",
      note: "No charge to browse — only pay to unlock contact",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
        <p className="font-semibold">Welcome credits</p>
        <p className="mt-1 text-xs leading-relaxed">
          New employers receive <strong>₹{ONBOARDING_CREDITS_INR} Theke Credits</strong> when they finish
          onboarding (1 credit = ₹1).
        </p>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        Your balance: <strong className="text-foreground">₹{billing.balanceInr.toLocaleString("en-IN")}</strong>.
        Actions below deduct automatically when you have enough credits.
      </p>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-50/80 text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5 font-semibold">Action</th>
              <th className="px-3 py-2.5 font-semibold text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.action} className="border-b border-border/80 last:border-0">
                <td className="px-3 py-3 align-top">
                  <p className="font-medium text-foreground">{row.action}</p>
                  <p className="mt-0.5 text-xs text-muted">{row.note}</p>
                </td>
                <td className="px-3 py-3 text-right align-top font-semibold text-foreground">{row.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
