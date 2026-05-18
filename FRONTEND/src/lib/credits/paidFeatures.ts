import {
  PRICE_LISTING_INR,
  PRICE_UNLOCK_INR,
  PRICE_URGENT_INR,
} from "./pricing";

export const PAID_FEATURES = {
  postListing: {
    label: "Post a job listing",
    amountInr: PRICE_LISTING_INR,
    description: "Charged once when you publish a new job on the feed.",
  },
  urgentBadge: {
    label: "Urgent badge (Immediate)",
    amountInr: PRICE_URGENT_INR,
    description: "Highlights your listing as urgent on the feed.",
  },
  unlockWorker: {
    label: "Unlock worker contact",
    amountInr: PRICE_UNLOCK_INR,
    description: "Reveals phone and full profile when you contact a worker.",
  },
} as const;
