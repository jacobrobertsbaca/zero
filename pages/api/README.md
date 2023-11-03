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

1. Get all budgets for user in `budgets`.
2. Get all categories for user in `categories`.
3. Get all periods for user in `periods`.
4. Group categories and periods with their budgets.

#### <kbd>GET</kbd> `/budgets/[bid]`

1. Get budget with id `bid`.
2. Get all categories with matching `bid`.
3. Get all periods with matching `bid`.
4. Group categories and periods into budget.

> [!NOTE]  
> Step 4 can in both `/budgets` and `/budget/[bid]` can be abstracted into shared logic.

#### <kbd>PUT</kbd> `/budgets`

1. Get current budget from `budgets`.
2. If budget dates have changed or if budget is new:
    - Get budget categories.
    - Compute new periods and categories for each category based on their recurrence.
    - Get all transactions for budget from `transactions`.
    - Compute new periods' actual amounts based on transactions.
    - **Transaction:**
      - Upsert updated budget.
      - Upsert new categories.
      - Delete all periods for this budget in `periods`
      - Add new periods to `periods`

> [!WARNING]  
> Race condition if a new transaction is added here after all transactions retrieved but before committing to `periods`.

3. Otherwise:
  - Upsert row in `budgets` with new budget.

#### <kbd>DELETE</kbd> `/budgets/[bid]`

1. **Transaction:**
    - Delete row in `budgets`
    - Delete categories in `categories`
    - Delete periods in `periods`
    - Delete transactions with this budget

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

3. Otherwise:
    - Upsert row in `categories` with new category.

> [!NOTE]  
> Huge potential for shared logic between `/budgets` and `/budgets/[bid]/categories`.

#### <kbd>DELETE</kbd> `/budgets/[bid]/categories/[cid]`

1. **Transaction:**
    - Delete row in `categories`
    - Delete periods in `periods`
    - Delete transactions with this category

> [!NOTE]  
> Maybe this can be done with a single `delete` by linking primary/foreign keys in the tables?

### Transactions

#### <kbd>GET</kbd> `/transactions`

1. Get all transactions for user from `transactions`

#### <kbd>PUT</kbd> `/transactions`

1. **Transaction:**
    - Decrement transaction period for old transaction (if exists)
    - Increment transaction period for new transaction
    - Upsert transaction to `transactions`

#### <kbd>DELETE</kbd> `/transactions/[tid]`

1. **Transaction:**
    - Decrement transaction period for current transaction
    - Delete transaction from `transactions`