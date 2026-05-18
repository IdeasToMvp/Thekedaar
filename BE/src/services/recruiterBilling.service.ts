import { debitCredits, getWalletBalancePaise, grantOnboardingCredits, listWalletTransactions } from "./wallet.service";
import { hasRecruiterProfile } from "./user.service";
import {
  ONBOARDING_CREDITS_PAISE,
  PRICE_LISTING_PAISE,
  PRICE_URGENT_BADGE_PAISE,
  PRICE_WORKER_UNLOCK_PAISE,
  isUrgentUrgency,
  paiseToInr,
} from "../utils/creditPricing";

export type RecruiterBillingSnapshot = {
  balancePaise: number;
  balanceInr: number;
  onboardingCreditsInr: number;
  pricing: {
    listingInr: number;
    unlockInr: number;
    urgentInr: number;
  };
};

export async function buildRecruiterBillingSnapshot(userId: string): Promise<RecruiterBillingSnapshot> {
  const balancePaise = await getWalletBalancePaise(userId);
  return {
    balancePaise,
    balanceInr: paiseToInr(balancePaise),
    onboardingCreditsInr: paiseToInr(ONBOARDING_CREDITS_PAISE),
    pricing: {
      listingInr: paiseToInr(PRICE_LISTING_PAISE),
      unlockInr: paiseToInr(PRICE_WORKER_UNLOCK_PAISE),
      urgentInr: paiseToInr(PRICE_URGENT_BADGE_PAISE),
    },
  };
}

/** Debit listing + urgent fees before creating a job row. */
export async function chargeForNewJob(
  recruiterId: string,
  urgency: string | null | undefined,
): Promise<{ urgentPaid: boolean }> {
  await debitCredits({
    userId: recruiterId,
    amountPaise: PRICE_LISTING_PAISE,
    type: "debit_listing",
    metadata: { urgency: urgency ?? null },
  });

  const urgent = isUrgentUrgency(urgency);
  if (urgent) {
    await debitCredits({
      userId: recruiterId,
      amountPaise: PRICE_URGENT_BADGE_PAISE,
      type: "debit_urgent",
      metadata: { urgency },
    });
  }

  return { urgentPaid: urgent };
}

/** Debit urgent badge when upgrading an existing listing to Immediate. */
export async function chargeForUrgentUpgrade(recruiterId: string, jobId: string): Promise<void> {
  await debitCredits({
    userId: recruiterId,
    amountPaise: PRICE_URGENT_BADGE_PAISE,
    type: "debit_urgent",
    metadata: { jobId, source: "edit_upgrade" },
  });
}

/** Debit credits to unlock a worker contact. */
export async function chargeWorkerUnlock(employerId: string, workerId: string): Promise<void> {
  await debitCredits({
    userId: employerId,
    amountPaise: PRICE_WORKER_UNLOCK_PAISE,
    type: "debit_unlock",
    reference: `unlock:${workerId}`,
    metadata: { workerId },
  });
}

export async function assertRecruiterWalletAccess(userId: string): Promise<void> {
  const isRec = await hasRecruiterProfile(userId);
  if (!isRec) {
    throw new Error("Wallet is available for employer accounts only");
  }
}

export { listWalletTransactions, getWalletBalancePaise };
