/* ================================================================================================================= *
 * Sync category_name with transaction category                                                                      *
 * ================================================================================================================= */

create or replace function update_category_name_transaction_changed() returns trigger as $$
begin
  new.category_name := (select name from categories where id = new.category);
  return new;
end;
$$ language plpgsql;

create or replace function update_category_name_category_changed() returns trigger as $$
begin
  update transactions set category_name = new.name where category = new.id;
  return new;
end;
$$ language plpgsql;

create or replace trigger trigger_category_name_transaction_changed
before insert or update of category on transactions
for each row execute function update_category_name_transaction_changed();

create or replace trigger trigger_category_name_category_changed
before insert or update of name on categories
for each row execute function update_category_name_category_changed();