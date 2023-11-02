# API Overview

## Tables

## Endpoints

### <kbd>PUT</kbd> `/budgets/[id]/categories`

1. Get current category from `categories`
2. If recurrence has changed or if category is new:
    - Compute new periods based on recurrence.
    - Get all transactions for category from `transactions`.
    - **[RACE]** Race condition if transaction is added here before committing to periods.
    - Compute new periods' actual amounts based on transactions.
    - **Transaction:**
        - Upsert row in `categories` with new categories
        - Delete all periods for this category in `periods`
        - Add periods to `periods`
3. If recurrence has not changed:
    - Upsert row in `categories` with new category.

### <kbd>DELETE</kbd> `/budgets/[b]/categories/[c]`

1. **Transaction:**
    - Delete row in `categories`
    - Delete periods in `periods`
    - Delete transactions for `transactions` with this category

> [!NOTE]  
> Maybe this can be done with a single `delete` by linking primary/foreign keys in the tables?

