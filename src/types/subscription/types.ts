export type PriceLookupKey = "plus_monthly" | "plus_yearly";

export type PlusStatus =
  | "none" // Free — no active Plus subscription
  | "trial" // Plus trial — full access, first charge scheduled
  | "active" // Plus active — paid and renewing
  | "active_cancelled" // Canceled — Plus access until period end
  | "past_due"; // Payment failed — update card to keep Plus

export type Subscription = {
  status: PlusStatus;
  active: boolean;
  trialEligible: boolean;
  lookupKey: PriceLookupKey | null;
  periodEnd: string | null;
  stripeCustomerId: string | null;
};
