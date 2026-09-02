import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import Stripe from "stripe";
import { tags } from "src/server/tags";
import type { PlusStatus, PriceLookupKey, Subscription } from "src/types/subscription/types";
import { getAppOrigin } from "src/utils/server";
import { supabase } from "src/utils/supabase/server";
import { wrap } from "src/server/common";
import { HttpError } from "src/server/errors";

export const TRIAL_DAYS = 30;

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

let _stripe: Stripe | undefined;
export const stripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured.");
  return (_stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY));
};

export const getSubscription = async (owner: string): Promise<Subscription> => {
  "use cache";
  cacheTag(tags.subscription(owner));
  cacheLife("max");

  const { data: row, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status, price_lookup_key, current_period_end")
    .eq("owner", owner)
    .maybeSingle();
  if (error) throw new HttpError(error.code, error.message);

  const status = (row?.status as PlusStatus) ?? "none";
  const stripeCustomerId = row?.stripe_customer_id ?? null;

  if (row?.price_lookup_key && row.current_period_end && status !== "none") {
    return {
      status,
      active: status !== "past_due",
      trialEligible: false,
      lookupKey: row.price_lookup_key as PriceLookupKey,
      periodEnd: row.current_period_end,
      stripeCustomerId,
    };
  }

  const trialEligible = await (async () => {
    if (!isStripeConfigured()) return false;
    if (!stripeCustomerId) return true;
    const { data } = await stripe().subscriptions.list({ customer: stripeCustomerId, status: "all", limit: 1 });
    return data.length === 0;
  })();

  return { status: "none", active: false, trialEligible, lookupKey: null, periodEnd: null, stripeCustomerId };
};

const ensureCustomer = async (owner: string, sub: Subscription): Promise<string> => {
  if (sub.stripeCustomerId) return sub.stripeCustomerId;
  const email = (await supabase.auth.admin.getUserById(owner)).data.user?.email;
  if (!email) throw new Error("Account email is required for billing.");
  const customer = await stripe().customers.create({ email, metadata: { supabase_user_id: owner } });
  await wrap(
    supabase
      .from("subscriptions")
      .upsert({ owner, stripe_customer_id: customer.id, status: "none", updated_at: new Date().toISOString() })
  );
  revalidateTag(owner, { expire: 0 });
  return customer.id;
};

export const createCheckoutSession = async (owner: string): Promise<string> => {
  const sub = await getSubscription(owner);
  const customer = await ensureCustomer(owner, sub);
  const prices = await stripe().prices.list({ lookup_keys: ["plus_monthly"], active: true, limit: 1 });
  const price = prices.data[0];
  if (!price) throw new Error('Stripe price "plus_monthly" was not found.');

  const origin = await getAppOrigin();
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: owner,
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/settings`,
    subscription_data: sub.status === "none" && sub.trialEligible ? { trial_period_days: TRIAL_DAYS } : undefined,
  });
  if (!session.url) throw new Error("Stripe checkout session did not return a URL.");
  return session.url;
};

export const createPortalSession = async (owner: string): Promise<string> => {
  const sub = await getSubscription(owner);
  if (!sub.stripeCustomerId) throw new Error("No billing account found.");

  const session = await stripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${await getAppOrigin()}/settings`,
  });
  return session.url;
};

export const syncSubscription = async (sub: Stripe.Subscription): Promise<void> => {
  function periodEnd(subscription: Stripe.Subscription) {
    const ts =
      subscription.status === "trialing" && subscription.trial_end
        ? subscription.trial_end
        : subscription.items.data[0]?.current_period_end;
    return ts ? new Date(ts * 1000).toISOString() : null;
  }

  function lookupKey(subscription: Stripe.Subscription): PriceLookupKey | null {
    const key = subscription.items.data[0]?.price.lookup_key;
    return key === "plus_monthly" || key === "plus_yearly" ? key : null;
  }

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("owner")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  const isCancelled = sub.cancel_at_period_end || sub.canceled_at != null;
  const status: PlusStatus = (() => {
    if (sub.status === "past_due") return "past_due";
    if (sub.status === "trialing") return isCancelled ? "active_cancelled" : "trial";
    if (sub.status === "active") return isCancelled ? "active_cancelled" : "active";
    return "none";
  })();

  if (existing?.owner) revalidateTag(tags.subscription(existing.owner), { expire: 0 });

  if (status === "none") {
    await wrap(
      supabase
        .from("subscriptions")
        .update({
          stripe_subscription_id: null,
          status: "none",
          price_lookup_key: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId)
    );
    if (existing?.owner) {
      // Note: dynamic importing to avoid circular dependencies
      const { revokeAllItems } = await import("src/server/plaid");
      await revokeAllItems(existing.owner);
    }
    return;
  }

  await wrap(
    supabase
      .from("subscriptions")
      .update({
        stripe_subscription_id: sub.id,
        status,
        price_lookup_key: lookupKey(sub),
        current_period_end: periodEnd(sub),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId)
  );
};

export const cancelSubscription = async (owner: string): Promise<void> => {
  if (!isStripeConfigured()) return;
  const sub = await getSubscription(owner);
  if (!sub.stripeCustomerId) return;
  const { data } = await stripe().subscriptions.list({ customer: sub.stripeCustomerId, status: "all", limit: 1 });
  if (data[0]) await stripe().subscriptions.cancel(data[0].id);
};
