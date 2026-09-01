ALTER TABLE "public"."transactions"
  ALTER COLUMN "category" DROP NOT NULL,
  ALTER COLUMN "budget" DROP NOT NULL,
  ALTER COLUMN "category_name" DROP NOT NULL,
  ALTER COLUMN "budget_name" DROP NOT NULL;

ALTER TABLE "public"."transactions" DROP COLUMN "search";
ALTER TABLE "public"."transactions"
  ADD COLUMN "search" text GENERATED ALWAYS AS (
    (name)::text || ' '::text || note || ' '::text || coalesce((budget_name)::text, '') || ' '::text || coalesce((category_name)::text, '')
  ) STORED;

ALTER TABLE "public"."transactions"
  ADD COLUMN "sync_id" text,
  ADD COLUMN "sync_details" jsonb,
  ADD COLUMN "sync_pending" boolean GENERATED ALWAYS AS (budget IS NULL OR category IS NULL) STORED;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_sync_id_key" UNIQUE ("sync_id");

CREATE INDEX "transactions_sync_pending_idx" ON "public"."transactions" ("owner", "sync_pending");

CREATE OR REPLACE FUNCTION public.put_transaction (
  transaction_json json
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
begin
  -- (1) Remove existing amount from period
  perform place_transaction(row_to_json(transactions), true)
  from transactions
  where id = (transaction_json->>'id')::uuid;

  -- (2) Add new amount to period
  perform place_transaction(transaction_json, false);

  -- (3) Upsert transaction to transactions table
  insert into transactions (id, owner, category, budget, date, amount, name, last_modified, starred, note, sync_id, sync_details)
  select id, owner, category, budget, date, amount, name, last_modified, starred, note, sync_id, sync_details
  from json_populate_record(null::transactions, transaction_json)
  on conflict (id) do update
  set
    owner         = excluded.owner,
    category      = excluded.category,
    budget        = excluded.budget,
    date          = excluded.date,
    amount        = excluded.amount,
    name          = excluded.name,
    last_modified = excluded.last_modified,
    starred       = excluded.starred,
    note          = excluded.note,
    sync_id       = excluded.sync_id,
    sync_details  = excluded.sync_details;
end;
$function$;
