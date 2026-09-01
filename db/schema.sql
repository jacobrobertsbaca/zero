/* ================================================================================================================= *
 * Budgets                                                                                                           *
 * ================================================================================================================= */

create table budgets (
  id uuid primary key,
  owner uuid not null references auth.users on delete cascade,
  name varchar(60) not null,
  begin_date char(8) not null,
  end_date char(8) not null
);

/* ================================================================================================================= *
 * Categories                                                                                                        *
 * ================================================================================================================= */

create type category_type as enum ('income', 'savings', 'investments', 'spending');
create type recurrence_type as enum ('none', 'weekly', 'monthly');
create type rollover_type as enum ('none', 'average', 'next');

create table categories (
  id uuid primary key,
  owner uuid not null references auth.users on delete cascade,
  budget uuid not null references public.budgets on delete cascade,
  name varchar(60) not null,
  type category_type not null,
  rec_type recurrence_type not null,
  rec_day integer,
  rec_amount bigint not null,
  ro_loss rollover_type not null,
  ro_surplus rollover_type not null
);

/* ================================================================================================================= *
 * Periods                                                                                                           *
 * ================================================================================================================= */

create type truncate_type as enum ('omit', 'split', 'keep');

create table periods (
  owner uuid not null references auth.users on delete cascade,
  category uuid not null references public.categories on delete cascade,
  budget uuid not null references public.budgets on delete cascade,
  begin_date char(8) not null,
  end_date char(8) not null,
  days integer not null,
  nominal bigint not null,
  actual bigint not null,
  truncate truncate_type not null,
  primary key (category, begin_date, end_date)
);

/* ================================================================================================================= *
 * Transactions                                                                                                      *
 * ================================================================================================================= */

create table transactions (
  id uuid primary key,
  owner uuid not null references auth.users on delete cascade,
  category uuid references public.categories on delete cascade,
  budget uuid references public.budgets on delete cascade,
  category_name citext,
  budget_name citext,
  date char(8) not null,
  amount bigint not null,
  name citext not null check (length(name) <= 120),
  last_modified varchar(27) not null,
  starred boolean not null,
  note text not null check (length(note) <= 1000),
  sync_id text unique,
  sync_details jsonb,
  sync_pending boolean generated always as (budget is null or category is null) stored,
  search text generated always as (
    name || ' ' || note || ' ' || coalesce(budget_name, '') || ' ' || coalesce(category_name, '')
  ) stored
);