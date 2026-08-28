CREATE TABLE "public"."subscriptions" (
  "owner"                  uuid        NOT NULL,
  "stripe_customer_id"     text        NOT NULL,
  "stripe_subscription_id" text,
  "status"                 text,
  "price_lookup_key"       text,
  "current_period_end"     timestamptz,
  "updated_at"             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("owner"),
  CONSTRAINT "subscriptions_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id")
);

ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;
