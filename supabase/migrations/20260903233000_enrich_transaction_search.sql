ALTER TABLE "public"."transactions"
  ADD COLUMN "institution_name" extensions.citext;

/* ================================================================================================================= *
 * institution_name maintenance                                                                                      *
 * ================================================================================================================= */

CREATE OR REPLACE FUNCTION public.update_institution_name_transaction_changed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  if new.sync_details is null or new.sync_details->>'account_id' is null then
    new.institution_name := null;
  else
    new.institution_name := (
      select i.institution_name
      from plaid_accounts a
      join plaid_items i on i.id = a.item_id
      where a.id = (new.sync_details->>'account_id')::uuid
        and a.status = 'active'
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_institution_name_item_changed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  update transactions
  set institution_name = new.institution_name
  where sync_details->>'account_id' in (
    select id::text from plaid_accounts where item_id = new.id and status = 'active'
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_institution_name_account_changed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
declare
  account_uuid uuid;
  next_name text;
begin
  account_uuid := coalesce(new.id, old.id);

  if tg_op = 'DELETE' or new.status is distinct from 'active' then
    next_name := null;
  else
    next_name := (select institution_name from plaid_items where id = new.item_id);
  end if;

  update transactions
  set institution_name = next_name
  where sync_details->>'account_id' = account_uuid::text;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

CREATE TRIGGER trigger_institution_name_transaction_changed
  BEFORE INSERT OR UPDATE OF sync_details ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_institution_name_transaction_changed();

CREATE TRIGGER trigger_institution_name_item_changed
  BEFORE INSERT OR UPDATE OF institution_name ON public.plaid_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_institution_name_item_changed();

CREATE TRIGGER trigger_institution_name_account_changed
  BEFORE INSERT OR UPDATE OF status, item_id OR DELETE ON public.plaid_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_institution_name_account_changed();

UPDATE "public"."transactions" t
SET "institution_name" = i.institution_name
FROM "public"."plaid_accounts" a
JOIN "public"."plaid_items" i ON i.id = a.item_id
WHERE t.sync_details->>'account_id' = a.id::text
  AND a.status = 'active';

/* ================================================================================================================= *
 * regenerated search column                                                                                         *
 * ================================================================================================================= */

ALTER TABLE "public"."transactions" DROP COLUMN "search";
ALTER TABLE "public"."transactions"
  ADD COLUMN "search" text GENERATED ALWAYS AS (
    (name)::text
    || ' '::text || note
    || ' '::text || coalesce((budget_name)::text, '')
    || ' '::text || coalesce((category_name)::text, '')
    || ' '::text || coalesce((institution_name)::text, '')
    || ' '::text || (
      (substring(date from 5 for 2)::integer)::text
      || '/'::text
      || (substring(date from 7 for 2)::integer)::text
      || '/'::text
      || substring(date from 1 for 4)
    )
    || ' '::text || (
      case when amount < 0 then '-'::text else ''::text end
      || '$'::text
      || (abs(amount) / 100)::text
      || '.'::text
      || lpad((abs(amount) % 100)::text, 2, '0')
    )
  ) STORED;

CREATE INDEX "transactions_search_idx" ON "public"."transactions" USING gin ("search" gin_trgm_ops);

GRANT EXECUTE ON FUNCTION "public"."update_institution_name_transaction_changed"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
GRANT EXECUTE ON FUNCTION "public"."update_institution_name_item_changed"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
GRANT EXECUTE ON FUNCTION "public"."update_institution_name_account_changed"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";
