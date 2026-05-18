export type WalletTransaction = {
  id: string;
  type: string;
  amountPaise: number;
  amountInr: number;
  balanceAfterInr: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type RecruiterBilling = {
  balancePaise: number;
  balanceInr: number;
  onboardingCreditsInr: number;
  pricing: {
    listingInr: number;
    unlockInr: number;
    urgentInr: number;
  };
};

export type WalletTopUpConfig = {
  razorpayEnabled: boolean;
  keyId: string | null;
  minAmountInr: number;
  devTopUpEnabled?: boolean;
};

export type WalletResponse = {
  ok?: boolean;
  billing: RecruiterBilling;
  topUp?: WalletTopUpConfig;
  transactions: WalletTransaction[];
  error?: string;
  code?: string;
};

export type WalletTopUpResponse = {
  ok?: boolean;
  credited?: boolean;
  balanceInr?: number;
  billing?: RecruiterBilling;
  error?: string;
  code?: string;
};

export function isInsufficientCredits(data: { code?: string }): boolean {
  return data.code === "INSUFFICIENT_CREDITS";
}
