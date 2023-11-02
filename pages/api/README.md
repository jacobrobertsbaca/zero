# API Overview

## Tables

### `budgets`

Column | Type | Description
-------|------|-------------
`id` | `uuid PRIMARY KEY` | The id of the budget
`owner` | `uuid REFERENCES auth.users` | The id of the user who created the budget
`name` | `varchar(60) NOT NULL` | The name of the budget
`begin` | `char(8) NOT NULL` | The start date of the budget (`YYYYMMDD`)
`end` | `char(8) NOT NULL` | The end date of the budget (`YYYYMMDD`)

### `categories`

Column | Type | Description
-------|------|-------------
`id` | `uuid PRIMARY KEY` | The id of the category
`owner` | `uuid REFERENCES auth.users` | The id of the user who created the category
`budget` | `uuid REFERENCES public.budgets` | The id of the budget containing the category
`name` | `varchar(60) NOT NULL` | The name of the category
`type` | `varchar(16) NOT NULL` | The type of the category
`rec_type` | `varchar(16) NOT NULL` | The recurrence type of the category
`rec_day` | `integer` | The recurrence day used when `rec_type` is `"monthly"` or `"weekly"`, or `NULL` otherwise.
`rec_amount` | `bigint NOT NULL` | The recurrence amount in USD cents.
`ro_loss` | `varchar(16) NOT NULL` | The rollover strategy for losses
`ro_surplus` | `varchar(16) NOT NULL` | The rollover strategy for surpluses

### `periods`

Column | Type | Description
-------|------|-------------
`PRIMARY KEY (category, begin, end)` | |
`owner` | `uuid REFERENCES auth.users` | The id of the user who created the period
`category` | `uuid REFERENCES public.categories` | The id of the category containing the period
`budget` | `uuid REFERENCES public.budgets` | The id of the budget containing the period
`begin` | `char(8) NOT NULL` | The start date of the period (`YYYYMMDD`)
`end` | `char(8) NOT NULL` | The end date of the period (`YYYYMMDD`)
`days` | `integer NOT NULL` | The true number of days in the period
`nominal` | `bigint NOT NULL` | The planned spending for this period in USD cents.
`actual` | `bigint NOT NULL` | The actual spending for this period in USD cents.
`truncate` | `varchar(16) NOT NULL` | The truncate mode for this period. 

### `transactions`

Column | Type | Description
-------|------|-------------
`id` | `uuid PRIMARY KEY` | The id of the transaction
`owner` | `uuid REFERENCES auth.users` | The id of the user who created the transaction
`category` | `uuid REFERENCES public.categories` | The id of the associated category
`budget` | `uuid REFERENCES public.budgets` | The id of the associated budget
`date` | `char(8) NOT NULL` | The day the transaction is added (`YYYMMDD`)
`amount` | `bigint NOT NULL` | The amount of this transaction in USD cents.
`name` | `varchar(120) NOT NULL` | The name of the transaction
`last_modified` | `varchar(60) NOT NULL` | The last time this transaction was modified (UTC ISO-8601).

## Endpoints

### Budgets

#### <kbd>GET</kbd> `/budgets`

### Categories

#### <kbd>PUT</kbd> `/budgets/[bid]/categories`

1. Get current category from `categories`
2. If recurrence has changed or if category is new:
    - Compute new periods based on recurrence.
    - Get all transactions for category from `transactions`.
    - Compute new periods' actual amounts based on transactions.
    - **Transaction:**
        - Upsert row in `categories` with new categories
        - Delete all periods for this category in `periods`
        - Add periods to `periods`

> [!WARNING]  
> Race condition if a new transaction is added here after all transactions retrieved but before committing to `periods`.

3. If recurrence has not changed:
    - Upsert row in `categories` with new category.

#### <kbd>DELETE</kbd> `/budgets/[bid]/categories/[cid]`

1. **Transaction:**
    - Delete row in `categories`
    - Delete periods in `periods`
    - Delete transactions for `transactions` with this category

> [!NOTE]  
> Maybe this can be done with a single `delete` by linking primary/foreign keys in the tables?

