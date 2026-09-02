SET local check_function_bodies = off;

CREATE EXTENSION IF NOT EXISTS "citext" SCHEMA "extensions";

CREATE TABLE "public"."budgets" (
  "id"         uuid                  NOT NULL,
  "owner"      uuid                  NOT NULL,
  "name"       character varying(60) NOT NULL,
  "begin_date" character(8)          NOT NULL,
  "end_date"   character(8)          NOT NULL,
  CONSTRAINT "budgets_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."budgets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."categories" (
  "id"         uuid                  NOT NULL,
  "owner"      uuid                  NOT NULL,
  "budget"     uuid                  NOT NULL,
  "name"       character varying(60) NOT NULL,
  "rec_day"    integer,
  "rec_amount" bigint                NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."periods" (
  "owner"      uuid         NOT NULL,
  "category"   uuid         NOT NULL,
  "budget"     uuid         NOT NULL,
  "begin_date" character(8) NOT NULL,
  "end_date"   character(8) NOT NULL,
  "days"       integer      NOT NULL,
  "nominal"    bigint       NOT NULL,
  "actual"     bigint       NOT NULL,
  CONSTRAINT "periods_pkey" PRIMARY KEY (category, begin_date, end_date)
);

ALTER TABLE "public"."periods"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."transactions" (
  "id"            uuid                  NOT NULL,
  "owner"         uuid                  NOT NULL,
  "category"      uuid                  NOT NULL,
  "budget"        uuid                  NOT NULL,
  "date"          character(8)          NOT NULL,
  "amount"        bigint                NOT NULL,
  "name"          extensions.citext     NOT NULL,
  "last_modified" character varying(27) NOT NULL,
  "starred"       boolean               NOT NULL DEFAULT false,
  "note"          text                  NOT NULL DEFAULT '""'::text,
  "category_name" extensions.citext     NOT NULL DEFAULT ''::character varying,
  "budget_name"   extensions.citext     NOT NULL DEFAULT ''::character varying,
  CONSTRAINT "transactions_name_length" CHECK ((length((name)::text) <= 120)),
  CONSTRAINT "transactions_note_length" CHECK ((length(note) <= 1000)),
  CONSTRAINT "transactions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."transactions"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."transactions"
  ADD COLUMN "search" text GENERATED ALWAYS AS ((((((((name)::text || ' '::text) || note) || ' '::text) || (budget_name)::text) || ' '::text) || (category_name)::text)) STORED;

CREATE TYPE "public"."category_type" AS ENUM (
  'income',
  'savings',
  'investments',
  'spending'
);

ALTER TABLE "public"."categories"
  ADD COLUMN "type" public.category_type NOT NULL;

CREATE TYPE "public"."recurrence_type" AS ENUM (
  'none',
  'weekly',
  'monthly'
);

ALTER TABLE "public"."categories"
  ADD COLUMN "rec_type" public.recurrence_type NOT NULL;

CREATE TYPE "public"."rollover_type" AS ENUM (
  'none',
  'average',
  'next'
);

ALTER TABLE "public"."categories"
  ADD COLUMN "ro_loss" public.rollover_type NOT NULL;

ALTER TABLE "public"."categories"
  ADD COLUMN "ro_surplus" public.rollover_type NOT NULL;

CREATE TYPE "public"."truncate_type" AS ENUM (
  'omit',
  'split',
  'keep'
);

ALTER TABLE "public"."periods"
  ADD COLUMN "truncate" public.truncate_type NOT NULL;

CREATE OR REPLACE FUNCTION public.delete_transaction (
  transaction_id uuid,
  owner_id       uuid
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
begin
  -- (1) Remove transaction amount from period
  perform place_transaction(row_to_json(transactions), true)
  from transactions
  where id = transaction_id and owner = owner_id;

  -- (2) Delete transaction from transactions table
  delete from transactions where id = transaction_id and owner = owner_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.place_transaction (
  transaction_json json,
  remove           boolean
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
begin
  update periods
  set actual = actual + (case when remove then -1 else 1 end) * (transaction_json->>'amount')::bigint
  where category = (transaction_json->>'category')::uuid
  and transaction_json->>'date' >= begin_date and transaction_json->>'date' <= end_date;
end;
$function$;

CREATE OR REPLACE FUNCTION public.put_budget (
  budget_json     json,
  categories_json json,
  periods_json    json
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
begin
  -- (1) Delete all periods in budget
  delete from periods p where budget = (budget_json->>'id')::uuid;

  -- (2) Upsert new budget object
  insert into budgets 
  select * from json_populate_record(null::budgets, budget_json) 
  on conflict (id) do update
  set
    owner       = excluded.owner,
    name        = excluded.name,
    begin_date  = excluded.begin_date,
    end_date    = excluded.end_date;

  -- (3) Upsert new category objects
  insert into categories
  select * from json_populate_recordset(null::categories, categories_json)
  on conflict (id) do update
  set
    owner       = excluded.owner,
    budget      = excluded.budget,
    name        = excluded.name,
    type        = excluded.type,
    rec_type    = excluded.rec_type,
    rec_day     = excluded.rec_day,
    rec_amount  = excluded.rec_amount,
    ro_loss     = excluded.ro_loss,
    ro_surplus  = excluded.ro_surplus;

  -- (4) Insert period objects
  perform put_periods(periods_json);
  
end;
$function$;

CREATE OR REPLACE FUNCTION public.put_category (
  category_json json,
  periods_json  json
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
begin
  -- (1) Delete all periods in category
  delete from periods where category = (category_json->>'id')::uuid;

  -- (2) Upsert new category object
  insert into categories
  select * from json_populate_record(null::categories, category_json)
  on conflict (id) do update
  set
    owner       = excluded.owner,
    budget      = excluded.budget,
    name        = excluded.name,
    type        = excluded.type,
    rec_type    = excluded.rec_type,
    rec_day     = excluded.rec_day,
    rec_amount  = excluded.rec_amount,
    ro_loss     = excluded.ro_loss,
    ro_surplus  = excluded.ro_surplus;

  -- (3) Insert period objects
  perform put_periods(periods_json);
end;
$function$;

CREATE OR REPLACE FUNCTION public.put_periods (
  periods_json json
)
  RETURNS void
  LANGUAGE plpgsql
  AS $function$
begin
  insert into periods
  select 
    p.owner,
    p.category,
    p.budget,
    p.begin_date,
    p.end_date,
    p.days,
    p.nominal,
    (
      select coalesce(sum(amount), 0)
      from transactions t 
      where t.category = p.category
      and t.date >= p.begin_date and t.date <= p.end_date
    ) as actual,
    p.truncate
  from json_populate_recordset(null::periods, periods_json) p;
end;
$function$;

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
  insert into transactions (id, owner, category, budget, date, amount, name, last_modified, starred, note) 
  select id, owner, category, budget, date, amount, name, last_modified, starred, note
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
    note          = excluded.note;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_budget_name_budget_changed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  update transactions set budget_name = new.name where budget = new.id;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_budget_name_transaction_changed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.budget_name := (select name from budgets where id = new.budget);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_category_name_category_changed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  update transactions set category_name = new.name where category = new.id;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_category_name_transaction_changed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.category_name := (select name from categories where id = new.category);
  return new;
end;
$function$;

ALTER TABLE "public"."budgets"
  ADD CONSTRAINT "budgets_owner_fkey" FOREIGN KEY (OWNER) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."categories"
  ADD CONSTRAINT "categories_budget_fkey" FOREIGN KEY (budget) REFERENCES public.budgets(id) ON DELETE CASCADE;

ALTER TABLE "public"."categories"
  ADD CONSTRAINT "categories_owner_fkey" FOREIGN KEY (OWNER) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."periods"
  ADD CONSTRAINT "periods_budget_fkey" FOREIGN KEY (budget) REFERENCES public.budgets(id) ON DELETE CASCADE;

ALTER TABLE "public"."periods"
  ADD CONSTRAINT "periods_category_fkey" FOREIGN KEY (category) REFERENCES public.categories(id) ON DELETE CASCADE;

ALTER TABLE "public"."periods"
  ADD CONSTRAINT "periods_owner_fkey" FOREIGN KEY (OWNER) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_budget_fkey" FOREIGN KEY (budget) REFERENCES public.budgets(id) ON DELETE CASCADE;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_category_fkey" FOREIGN KEY (category) REFERENCES public.categories(id) ON DELETE CASCADE;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_owner_fkey" FOREIGN KEY (OWNER) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TRIGGER trigger_budget_name_budget_changed
  BEFORE INSERT OR UPDATE OF name ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_name_budget_changed();

CREATE TRIGGER trigger_category_name_category_changed
  BEFORE INSERT OR UPDATE OF name ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_name_category_changed();

CREATE TRIGGER trigger_budget_name_transaction_changed
  BEFORE INSERT OR UPDATE OF budget ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_budget_name_transaction_changed();

CREATE TRIGGER trigger_category_name_transaction_changed
  BEFORE INSERT OR UPDATE OF category ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_name_transaction_changed();

COMMENT ON EXTENSION "citext" IS 'data type for case-insensitive character strings';

GRANT EXECUTE ON FUNCTION "public"."delete_transaction"(uuid, uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."place_transaction"(json, boolean) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."put_budget"(json, json, json) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."put_category"(json, json) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."put_periods"(json) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."put_transaction"(json) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_budget_name_budget_changed"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_budget_name_transaction_changed"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_category_name_category_changed"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_category_name_transaction_changed"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."budgets" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."periods" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."category_type" TO "postgres";

GRANT USAGE ON TYPE "public"."recurrence_type" TO "postgres";

GRANT USAGE ON TYPE "public"."rollover_type" TO "postgres";

GRANT USAGE ON TYPE "public"."truncate_type" TO "postgres";

