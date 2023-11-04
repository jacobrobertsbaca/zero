/* ================================================================================================================= *
 * PUT Budget                                                                                                        *
 * ================================================================================================================= */

/* `put_budget` takes in
 *
 *  - a JSON budget object matching a record in the `budgets` table
 *  - a JSON categories array matching a set of records in the `categories` table
 *  - a JSON periods array matching a set of records in the `periods` table.
 *
 * and performs an atomic update to modify the given budget/categories/periods by doing the
 * following:
 *
 *  1. Deletes all periods that match the budget id.
 *  2. Upserts the updated budget object into `budgets`.
 *  3. Upserts all updated category objects into `categories`.
 *  4. Inserts all period objects into `periods`, re-calculating actual amounts for each period using the `transactions` table.
 */

create or replace function put_budget(
  budget_json json,
  categories_json json,
  periods_json json
) returns void as $$
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

  -- (4) Insert period objects, summing transactions for each period
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
$$ language plpgsql;