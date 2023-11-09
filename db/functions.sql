/* ================================================================================================================= *
 * Budget/Category                                                                                                   *
 * ================================================================================================================= */

/* `put_periods` takes in a JSON periods array matching a set of records in the `periods` table,
 * calculates their actual amounts, and inserts them into the database.
 *
 * Will throw an error if any periods with the same primary key already exist.
 */

create or replace function put_periods(
  periods_json json
) returns void as $$
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
$$ language plpgsql;

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
 *  4. Inserts all period objects into `periods`, re-calculating actual amounts for each period 
 *     using the `transactions` table.
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

  -- (4) Insert period objects
  perform put_periods(periods_json);
  
end;
$$ language plpgsql;

/* `put_category` takes in 
 * 
 *  - a JSON category object matching a record in the `categories` table
 *  - a JSON periods array matching a set of records in the `periods` table
 *
 * and performs an atomic update to the `categories` and `periods` tables by doing
 * the following:
 * 
 *  1. Deletes all periods that match the category id.
 *  2. Upserts the updated category into `categories`.
 *  3. Inserts all period objects into `periods`, re-calculating actual amounts for each period 
 *     using the `transactions` table.
 */

create or replace function put_category(
  category_json json,
  periods_json json
) returns void as $$
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
$$ language plpgsql;

/* ================================================================================================================= *
 * Transactions                                                                                                      *
 * ================================================================================================================= */

/* `place_transaction` takes in 
 *
 * - a JSON transaction object matching a record in the `transactions` table
 * - a boolean, `remove` indicating whether to remove the transaction or not
 *
 * and subtracts the amount of the transaction from its corresponding period if `remove` is true
 * or otherwise adds it.
 */

create or replace function place_transaction(
  transaction_json json,
  remove boolean
) returns void as $$
begin
  update periods
  set actual = actual + (case when remove then -1 else 1 end) * (transaction_json->>'amount')::bigint
  where category = (transaction_json->>'category')::uuid
  and transaction_json->>'date' >= begin_date and transaction_json->>'date' <= end_date;
end;
$$ language plpgsql;

/* `put_transaction` takes in a JSON transaction object matching a record in the `transactions` table
 * and upserts a new transaction. It does so by
 *
 * 1. Removing the transaction's amount from the period it belongs to, if it already exists.
 * 2. Adding the transaction's amount to its new period.
 * 3. Upserting the transaction to the `transactions` table.
 *
 */

create or replace function put_transaction(
  transaction_json json  
) returns void as $$
begin
  -- (1) Remove existing amount from period
  perform place_transaction(row_to_json(transactions), true)
  from transactions
  where id = (transaction_json->>'id')::uuid;

  -- (2) Add new amount to period
  perform place_transaction(transaction_json, false);

  -- (3) Upsert transaction to transactions table
  insert into transactions
  select * from json_populate_record(null::transactions, transaction_json)
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
$$ language plpgsql;

/* `delete_transaction` takes in 
 *
 *  - a transaction id and deletes it
 *  - the id of the user owning the transaction
 *
 * and deletes the transaction with that id and owner. It does so by
 * 
 * 1. Removing the transaction's amount from the period it belongs to.
 * 2. Deleting the transaction from the `transactions` table.
 *
 */

create or replace function delete_transaction(
  transaction_id uuid,
  owner_id uuid
) returns void as $$
begin
  -- (1) Remove transaction amount from period
  perform place_transaction(row_to_json(transactions), true)
  from transactions
  where id = transaction_id and owner = owner_id;

  -- (2) Delete transaction from transactions table
  delete from transactions where id = transaction_id and owner = owner_id;
end;
$$ language plpgsql;