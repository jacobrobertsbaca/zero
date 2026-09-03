ALTER TABLE public.periods
  ALTER COLUMN nominal DROP NOT NULL;

ALTER TABLE public.categories
  ALTER COLUMN rec_amount DROP NOT NULL;

ALTER TABLE public.categories
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

WITH numbered AS (
  SELECT id, (row_number() OVER (PARTITION BY budget ORDER BY name, id) - 1)::integer AS rn
  FROM public.categories
)
UPDATE public.categories c
SET sort_order = n.rn
FROM numbered n
WHERE c.id = n.id;

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
    ro_surplus  = excluded.ro_surplus,
    sort_order  = excluded.sort_order;

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
    ro_surplus  = excluded.ro_surplus,
    sort_order  = excluded.sort_order;

  -- (3) Insert period objects
  perform put_periods(periods_json);
end;
$function$;
